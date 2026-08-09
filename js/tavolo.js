// Schermata 1 — Tavolo: pianta, forma, numero di posti, editor del posto.

import { renderTable } from './table.js';
import { diners } from './model.js';
import { esc, openDialog } from './ui.js';

export function renderTavolo(root, ctx) {
  const { state } = ctx;
  const n = diners(state).length;
  root.innerHTML = `
    <div class="card table-wrap">
      <div id="table-canvas"></div>
      <p class="hint" style="text-align:center; margin-top:4px">
        ${n === 0 ? 'Tocca un posto per aggiungere chi c’è a tavola' : `${n} ${n === 1 ? 'commensale' : 'commensali'} a tavola`}
      </p>
    </div>
    <div class="card">
      <h2>Il tavolo</h2>
      <div class="table-controls">
        <div class="seg" id="shape-seg">
          <button data-shape="rect" class="${state.table.shape === 'rect' ? 'active' : ''}">▭ Rettangolare</button>
          <button data-shape="round" class="${state.table.shape === 'round' ? 'active' : ''}">◯ Rotondo</button>
        </div>
        <div class="stepper" aria-label="Numero di posti">
          <button id="seat-minus" aria-label="Meno posti">−</button>
          <output id="seat-count">${state.table.seatCount}</output>
          <button id="seat-plus" aria-label="Più posti">+</button>
        </div>
      </div>
    </div>
    <button class="btn block ghost" id="reuse-group">👥 Riusa un gruppo dalle cene passate</button>
  `;

  const canvas = root.querySelector('#table-canvas');
  renderTable(canvas, state, (seat) => openSeatEditor(seat, ctx));

  root.querySelector('#shape-seg').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-shape]');
    if (!b) return;
    state.table.shape = b.dataset.shape;
    ctx.save();
    ctx.rerender();
  });
  root.querySelector('#seat-minus').addEventListener('click', () => {
    if (state.table.seatCount > 2) { state.table.seatCount -= 1; ctx.ensureSeats(); ctx.save(); ctx.rerender(); }
  });
  root.querySelector('#seat-plus').addEventListener('click', () => {
    if (state.table.seatCount < 20) { state.table.seatCount += 1; ctx.ensureSeats(); ctx.save(); ctx.rerender(); }
  });
  root.querySelector('#reuse-group').addEventListener('click', () => ctx.openHistory('groups'));
}

function openSeatEditor(seat, ctx) {
  const dlg = openDialog(`
    <h3>${seat.name ? `Posto di ${esc(seat.name)}` : 'Chi siede qui?'}</h3>
    <label class="field"><span>Nome</span>
      <input type="text" id="seat-name" value="${esc(seat.name)}" placeholder="es. Anna" autocomplete="off" enterkeyhint="done">
    </label>
    <label class="field"><span>Quota (es. bimbi a metà, chi paga doppio)</span>
      <div class="seg" id="weight-seg">
        ${[[0.5, '½'], [1, '1'], [1.5, '1½'], [2, '2']].map(([w, l]) => `
          <button data-w="${w}" class="${(seat.weight || 1) === w ? 'active' : ''}">×${l}</button>`).join('')}
      </div>
    </label>
    <div class="dialog-actions">
      ${seat.name ? '<button class="btn ghost" id="seat-clear">🪑 Libera il posto</button>' : ''}
      <button class="btn primary" id="seat-ok">Conferma</button>
    </div>
  `);
  const nameInput = dlg.querySelector('#seat-name');
  nameInput.focus();
  let weight = seat.weight || 1;
  dlg.querySelector('#weight-seg').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-w]');
    if (!b) return;
    weight = parseFloat(b.dataset.w);
    dlg.querySelectorAll('#weight-seg button').forEach((x) => x.classList.toggle('active', x === b));
  });
  const commit = () => {
    seat.name = nameInput.value.trim();
    seat.weight = weight;
    dlg.close();
    ctx.save();
    ctx.rerender();
  };
  dlg.querySelector('#seat-ok').addEventListener('click', commit);
  nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') commit(); });
  dlg.querySelector('#seat-clear')?.addEventListener('click', () => {
    seat.name = '';
    seat.weight = 1;
    dlg.close();
    ctx.save();
    ctx.rerender();
  });
}
