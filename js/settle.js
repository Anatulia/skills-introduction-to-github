// Schermate 4 e 5 — Quote (riepilogo per persona, condivisione, accetta/modifica)
// e Incassa (chi paga, link di pagamento, chi ha saldato, export, fine cena).

import { fmtCents, compute, diners } from './model.js';
import { initials } from './table.js';
import { encodePayload, buildQuotaPayload, guestUrl, whatsappUrl } from './share.js';
import { showQr } from './menu.js';
import { esc, openDialog, toast, shareOrCopy, copyText } from './ui.js';

const STATUS_LABEL = { pending: 'in attesa', accepted: 'accettata ✓', change: 'modifica richiesta', paid: 'pagato ✓' };

function statusChip(status) {
  const cls = status === 'paid' ? 'paid' : status === 'accepted' ? 'accepted' : status === 'change' ? 'change' : '';
  return `<span class="status-chip ${cls}">${STATUS_LABEL[status] || STATUS_LABEL.pending}</span>`;
}

async function quotaLink(state, seat, rec) {
  const payer = state.table.seats.find((s) => s.id === state.settings.payerSeatId);
  const payload = await encodePayload(buildQuotaPayload(state, seat, rec, {
    pay: state.settings.payment,
    payer: payer ? payer.name : null,
  }));
  return guestUrl(payload);
}

function quotaMessage(state, seat, rec, url) {
  const total = fmtCents(rec.roundedTotal);
  return `🍷 ${state.dinnerName || 'Cena'} — ciao ${seat.name}! La tua quota è ${total}.\nDettaglio e pagamento: ${url}`;
}

// ---------- QUOTE ----------

export function renderQuote(root, ctx) {
  const { state } = ctx;
  const res = compute(state);
  const rounding = state.settings.rounding;

  const cards = [...res.perSeat.values()].map(({ seat, ...rec }) => {
    const lines = rec.lines.map((l) => `
      <div><span>${esc(l.label)}${l.sharedWith > 1 ? ` <span style="opacity:.6">÷${l.sharedWith}</span>` : ''}</span><span class="val">${fmtCents(l.cents)}</span></div>`).join('');
    const extra = [
      rec.coperto ? `<div><span>Coperto</span><span class="val">${fmtCents(rec.coperto)}</span></div>` : '',
      rec.tip ? `<div><span>Mancia</span><span class="val">${fmtCents(rec.tip)}</span></div>` : '',
      rec.discount ? `<div><span>Sconto</span><span class="val neg">−${fmtCents(rec.discount)}</span></div>` : '',
      rec.roundExtra ? `<div><span>Arrotondamento</span><span class="val">${fmtCents(rec.roundExtra)}</span></div>` : '',
    ].join('');
    const status = state.payments[seat.id] || 'pending';
    return `
      <div class="card person-card" style="--pc:${seat.color}" data-seat="${seat.id}">
        <div class="header">
          <span class="avatar" style="background:${seat.color}">${initials(seat.name)}</span>
          <div style="flex:1;min-width:0">
            <div style="font-weight:750">${esc(seat.name)}</div>
            ${statusChip(status)}
          </div>
          <div class="person-total">${fmtCents(rec.roundedTotal)}</div>
        </div>
        <div class="quota-lines">${lines}${extra}</div>
        <div class="row" style="margin-top:8px">
          <button class="btn small" data-share="${seat.id}" style="flex:1">💬 Invia quota</button>
          <button class="btn small" data-qr="${seat.id}">⬛ QR</button>
        </div>
      </div>`;
  }).join('');

  root.innerHTML = `
    ${res.diners.length === 0 ? '<div class="card"><p class="hint">⚠️ Aggiungi prima i commensali nella schermata <b>Tavolo</b>.</p></div>' : ''}
    ${res.unassigned.length ? `<div class="card"><p class="balance-warn">⚠️ ${res.unassigned.length} voci senza partecipanti: sistemale nel <b>Conto</b>.</p></div>` : ''}
    <div class="card">
      <div class="row">
        <h2 style="margin-bottom:0">Totale cena</h2>
        <span class="spacer"></span>
        <span class="amount" style="font-size:22px;font-weight:800;color:var(--amber)">${fmtCents(res.grandTotal + res.roundExtraTotal)}</span>
      </div>
      <p class="hint" style="margin-top:6px">${res.balanced ? 'La somma delle quote coincide col totale del conto, al centesimo ✓' : ''}
      ${res.roundExtraTotal ? ` (di cui ${fmtCents(res.roundExtraTotal)} di arrotondamenti)` : ''}</p>
      <label class="field" style="margin-top:10px;margin-bottom:0"><span>Arrotonda le quote</span>
        <div class="seg" id="round-seg">
          <button data-r="none" class="${rounding === 'none' ? 'active' : ''}">Al centesimo</button>
          <button data-r="up50" class="${rounding === 'up50' ? 'active' : ''}">50 cent ↑</button>
          <button data-r="up100" class="${rounding === 'up100' ? 'active' : ''}">1 € ↑</button>
        </div>
      </label>
    </div>
    ${cards}
  `;

  root.querySelector('#round-seg')?.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-r]');
    if (!b) return;
    state.settings.rounding = b.dataset.r;
    ctx.save(); ctx.rerender();
  });

  root.querySelectorAll('[data-share]').forEach((b) => b.addEventListener('click', async () => {
    const seat = res.diners.find((s) => s.id === b.dataset.share);
    const rec = res.perSeat.get(seat.id);
    const url = await quotaLink(state, seat, rec);
    shareOrCopy(quotaMessage(state, seat, rec, url), `Quota di ${seat.name}`);
  }));
  root.querySelectorAll('[data-qr]').forEach((b) => b.addEventListener('click', async () => {
    const seat = res.diners.find((s) => s.id === b.dataset.qr);
    const rec = res.perSeat.get(seat.id);
    const url = await quotaLink(state, seat, rec);
    showQr(url, `Quota di ${seat.name}`);
  }));
  root.querySelectorAll('.person-card .header').forEach((h) => h.addEventListener('click', () => {
    const seatId = h.closest('.person-card').dataset.seat;
    cycleStatus(state, seatId, ctx);
  }));
}

