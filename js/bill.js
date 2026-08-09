// Schermata 3 — Conto: voci, divisioni (tutti/alcuni/singolo), coperto, acqua,
// mancia/sconto e verifica dello scontrino con l'OCR.

import { parsePrice, fmtCents, uid, diners, compute, itemTotal, itemParticipants } from './model.js';
import { compareReceipt } from './ocr-parse.js';
import { renderMiniTable } from './table.js';
import { startOcrFlow } from './menu.js';
import { esc, openDialog, toast } from './ui.js';

const SPLIT_LABEL = { all: 'diviso fra tutti', some: 'diviso fra alcuni', one: 'alla carta' };

export function renderBill(root, ctx) {
  const { state } = ctx;
  const res = compute(state);
  const ds = diners(state);

  const itemRows = state.items.map((item) => {
    const parts = itemParticipants(state, item);
    const dots = parts.slice(0, 6).map((s) => `<span class="dot" style="background:${s.color}"></span>`).join('')
      + (parts.length > 6 ? `<span class="dot more">+${parts.length - 6}</span>` : '');
    const qty = item.qty > 1 ? `${item.qty} × ${fmtCents(item.unitPrice)} — ` : '';
    const unassigned = !parts.length ? ' ⚠️ nessuno selezionato' : '';
    return `
      <div class="item-row" data-id="${item.id}">
        <div class="item-main">
          <div class="item-label">${esc(item.label)}</div>
          <div class="item-sub">${qty}${SPLIT_LABEL[item.split]}${parts.length && item.split !== 'all' ? ` (${parts.length})` : ''}${unassigned}</div>
          <div class="dots">${dots}</div>
        </div>
        <div class="item-price">${fmtCents(itemTotal(item))}</div>
      </div>`;
  }).join('');

  const adj = state.adjustments;
  const tipLabel = adj.tipMode === 'pct' ? `${adj.tipValue}%` : adj.tipMode === 'amt' ? fmtCents(adj.tipValue) : 'no';
  const discLabel = adj.discountMode === 'pct' ? `${adj.discountValue}%` : adj.discountMode === 'amt' ? fmtCents(adj.discountValue) : 'no';

  root.innerHTML = `
    ${ds.length === 0 ? '<div class="card"><p class="hint">⚠️ Prima aggiungi i commensali nella schermata <b>Tavolo</b>.</p></div>' : ''}
    <div class="card">
      <h2>Voci del conto</h2>
      ${itemRows || '<div class="empty-state"><div class="big">🧾</div>Il conto è vuoto.<br>Aggiungi le voci o riprendile dal menù.</div>'}
      <div class="totalbar">
        <span>Totale</span>
        <span>
          <span class="${res.unassigned.length ? 'balance-warn' : 'balance-ok'}">
            ${res.unassigned.length ? `${res.unassigned.length} voci da assegnare` : 'quote quadrate ✓'}
          </span>
          <span class="amount">&nbsp;${fmtCents(res.grandTotal)}</span>
        </span>
      </div>
    </div>
    <div class="row wrap" style="margin-bottom:12px">
      <button class="btn primary" id="add-item" style="flex:1">＋ Voce</button>
      <button class="btn" id="from-menu" ${state.menu.length ? '' : 'disabled'}>🍝 Dal menù</button>
      <button class="btn" id="coperto-btn">🥖 Coperto</button>
      <button class="btn" id="acqua-btn">💧 Acqua</button>
    </div>
    <div class="card">
      <h2>Mancia e sconto</h2>
      <div class="row">
        <button class="btn small" id="tip-btn">💛 Mancia: ${tipLabel}</button>
        <button class="btn small" id="disc-btn">🏷 Sconto: ${discLabel}</button>
      </div>
    </div>
    <div class="card">
      <h2>🧾 Verifica lo scontrino</h2>
      <p class="hint" style="margin-bottom:10px">Fotografa il conto del ristorante: l’app lo confronta con le voci inserite e ti dice se manca qualcosa o c’è qualcosa in più.</p>
      <button class="btn block" id="ocr-receipt">📷 Fotografa lo scontrino</button>
      <input type="file" accept="image/*" id="receipt-file" hidden>
    </div>
  `;

  root.querySelectorAll('.item-row').forEach((r) => r.addEventListener('click', () => {
    const item = state.items.find((i) => i.id === r.dataset.id);
    if (item) openItemEditor(item, ctx);
  }));
  root.querySelector('#add-item').addEventListener('click', () => openItemEditor(null, ctx));
  root.querySelector('#from-menu').addEventListener('click', () => openFromMenu(ctx));
  root.querySelector('#coperto-btn').addEventListener('click', () => openCoperto(ctx));
  root.querySelector('#acqua-btn').addEventListener('click', () => {
    openItemEditor(null, ctx, { label: 'Acqua', split: 'all' });
  });
  root.querySelector('#tip-btn').addEventListener('click', () => openAdjust(ctx, 'tip'));
  root.querySelector('#disc-btn').addEventListener('click', () => openAdjust(ctx, 'discount'));

  const receiptInput = root.querySelector('#receipt-file');
  root.querySelector('#ocr-receipt').addEventListener('click', () => receiptInput.click());
  receiptInput.addEventListener('change', () => {
    if (receiptInput.files[0]) {
      ctx.onReceiptRows = (rows) => openReceiptDiff(rows, ctx);
      startOcrFlow(receiptInput.files[0], ctx, 'receipt');
    }
    receiptInput.value = '';
  });
}

