// Modello dati e motore di calcolo delle quote.
// Tutti gli importi sono in centesimi interi: mai aritmetica in virgola mobile sui prezzi.

export const SEAT_COLORS = [
  '#e07a5f', '#81b29a', '#f2cc8f', '#7d9dd1', '#c77dbb',
  '#6fc2c9', '#e5989b', '#a3b18a', '#f4a261', '#9d8df1',
  '#d4a373', '#90be6d', '#f28482', '#57a7b3', '#b5838d',
  '#ffd166', '#8ecae6', '#cdb4db', '#95d5b2', '#f8961e',
];

let idCounter = 0;
export function uid(prefix = 'x') {
  idCounter += 1;
  return `${prefix}${idCounter.toString(36)}${(typeof performance !== 'undefined' ? Math.floor(performance.now() * 1000) % 46656 : 0).toString(36)}`;
}

// ---------- denaro ----------

// "12,50" | "12.50" | "12" | "€ 12,50" → 1250 ; null se non interpretabile
export function parsePrice(text) {
  if (typeof text === 'number') return Math.round(text * 100);
  if (!text) return null;
  const cleaned = String(text).replace(/[€\s]/g, '').replace(/[^0-9.,-]/g, '');
  if (!cleaned) return null;
  const m = cleaned.match(/^(-?\d{1,6})(?:[.,](\d{1,2}))?$/);
  if (!m) return null;
  const whole = parseInt(m[1], 10);
  const frac = m[2] ? parseInt(m[2].padEnd(2, '0'), 10) : 0;
  const sign = whole < 0 || /^-/.test(cleaned) ? -1 : 1;
  return sign * (Math.abs(whole) * 100 + frac);
}

export function fmtCents(cents, withSymbol = true) {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(Math.round(cents));
  const s = `${sign}${Math.floor(abs / 100)},${String(abs % 100).padStart(2, '0')}`;
  return withSymbol ? `${s} €` : s;
}

// ---------- stato ----------

export function createState() {
  return {
    version: 1,
    dinnerName: '',
    createdAt: null,
    table: { shape: 'rect', seatCount: 8, seats: [] }, // seats: {id,name,color,weight}
    menu: [], // {id,label,price}
    items: [], // {id,label,unitPrice,qty,split:'all'|'some'|'one',participants:[seatId]}
    adjustments: { tipMode: 'none', tipValue: 0, discountMode: 'none', discountValue: 0 },
    settings: {
      copertoPerPerson: 0,
      payerSeatId: null,
      rounding: 'none', // 'none' | 'up50' | 'up100'
      payment: { satispay: '', paypal: '', revolut: '', iban: '', phone: '' },
    },
    payments: {}, // seatId → 'pending' | 'accepted' | 'change' | 'paid'
  };
}

export function ensureSeats(state) {
  const t = state.table;
  const seats = t.seats.slice(0, t.seatCount);
  while (seats.length < t.seatCount) {
    seats.push({ id: `s${seats.length + 1}`, name: '', color: SEAT_COLORS[seats.length % SEAT_COLORS.length], weight: 1 });
  }
  t.seats = seats;
  return state;
}

export function diners(state) {
  return state.table.seats.filter((s) => s.name && s.name.trim() !== '');
}

// peso in "mezzi" per restare su interi: 0.5→1, 1→2, 1.5→3, 2→4
function halfWeight(seat) {
  const w = typeof seat.weight === 'number' && seat.weight > 0 ? seat.weight : 1;
  return Math.max(1, Math.round(w * 2));
}

// ---------- ripartizione con metodo dei resti massimi (quadratura garantita) ----------

// participants: [{id, w}] con w intero > 0. Ritorna Map id→cents, somma esattamente totalCents.
export function splitAmount(totalCents, participants) {
  const out = new Map();
  if (!participants.length) return out;
  const W = participants.reduce((a, p) => a + p.w, 0);
  let assigned = 0;
  const rems = [];
  for (const p of participants) {
    const exact = totalCents * p.w;
    const base = Math.floor(exact / W);
    out.set(p.id, base);
    assigned += base;
    rems.push({ id: p.id, rem: exact % W });
  }
  let leftover = totalCents - assigned; // 0 ≤ leftover < n (per totali positivi)
  rems.sort((a, b) => b.rem - a.rem || (a.id < b.id ? -1 : 1));
  for (let i = 0; leftover > 0; i = (i + 1) % rems.length, leftover -= 1) {
    out.set(rems[i].id, out.get(rems[i].id) + 1);
  }
  // totali negativi (sconti): leftover può essere negativo
  let deficit = totalCents - [...out.values()].reduce((a, b) => a + b, 0);
  for (let i = 0; deficit < 0; i = (i + 1) % rems.length, deficit += 1) {
    out.set(rems[i].id, out.get(rems[i].id) - 1);
  }
  return out;
}

