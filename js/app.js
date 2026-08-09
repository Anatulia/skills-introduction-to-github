// Bootstrap dell'app: stato, tab, import delle scelte arrivate via link.

import { createState, ensureSeats, uid, diners, fmtCents } from './model.js';
import { saveCurrent, loadCurrent, saveToHistory } from './storage.js';
import { decodePayload } from './share.js';
import { renderTavolo } from './tavolo.js';
import { renderMenu } from './menu.js';
import { renderBill } from './bill.js';
import { renderQuote, renderIncassa } from './settle.js';
import { openHistory, historyEntry } from './history.js';
import { esc, openDialog, toast } from './ui.js';

const SCREENS = {
  tavolo: renderTavolo,
  menu: renderMenu,
  conto: renderBill,
  quote: renderQuote,
  incassa: renderIncassa,
};

let state = loadCurrent() || createState();
let activeTab = 'tavolo';

const ctx = {
  get state() { return state; },
  save: () => saveCurrent(state),
  rerender: () => render(),
  ensureSeats: () => ensureSeats(state),
  setTab: (tab) => { activeTab = tab; render(); },
  openHistory: (mode) => openHistory(ctx, mode),
  replaceState: (next) => { state = next; ensureSeats(state); },
  newDinner: () => {
    state = createState();
    ensureSeats(state);
    saveCurrent(state);
    activeTab = 'tavolo';
    render();
    toast('Nuova cena ✨');
  },
  endDinner: () => {
    if (!diners(state).length) { toast('Non c’è nessuno a tavola'); return; }
    const dlg = openDialog(`
      <h3>🏁 Fine cena</h3>
      <p class="hint">La cena viene salvata nello storico (persone, conto e quote), così potrai riusare il gruppo la prossima volta.</p>
      <div class="dialog-actions">
        <button class="btn ghost" data-close>Annulla</button>
        <button class="btn primary" id="end-ok">Salva e chiudi</button>
      </div>`);
    dlg.querySelector('#end-ok').addEventListener('click', () => {
      saveToHistory(historyEntry(structuredClone(state)));
      dlg.close();
      ctx.newDinner();
    });
  },
  onReceiptRows: null, // impostato dalla schermata Conto
};

function render() {
  ensureSeats(state);
  document.querySelectorAll('.tabbar button').forEach((b) => b.classList.toggle('active', b.dataset.tab === activeTab));
  document.querySelectorAll('.screen').forEach((s) => {
    const active = s.dataset.screen === activeTab;
    s.classList.toggle('active', active);
    if (active) SCREENS[activeTab](s, ctx);
  });
}

function wireChrome() {
  const nameInput = document.querySelector('input.dinner-name');
  nameInput.value = state.dinnerName;
  nameInput.addEventListener('change', () => { state.dinnerName = nameInput.value.trim(); ctx.save(); });
  document.querySelector('#history-btn').addEventListener('click', () => openHistory(ctx));
  document.querySelector('.tabbar').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-tab]');
    if (b) ctx.setTab(b.dataset.tab);
  });
}

// scelte di un ospite arrivate via link (#payload con t='picks')
async function handleIncomingHash() {
  const raw = window.location.hash.slice(1);
  if (!raw || raw.length < 8) return;
  let payload = null;
  try { payload = await decodePayload(raw); } catch { return; }
  history.replaceState(null, '', window.location.pathname);
  if (!payload || payload.t !== 'picks') return;

  const seat = state.table.seats.find((s) => s.id === payload.seat?.id)
    || diners(state).find((s) => s.name.toLowerCase() === (payload.seat?.name || '').toLowerCase());
  const who = payload.seat?.name || 'un ospite';
  const total = payload.picks.reduce((a, p) => a + p.price * (p.qty || 1), 0);
  const dlg = openDialog(`
    <h3>📥 Scelte di ${esc(who)}</h3>
    ${payload.picks.map((p) => `<div class="diff-line"><span>${p.qty > 1 ? `${p.qty} × ` : ''}${esc(p.label)}</span><span>${fmtCents(p.price * (p.qty || 1))}</span></div>`).join('')}
    <div class="totalbar"><span>Totale</span><span class="amount">${fmtCents(total)}</span></div>
    ${seat ? '' : `<p class="hint">⚠️ Non trovo «${esc(who)}» a tavola: le voci verranno aggiunte senza assegnazione.</p>`}
    <div class="dialog-actions">
      <button class="btn ghost" data-close>Ignora</button>
      <button class="btn primary" id="import-picks">Aggiungi al conto</button>
    </div>`);
  dlg.querySelector('#import-picks').addEventListener('click', () => {
    for (const p of payload.picks) {
      state.items.push({
        id: uid('i'),
        label: p.label,
        unitPrice: p.price,
        qty: p.qty || 1,
        split: seat ? 'one' : 'some',
        participants: seat ? [seat.id] : [],
      });
    }
    dlg.close();
    toast(`${payload.picks.length} voci di ${who} aggiunte al conto ✅`);
    ctx.save();
    ctx.setTab('conto');
  });
}

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { /* offline non disponibile */ });
  });
}

ensureSeats(state);
wireChrome();
render();
handleIncomingHash();