// editor voce: nome, prezzo, quantità, divisione, partecipanti sulla mini-pianta
export function openItemEditor(item, ctx, preset = {}) {
  const { state } = ctx;
  const isNew = !item;
  const draft = {
    label: item?.label ?? preset.label ?? '',
    unitPrice: item?.unitPrice ?? preset.unitPrice ?? null,
    qty: item?.qty ?? preset.qty ?? 1,
    split: item?.split ?? preset.split ?? 'all',
    participants: new Set(item?.participants ?? preset.participants ?? []),
  };
  const dlg = openDialog(`
    <h3>${isNew ? 'Nuova voce' : 'Modifica voce'}</h3>
    <label class="field"><span>Cosa</span>
      <input type="text" id="it-label" value="${esc(draft.label)}" placeholder="es. Vino rosso">
    </label>
    <div class="row">
      <label class="field" style="flex:1"><span>Prezzo unitario (€)</span>
        <input type="text" inputmode="decimal" id="it-price" value="${draft.unitPrice != null ? fmtCents(draft.unitPrice, false) : ''}" placeholder="18,00">
      </label>
      <label class="field" style="width:110px"><span>Quantità</span>
        <input type="number" min="1" max="99" id="it-qty" value="${draft.qty}">
      </label>
    </div>
    <label class="field"><span>Chi la paga?</span>
      <div class="seg" id="split-seg">
        <button data-split="all" class="${draft.split === 'all' ? 'active' : ''}">Tutti</button>
        <button data-split="some" class="${draft.split === 'some' ? 'active' : ''}">Alcuni</button>
        <button data-split="one" class="${draft.split === 'one' ? 'active' : ''}">Uno solo</button>
      </div>
    </label>
    <div id="mini-table" style="${draft.split === 'all' ? 'display:none' : ''}"></div>
    <p class="hint" id="mini-hint" style="text-align:center; ${draft.split === 'all' ? 'display:none' : ''}">Tocca i posti di chi partecipa</p>
    <div class="dialog-actions">
      ${isNew ? '<button class="btn ghost" data-close>Annulla</button>' : '<button class="btn ghost" id="it-del">🗑 Elimina</button>'}
      <button class="btn primary" id="it-ok">${isNew ? 'Aggiungi' : 'Salva'}</button>
    </div>
  `);

  const mini = dlg.querySelector('#mini-table');
  const refreshMini = () => {
    const show = draft.split !== 'all';
    mini.style.display = show ? '' : 'none';
    dlg.querySelector('#mini-hint').style.display = show ? '' : 'none';
    if (show) renderMiniTable(mini, state, draft.participants, () => {});
  };
  refreshMini();

  dlg.querySelector('#split-seg').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-split]');
    if (!b) return;
    draft.split = b.dataset.split;
    dlg.querySelectorAll('#split-seg button').forEach((x) => x.classList.toggle('active', x === b));
    refreshMini();
  });

  dlg.querySelector('#it-ok').addEventListener('click', () => {
    const label = dlg.querySelector('#it-label').value.trim();
    const unitPrice = parsePrice(dlg.querySelector('#it-price').value);
    const qty = Math.max(1, parseInt(dlg.querySelector('#it-qty').value, 10) || 1);
    if (!label || unitPrice === null || unitPrice <= 0) { toast('Servono nome e prezzo validi'); return; }
    let participants = [...draft.participants];
    if (draft.split === 'one' && participants.length > 1) participants = participants.slice(-1);
    if (draft.split !== 'all' && participants.length === 0) { toast('Tocca almeno un posto sulla pianta'); return; }
    const data = { label, unitPrice, qty, split: draft.split, participants: draft.split === 'all' ? [] : participants };
    if (isNew) state.items.push({ id: uid('i'), ...data });
    else Object.assign(item, data);
    dlg.close();
    ctx.save(); ctx.rerender();
  });

  dlg.querySelector('#it-del')?.addEventListener('click', () => {
    state.items = state.items.filter((i) => i.id !== item.id);
    dlg.close();
    ctx.save(); ctx.rerender();
  });
}

