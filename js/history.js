// Storico cene e gruppi salvati: riapri una cena o riusa un gruppo di amici.

import { fmtCents, compute, diners, createState } from './model.js';
import { loadHistory, deleteFromHistory } from './storage.js';
import { esc, openDialog, toast } from './ui.js';

export function openHistory(ctx, mode = 'all') {
  const history = loadHistory();
  const rows = history.map((entry, i) => `
    <div class="history-item" data-i="${i}">
      <div class="row">
        <div style="flex:1;min-width:0">
          <div class="title">${esc(entry.name || 'Cena')}</div>
          <div class="sub">${esc(entry.date || '')} — ${entry.people.length} persone — ${fmtCents(entry.total)}</div>
          <div class="sub">${entry.people.map((p) => esc(p.name)).join(', ')}</div>
        </div>
      </div>
      <div class="row" style="margin-top:6px">
        <button class="btn small" data-reuse="${i}">👥 Riusa gruppo</button>
        ${mode === 'all' ? `<button class="btn small ghost" data-reopen="${i}">📂 Riapri cena</button>` : ''}
        <span class="spacer"></span>
        <button class="btn small ghost" data-del="${i}" style="color:var(--red)">🗑</button>
      </div>
    </div>`).join('');

  const dlg = openDialog(`
    <h3>🕰 Cene passate</h3>
    ${rows || '<div class="empty-state"><div class="big">🕰</div>Nessuna cena salvata.<br>A fine cena premi «Fine cena» per salvarla qui.</div>'}
    <div class="dialog-actions">
      ${mode === 'all' ? '<button class="btn ghost" id="new-dinner">✨ Nuova cena vuota</button>' : ''}
      <button class="btn" data-close>Chiudi</button>
    </div>
  `);

  dlg.querySelectorAll('[data-reuse]').forEach((b) => b.addEventListener('click', () => {
    const entry = history[parseInt(b.dataset.reuse, 10)];
    const fresh = createState();
    fresh.table.shape = entry.shape || 'rect';
    fresh.table.seatCount = Math.max(entry.people.length, 2);
    fresh.table.seats = [];
    ctx.replaceState(fresh);
    ctx.ensureSeats();
    entry.people.forEach((p, i) => {
      const seat = ctx.state.table.seats[i];
      seat.name = p.name;
      seat.weight = p.weight || 1;
    });
    dlg.close();
    toast(`Gruppo di ${entry.people.length} ripreso 👥`);
    ctx.save(); ctx.setTab('tavolo');
  }));

  dlg.querySelectorAll('[data-reopen]').forEach((b) => b.addEventListener('click', () => {
    const entry = history[parseInt(b.dataset.reopen, 10)];
    if (entry.state) {
      ctx.replaceState(entry.state);
      dlg.close();
      toast('Cena riaperta 📂');
      ctx.save(); ctx.setTab('quote');
    }
  }));

  dlg.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => {
    deleteFromHistory(parseInt(b.dataset.del, 10));
    dlg.close();
    openHistory(ctx, mode);
  }));

  dlg.querySelector('#new-dinner')?.addEventListener('click', () => {
    dlg.close();
    ctx.newDinner();
  });
}

// voce di storico a partire dallo stato corrente
export function historyEntry(state) {
  const res = compute(state);
  return {
    name: state.dinnerName || 'Cena',
    date: new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }),
    shape: state.table.shape,
    people: diners(state).map((s) => ({ name: s.name, weight: s.weight || 1 })),
    total: res.grandTotal + res.roundExtraTotal,
    state,
  };
}