function cycleStatus(state, seatId, ctx) {
  const order = ['pending', 'accepted', 'change', 'paid'];
  const cur = state.payments[seatId] || 'pending';
  state.payments[seatId] = order[(order.indexOf(cur) + 1) % order.length];
  ctx.save(); ctx.rerender();
}

// ---------- INCASSA ----------

export function renderIncassa(root, ctx) {
  const { state } = ctx;
  const res = compute(state);
  const ds = res.diners;
  const pay = state.settings.payment;
  const payer = ds.find((s) => s.id === state.settings.payerSeatId) || null;

  const unpaid = ds.filter((s) => (payer ? s.id !== payer.id : true) && state.payments[s.id] !== 'paid');
  const unpaidTotal = unpaid.reduce((a, s) => a + res.perSeat.get(s.id).roundedTotal, 0);

  const rows = ds.map((seat) => {
    const rec = res.perSeat.get(seat.id);
    const isPayer = payer && seat.id === payer.id;
    const paid = state.payments[seat.id] === 'paid';
    return `
      <div class="item-row" data-seat="${seat.id}">
        <span class="avatar" style="background:${seat.color};width:32px;height:32px;font-size:12px">${initials(seat.name)}</span>
        <div class="item-main">
          <div class="item-label">${esc(seat.name)}${isPayer ? ' <span class="status-chip accepted">paga alla cassa</span>' : ''}</div>
          <div class="item-sub">${fmtCents(rec.roundedTotal)}</div>
        </div>
        ${isPayer ? '' : `
          <button class="btn small ${paid ? '' : 'ghost'}" data-paid="${seat.id}">${paid ? '✓ Pagato' : 'Da pagare'}</button>
          <button class="icon-btn" data-remind="${seat.id}" aria-label="Invia richiesta" style="min-width:38px;min-height:38px">💬</button>`}
      </div>`;
  }).join('');

  root.innerHTML = `
    <div class="card">
      <h2>💳 Chi paga alla cassa?</h2>
      <select id="payer-sel">
        <option value="">Ognuno paga la sua parte alla cassa</option>
        ${ds.map((s) => `<option value="${s.id}" ${state.settings.payerSeatId === s.id ? 'selected' : ''}>${esc(s.name)} anticipa tutto</option>`).join('')}
      </select>
      <p class="hint" style="margin-top:8px">${payer ? `Gli altri rimborsano ${esc(payer.name)} con Satispay, PayPal, Revolut o bonifico.` : 'Ognuno salda la propria quota direttamente al ristorante.'}</p>
    </div>
    ${payer ? `
    <div class="card">
      <h2>📲 I tuoi riferimenti per ricevere i soldi</h2>
      <label class="field"><span>Satispay (link profilo, es. tag.satispay.com/mario)</span>
        <input type="text" id="pay-satispay" value="${esc(pay.satispay)}" placeholder="tag.satispay.com/mario"></label>
      <label class="field"><span>PayPal.Me (solo nome utente)</span>
        <input type="text" id="pay-paypal" value="${esc(pay.paypal)}" placeholder="mariorossi"></label>
      <label class="field"><span>Revolut (solo nome utente)</span>
        <input type="text" id="pay-revolut" value="${esc(pay.revolut)}" placeholder="mario55"></label>
      <label class="field" style="margin-bottom:0"><span>IBAN (per bonifico)</span>
        <input type="text" id="pay-iban" value="${esc(pay.iban)}" placeholder="IT60X0542811101000000123456"></label>
    </div>` : ''}
    <div class="card">
      <h2>Chi ha saldato</h2>
      ${rows || '<p class="hint">Aggiungi prima i commensali.</p>'}
      ${unpaid.length && payer ? `
        <div class="totalbar"><span>Mancano</span><span class="amount">${fmtCents(unpaidTotal)}</span></div>
        <button class="btn block amber" id="remind-all" style="margin-top:8px">📣 Sollecita chi manca (${unpaid.length})</button>` : ''}
      ${!unpaid.length && ds.length && payer ? '<p class="balance-ok" style="margin-top:8px">Tutti hanno saldato 🎉</p>' : ''}
    </div>
    <div class="row" style="margin-bottom:12px">
      <button class="btn" id="export-img" style="flex:1">🖼 Esporta riepilogo</button>
      <button class="btn primary" id="end-dinner" style="flex:1">🏁 Fine cena</button>
    </div>
  `;

  root.querySelector('#payer-sel').addEventListener('change', (e) => {
    state.settings.payerSeatId = e.target.value || null;
    ctx.save(); ctx.rerender();
  });
  for (const key of ['satispay', 'paypal', 'revolut', 'iban']) {
    root.querySelector(`#pay-${key}`)?.addEventListener('change', (e) => {
      state.settings.payment[key] = e.target.value.trim();
      ctx.save();
    });
  }
  root.querySelectorAll('[data-paid]').forEach((b) => b.addEventListener('click', () => {
    const id = b.dataset.paid;
    state.payments[id] = state.payments[id] === 'paid' ? 'pending' : 'paid';
    ctx.save(); ctx.rerender();
  }));
  root.querySelectorAll('[data-remind]').forEach((b) => b.addEventListener('click', async () => {
    const seat = ds.find((s) => s.id === b.dataset.remind);
    const rec = res.perSeat.get(seat.id);
    const url = await quotaLink(state, seat, rec);
    shareOrCopy(quotaMessage(state, seat, rec, url), `Quota di ${seat.name}`);
  }));
  root.querySelector('#remind-all')?.addEventListener('click', async () => {
    const names = unpaid.map((s) => `${s.name} (${fmtCents(res.perSeat.get(s.id).roundedTotal)})`).join(', ');
    const msg = `🍷 ${state.dinnerName || 'Cena'} — mancano ancora: ${names}. Vi mando le quote qui sull’app 😄`;
    shareOrCopy(msg, 'Sollecito');
  });
  root.querySelector('#export-img').addEventListener('click', () => exportImage(state, res));
  root.querySelector('#end-dinner').addEventListener('click', () => ctx.endDinner());
}