function openFromMenu(ctx) {
  const { state } = ctx;
  const dlg = openDialog(`
    <h3>🍝 Aggiungi dal menù</h3>
    ${state.menu.map((m) => `
      <div class="item-row" data-id="${m.id}">
        <div class="item-main"><div class="item-label">${esc(m.label)}</div></div>
        <div class="item-price">${fmtCents(m.price)}</div>
      </div>`).join('')}
    <div class="dialog-actions"><button class="btn ghost" data-close>Chiudi</button></div>
  `);
  dlg.querySelectorAll('.item-row').forEach((r) => r.addEventListener('click', () => {
    const dish = state.menu.find((m) => m.id === r.dataset.id);
    dlg.close();
    openItemEditor(null, ctx, { label: dish.label, unitPrice: dish.price, split: 'all' });
  }));
}

function openCoperto(ctx) {
  const { state } = ctx;
  const n = diners(state).length;
  const dlg = openDialog(`
    <h3>🥖 Coperto</h3>
    <label class="field"><span>Importo a persona (€) — ${n} ${n === 1 ? 'commensale' : 'commensali'}</span>
      <input type="text" inputmode="decimal" id="cop-val" value="${state.settings.copertoPerPerson ? fmtCents(state.settings.copertoPerPerson, false) : ''}" placeholder="2,50">
    </label>
    <div class="dialog-actions">
      <button class="btn ghost" data-close>Annulla</button>
      <button class="btn primary" id="cop-ok">Salva</button>
    </div>
  `);
  dlg.querySelector('#cop-ok').addEventListener('click', () => {
    const v = parsePrice(dlg.querySelector('#cop-val').value);
    state.settings.copertoPerPerson = v && v > 0 ? v : 0;
    dlg.close();
    ctx.save(); ctx.rerender();
  });
}

function openAdjust(ctx, kind) {
  const { state } = ctx;
  const adj = state.adjustments;
  const mode = kind === 'tip' ? adj.tipMode : adj.discountMode;
  const value = kind === 'tip' ? adj.tipValue : adj.discountValue;
  const title = kind === 'tip' ? '💛 Mancia' : '🏷 Sconto';
  const dlg = openDialog(`
    <h3>${title}</h3>
    <div class="seg" id="adj-seg" style="margin-bottom:12px">
      <button data-m="none" class="${mode === 'none' ? 'active' : ''}">Niente</button>
      <button data-m="pct" class="${mode === 'pct' ? 'active' : ''}">%</button>
      <button data-m="amt" class="${mode === 'amt' ? 'active' : ''}">€</button>
    </div>
    <label class="field" id="adj-field" style="${mode === 'none' ? 'display:none' : ''}"><span id="adj-label">${mode === 'pct' ? 'Percentuale' : 'Importo (€)'}</span>
      <input type="text" inputmode="decimal" id="adj-val" value="${mode === 'pct' ? (value || '') : mode === 'amt' ? fmtCents(value, false) : ''}">
    </label>
    <p class="hint">Viene ripartito in proporzione alla quota di ciascuno.</p>
    <div class="dialog-actions">
      <button class="btn ghost" data-close>Annulla</button>
      <button class="btn primary" id="adj-ok">Salva</button>
    </div>
  `);
  let curMode = mode;
  dlg.querySelector('#adj-seg').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-m]');
    if (!b) return;
    curMode = b.dataset.m;
    dlg.querySelectorAll('#adj-seg button').forEach((x) => x.classList.toggle('active', x === b));
    dlg.querySelector('#adj-field').style.display = curMode === 'none' ? 'none' : '';
    dlg.querySelector('#adj-label').textContent = curMode === 'pct' ? 'Percentuale' : 'Importo (€)';
  });
  dlg.querySelector('#adj-ok').addEventListener('click', () => {
    let v = 0;
    if (curMode === 'pct') v = Math.max(0, parseFloat(String(dlg.querySelector('#adj-val').value).replace(',', '.')) || 0);
    else if (curMode === 'amt') v = Math.max(0, parsePrice(dlg.querySelector('#adj-val').value) || 0);
    if (kind === 'tip') { adj.tipMode = curMode; adj.tipValue = v; }
    else { adj.discountMode = curMode; adj.discountValue = v; }
    dlg.close();
    ctx.save(); ctx.rerender();
  });
}