export function itemTotal(item) {
  const qty = item.qty && item.qty > 0 ? item.qty : 1;
  return (item.unitPrice || 0) * qty;
}

export function itemParticipants(state, item) {
  const ds = diners(state);
  if (item.split === 'all') return ds;
  const ids = new Set(item.participants || []);
  return ds.filter((s) => ids.has(s.id));
}

// ---------- calcolo completo ----------

export function compute(state) {
  const ds = diners(state);
  const per = new Map(); // seatId → {seat, lines:[], subtotal, coperto, tip, discount, total, roundedTotal, roundExtra}
  for (const s of ds) per.set(s.id, { seat: s, lines: [], subtotal: 0, coperto: 0, tip: 0, discount: 0, total: 0, roundedTotal: 0, roundExtra: 0 });

  const unassigned = [];
  let itemsTotal = 0;

  for (const item of state.items) {
    const total = itemTotal(item);
    const parts = itemParticipants(state, item);
    if (!parts.length) { unassigned.push(item); continue; }
    itemsTotal += total;
    const shares = splitAmount(total, parts.map((s) => ({ id: s.id, w: halfWeight(s) })));
    for (const s of parts) {
      const cents = shares.get(s.id) || 0;
      const rec = per.get(s.id);
      rec.lines.push({ itemId: item.id, label: item.label, cents, sharedWith: parts.length });
      rec.subtotal += cents;
    }
  }

  // coperto: importo fisso a persona (non pesato)
  const coperto = state.settings.copertoPerPerson || 0;
  let copertoTotal = 0;
  if (coperto > 0) {
    for (const s of ds) { per.get(s.id).coperto = coperto; copertoTotal += coperto; }
  }

  const baseTotal = itemsTotal + copertoTotal;

  // mancia e sconto, pro-quota sul subtotale di ciascuno
  const adj = state.adjustments || {};
  let tipTotal = 0;
  if (adj.tipMode === 'pct') tipTotal = Math.round(baseTotal * (adj.tipValue || 0) / 100);
  else if (adj.tipMode === 'amt') tipTotal = adj.tipValue || 0;
  let discountTotal = 0;
  if (adj.discountMode === 'pct') discountTotal = Math.round(baseTotal * (adj.discountValue || 0) / 100);
  else if (adj.discountMode === 'amt') discountTotal = adj.discountValue || 0;
  discountTotal = Math.min(discountTotal, baseTotal + tipTotal);

  const proRataParts = ds.map((s) => {
    const rec = per.get(s.id);
    const base = rec.subtotal + rec.coperto;
    return { id: s.id, w: base > 0 ? base : 0 };
  });
  const anyBase = proRataParts.some((p) => p.w > 0);
  const equalParts = ds.map((s) => ({ id: s.id, w: 1 }));
  if (tipTotal !== 0) {
    const shares = splitAmount(tipTotal, anyBase ? proRataParts.filter((p) => p.w > 0) : equalParts);
    for (const [id, c] of shares) per.get(id).tip = c;
  }
  if (discountTotal !== 0) {
    const shares = splitAmount(discountTotal, anyBase ? proRataParts.filter((p) => p.w > 0) : equalParts);
    for (const [id, c] of shares) per.get(id).discount = c;
  }

  let grandTotal = 0;
  let roundExtraTotal = 0;
  const step = state.settings.rounding === 'up100' ? 100 : state.settings.rounding === 'up50' ? 50 : 0;
  for (const s of ds) {
    const rec = per.get(s.id);
    rec.total = rec.subtotal + rec.coperto + rec.tip - rec.discount;
    grandTotal += rec.total;
    rec.roundedTotal = step > 0 ? Math.ceil(rec.total / step) * step : rec.total;
    rec.roundExtra = rec.roundedTotal - rec.total;
    roundExtraTotal += rec.roundExtra;
  }

  return {
    perSeat: per,
    diners: ds,
    itemsTotal,
    copertoTotal,
    tipTotal,
    discountTotal,
    grandTotal,           // = itemsTotal + copertoTotal + tipTotal - discountTotal, per costruzione
    roundExtraTotal,
    unassigned,
    balanced: grandTotal === baseTotal + tipTotal - discountTotal,
  };
}
