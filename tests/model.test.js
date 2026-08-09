import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, ensureSeats, compute, parsePrice, fmtCents, splitAmount } from '../js/model.js';
import { parseOcrText, compareReceipt } from '../js/ocr-parse.js';

function makeDinner(n, weights = {}) {
  const state = createState();
  state.table.seatCount = n;
  ensureSeats(state);
  state.table.seats.forEach((s, i) => {
    s.name = `P${i + 1}`;
    if (weights[s.id]) s.weight = weights[s.id];
  });
  return state;
}

function totals(res) {
  const m = {};
  for (const [id, rec] of res.perSeat) m[id] = rec.total;
  return m;
}

test('parsePrice interpreta i formati italiani', () => {
  assert.equal(parsePrice('12,50'), 1250);
  assert.equal(parsePrice('12.50'), 1250);
  assert.equal(parsePrice('€ 7'), 700);
  assert.equal(parsePrice('7,5'), 750);
  assert.equal(parsePrice('abc'), null);
  assert.equal(fmtCents(1250), '12,50 €');
});

test('3 bottiglie di vino divise in 8 su 15 commensali', () => {
  const state = makeDinner(15);
  const otto = state.table.seats.slice(0, 8).map((s) => s.id);
  state.items.push({ id: 'vino', label: 'Vino rosso', unitPrice: 1800, qty: 3, split: 'some', participants: otto });
  const res = compute(state);
  assert.equal(res.itemsTotal, 5400);
  assert.equal(res.grandTotal, 5400);
  const t = totals(res);
  // 5400/8 = 675 esatti a testa; gli altri 7 non pagano nulla
  for (const id of otto) assert.equal(t[id], 675);
  for (const s of state.table.seats.slice(8)) assert.equal(t[s.id], 0);
});

test('voce divisa fra tutti i 15 con quadratura al centesimo', () => {
  const state = makeDinner(15);
  state.items.push({ id: 'anti', label: 'Antipasti', unitPrice: 10000, qty: 1, split: 'all', participants: [] });
  const res = compute(state);
  const sum = Object.values(totals(res)).reduce((a, b) => a + b, 0);
  assert.equal(sum, 10000); // 100 € / 15 = 6,666… ma la somma deve fare esattamente 100
  assert.equal(res.grandTotal, 10000);
  assert.ok(res.balanced);
});

test('importo ostico 10 € / 3: nessun centesimo perso', () => {
  const shares = splitAmount(1000, [{ id: 'a', w: 2 }, { id: 'b', w: 2 }, { id: 'c', w: 2 }]);
  const vals = [...shares.values()].sort();
  assert.equal(vals.reduce((a, b) => a + b, 0), 1000);
  assert.deepEqual(vals, [333, 333, 334]);
});

test('dolce singolo: paga solo chi lo prende', () => {
  const state = makeDinner(4);
  const [a] = state.table.seats;
  state.items.push({ id: 'dolce', label: 'Tiramisù', unitPrice: 600, qty: 1, split: 'one', participants: [a.id] });
  const res = compute(state);
  const t = totals(res);
  assert.equal(t[a.id], 600);
  assert.equal(Object.values(t).reduce((x, y) => x + y, 0), 600);
});

test('coperto fisso a persona, non pesato', () => {
  const state = makeDinner(15);
  state.settings.copertoPerPerson = 250;
  const res = compute(state);
  assert.equal(res.copertoTotal, 3750);
  for (const rec of res.perSeat.values()) assert.equal(rec.total, 250);
});

test('pesi: bimbo a metà quota, uno paga doppio', () => {
  const state = makeDinner(3);
  const [a, b, c] = state.table.seats;
  a.weight = 0.5; c.weight = 2; // b resta 1 → pesi 1:2:4 in mezzi
  state.items.push({ id: 'x', label: 'Pizza', unitPrice: 7000, qty: 1, split: 'all', participants: [] });
  const res = compute(state);
  const t = totals(res);
  assert.equal(t[a.id], 1000);
  assert.equal(t[b.id], 2000);
  assert.equal(t[c.id], 4000);
});

test('mancia percentuale ripartita pro-quota', () => {
  const state = makeDinner(2);
  const [a, b] = state.table.seats;
  state.items.push({ id: 'x', label: 'Bistecca', unitPrice: 3000, qty: 1, split: 'one', participants: [a.id] });
  state.items.push({ id: 'y', label: 'Insalata', unitPrice: 1000, qty: 1, split: 'one', participants: [b.id] });
  state.adjustments = { tipMode: 'pct', tipValue: 10, discountMode: 'none', discountValue: 0 };
  const res = compute(state);
  assert.equal(res.tipTotal, 400);
  const t = totals(res);
  assert.equal(t[a.id], 3300); // 30 + 3 di mancia (75% del subtotale)
  assert.equal(t[b.id], 1100);
  assert.equal(res.grandTotal, 4400);
});