// confronto scontrino ↔ voci inserite
function openReceiptDiff(rows, ctx) {
  const { state } = ctx;
  const diff = compareReceipt(state.items, rows);
  const fmtLine = (label, right, cls) => `<div class="diff-line"><span>${esc(label)}</span><span class="${cls}">${right}</span></div>`;
  let html = '';
  if (diff.matched.length) {
    html += `<h2 style="margin-top:4px">✓ Corrispondono (${diff.matched.length})</h2>`
      + diff.matched.map((m) => fmtLine(m.item.label, fmtCents(m.item.unitPrice * (m.item.qty || 1)), 'diff-ok')).join('');
  }
  if (diff.priceDiffs.length) {
    html += `<h2 style="margin-top:12px">≠ Prezzo diverso (${diff.priceDiffs.length})</h2>`
      + diff.priceDiffs.map((d) => fmtLine(d.item.label, `${fmtCents(d.appTotal)} → ${fmtCents(d.receiptTotal)}`, 'diff-warn')).join('');
  }
  if (diff.onlyOnReceipt.length) {
    html += `<h2 style="margin-top:12px">🧾 Solo sullo scontrino (${diff.onlyOnReceipt.length})</h2>`
      + diff.onlyOnReceipt.map((l) => fmtLine(`${l.qty > 1 ? `${l.qty} × ` : ''}${l.label}`, fmtCents(l.price * (l.qty || 1)), 'diff-bad')).join('');
  }
  if (diff.onlyInApp.length) {
    html += `<h2 style="margin-top:12px">📱 Solo nell’app (${diff.onlyInApp.length})</h2>`
      + diff.onlyInApp.map((i) => fmtLine(i.label, fmtCents(i.unitPrice * (i.qty || 1)), 'diff-bad')).join('');
  }
  const clean = !diff.priceDiffs.length && !diff.onlyOnReceipt.length && !diff.onlyInApp.length;
  const dlg = openDialog(`
    <h3>🧾 Scontrino vs conto</h3>
    ${clean ? '<p class="diff-ok" style="font-weight:700">Tutto torna: scontrino e conto coincidono ✓</p>' : html}
    <div class="dialog-actions">
      ${diff.onlyOnReceipt.length ? '<button class="btn amber" id="import-missing">＋ Importa le voci mancanti</button>' : ''}
      <button class="btn" data-close>Chiudi</button>
    </div>
  `);
  dlg.querySelector('#import-missing')?.addEventListener('click', () => {
    for (const l of diff.onlyOnReceipt) {
      const isCoperto = /coperto/i.test(l.label);
      if (isCoperto && diners(state).length && l.qty >= 1) {
        state.settings.copertoPerPerson = l.price;
      } else {
        state.items.push({ id: uid('i'), label: l.label, unitPrice: l.price, qty: l.qty || 1, split: 'all', participants: [] });
      }
    }
    dlg.close();
    toast('Voci importate: controlla chi le paga ✅');
    ctx.save(); ctx.rerender();
  });
}