// riepilogo come immagine PNG (canvas), da condividere nel gruppo
function exportImage(state, res) {
  const ds = res.diners;
  const scale = 2;
  const w = 420;
  const rowH = 44;
  const h = 150 + ds.length * rowH + 60;
  const canvas = document.createElement('canvas');
  canvas.width = w * scale;
  canvas.height = h * scale;
  const c = canvas.getContext('2d');
  c.scale(scale, scale);

  c.fillStyle = '#16110c';
  c.fillRect(0, 0, w, h);
  c.fillStyle = '#f5eee3';
  c.font = '800 22px system-ui, sans-serif';
  c.fillText(`🍷 ${state.dinnerName || 'Cena'}`, 20, 42);
  c.fillStyle = '#b3a189';
  c.font = '600 14px system-ui, sans-serif';
  const today = new Date();
  c.fillText(`${today.toLocaleDateString('it-IT')} — ${ds.length} commensali`, 20, 66);
  c.strokeStyle = '#443423';
  c.beginPath(); c.moveTo(20, 84); c.lineTo(w - 20, 84); c.stroke();

  ds.forEach((seat, i) => {
    const rec = res.perSeat.get(seat.id);
    const y = 110 + i * rowH;
    c.fillStyle = seat.color;
    c.beginPath(); c.arc(34, y, 14, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#1c130b';
    c.font = '800 11px system-ui, sans-serif';
    c.textAlign = 'center';
    c.fillText(initials(seat.name), 34, y + 4);
    c.textAlign = 'left';
    c.fillStyle = '#f5eee3';
    c.font = '650 16px system-ui, sans-serif';
    c.fillText(seat.name.slice(0, 22), 58, y + 5);
    const paid = state.payments[seat.id] === 'paid';
    c.textAlign = 'right';
    c.fillStyle = paid ? '#7fb884' : '#e8a951';
    c.font = '750 16px system-ui, sans-serif';
    c.fillText(`${fmtCents(rec.roundedTotal)}${paid ? ' ✓' : ''}`, w - 20, y + 5);
    c.textAlign = 'left';
  });

  const total = res.grandTotal + res.roundExtraTotal;
  const ty = 110 + ds.length * rowH + 14;
  c.strokeStyle = '#443423';
  c.beginPath(); c.moveTo(20, ty - 18); c.lineTo(w - 20, ty - 18); c.stroke();
  c.fillStyle = '#f5eee3';
  c.font = '800 18px system-ui, sans-serif';
  c.fillText('Totale', 20, ty + 6);
  c.textAlign = 'right';
  c.fillStyle = '#e8a951';
  c.fillText(fmtCents(total), w - 20, ty + 6);
  c.textAlign = 'left';

  canvas.toBlob(async (blob) => {
    const file = new File([blob], 'conto.png', { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: state.dinnerName || 'Conto' }); return; } catch { /* annullato */ }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'conto.png';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }, 'image/png');
}