test('sconto in euro ripartito pro-quota con quadratura', () => {
  const state = makeDinner(3);
  state.items.push({ id: 'x', label: 'Menu fisso', unitPrice: 3000, qty: 3, split: 'all', participants: [] });
  state.adjustments = { tipMode: 'none', tipValue: 0, discountMode: 'amt', discountValue: 1000 };
  const res = compute(state);
  assert.equal(res.discountTotal, 1000);
  assert.equal(res.grandTotal, 8000);
  const sum = Object.values(totals(res)).reduce((a, b) => a + b, 0);
  assert.equal(sum, 8000);
});

test('arrotondamento in su a 1 € con extra tracciato', () => {
  const state = makeDinner(3);
  state.items.push({ id: 'x', label: 'Cena', unitPrice: 1000, qty: 1, split: 'all', participants: [] });
  state.settings.rounding = 'up100';
  const res = compute(state);
  for (const rec of res.perSeat.values()) {
    assert.equal(rec.roundedTotal % 100, 0);
    assert.ok(rec.roundExtra >= 0 && rec.roundExtra < 100);
  }
});

test('voce senza partecipanti finisce fra le non assegnate', () => {
  const state = makeDinner(2);
  state.items.push({ id: 'x', label: 'Caffè', unitPrice: 120, qty: 1, split: 'some', participants: [] });
  const res = compute(state);
  assert.equal(res.unassigned.length, 1);
  assert.equal(res.grandTotal, 0);
});

test('scenario completo della cena da 15', () => {
  const state = makeDinner(15);
  const ids = state.table.seats.map((s) => s.id);
  state.items.push({ id: 'vino', label: 'Vino rosso', unitPrice: 1800, qty: 3, split: 'some', participants: ids.slice(0, 8) });
  state.items.push({ id: 'anti', label: 'Antipasto misto', unitPrice: 12000, qty: 1, split: 'all', participants: [] });
  state.items.push({ id: 'dolce1', label: 'Tiramisù', unitPrice: 600, qty: 1, split: 'one', participants: [ids[2]] });
  state.items.push({ id: 'dolce2', label: 'Panna cotta', unitPrice: 550, qty: 1, split: 'one', participants: [ids[5]] });
  state.items.push({ id: 'acqua', label: 'Acqua', unitPrice: 300, qty: 5, split: 'all', participants: [] });
  state.settings.copertoPerPerson = 250;
  const res = compute(state);
  const expected = 5400 + 12000 + 600 + 550 + 1500 + 3750;
  assert.equal(res.grandTotal, expected);
  const sum = Object.values(totals(res)).reduce((a, b) => a + b, 0);
  assert.equal(sum, expected);
});

test('parseOcrText legge un menù OCR tipico', () => {
  const text = [
    'ANTIPASTI',
    'Bruschette al pomodoro ........ 6,50',
    'Tagliere di salumi — 12,00',
    'PRIMI',
    'Tagliatelle al ragu 12,50 €',
    '2 x Vino della casa 16,00',
    'TOTALE 47,00',
  ].join('\n');
  const rows = parseOcrText(text);
  const labels = rows.map((r) => r.label);
  assert.ok(labels.includes('Bruschette al pomodoro'));
  assert.ok(labels.includes('Tagliatelle al ragu'));
  const vino = rows.find((r) => r.label.toLowerCase().includes('vino'));
  assert.equal(vino.qty, 2);
  assert.equal(vino.price, 1600);
  assert.ok(!labels.some((l) => /totale/i.test(l)));
});

test('compareReceipt segnala mancanti, extra e differenze di prezzo', () => {
  const items = [
    { label: 'Tagliatelle al ragù', unitPrice: 1250, qty: 1 },
    { label: 'Vino della casa', unitPrice: 800, qty: 2 },
    { label: 'Tiramisù', unitPrice: 600, qty: 1 },
  ];
  const receipt = [
    { label: 'Tagliatelle ragu', price: 1250, qty: 1 },
    { label: 'Vino della casa', price: 900, qty: 2 },
    { label: 'Coperto', price: 250, qty: 4 },
  ];
  const diff = compareReceipt(items, receipt);
  assert.equal(diff.matched.length, 1);
  assert.equal(diff.priceDiffs.length, 1);
  assert.equal(diff.onlyInApp[0].label, 'Tiramisù');
  assert.equal(diff.onlyOnReceipt[0].label, 'Coperto');
});