// ---------- link di pagamento (usati anche dalla pagina ospite) ----------

export function paymentButtonsHtml(pay, cents) {
  const amount = (cents / 100).toFixed(2);
  const btns = [];
  if (pay?.satispay) {
    const url = pay.satispay.startsWith('http') ? pay.satispay : `https://${pay.satispay.replace(/^https?:\/\//, '')}`;
    btns.push(`<a class="btn block" style="background:#f94c43;border-color:#f94c43;color:#fff" href="${esc(url)}" target="_blank" rel="noopener">🔴 Paga con Satispay</a>`);
  }
  if (pay?.paypal) btns.push(`<a class="btn block" style="background:#0070ba;border-color:#0070ba;color:#fff" href="https://paypal.me/${esc(pay.paypal)}/${amount}EUR" target="_blank" rel="noopener">🅿️ Paga con PayPal</a>`);
  if (pay?.revolut) btns.push(`<a class="btn block" style="background:#191c1f;border-color:#3a3f45;color:#fff" href="https://revolut.me/${esc(pay.revolut)}" target="_blank" rel="noopener">Ⓡ Paga con Revolut</a>`);
  if (pay?.iban) btns.push(`<button class="btn block" data-copy-iban="${esc(pay.iban)}">🏦 Copia IBAN per bonifico</button>`);
  return btns.join('');
}

export function wirePaymentButtons(root) {
  root.querySelectorAll('[data-copy-iban]').forEach((b) => b.addEventListener('click', async () => {
    await copyText(b.dataset.copyIban);
    toast('IBAN copiato 📋');
  }));
}
