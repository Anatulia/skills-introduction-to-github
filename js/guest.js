// Pagina ospite: si apre dal link ricevuto su WhatsApp/QR, senza installare nulla.
// t='menu'  → scegli chi sei e i tuoi piatti, rimanda le scelte al capotavola.
// t='quota' → vedi la tua quota, paga, accetta o chiedi una modifica.

import { fmtCents } from './model.js';
import { decodePayload, encodePayload, buildPicksPayload, whatsappUrl } from './share.js';
import { paymentButtonsHtml, wirePaymentButtons } from './settle.js';
import { esc, toast, shareOrCopy } from './ui.js';

const main = document.querySelector('#guest-main');
const title = document.querySelector('#guest-title');

function fail(msg) {
  main.innerHTML = `<div class="card"><div class="empty-state"><div class="big">🤔</div>${esc(msg)}</div></div>`;
}

async function boot() {
  const raw = window.location.hash.slice(1);
  if (!raw) { fail('Questo link è vuoto: fattelo rimandare dal capotavola.'); return; }
  let payload = null;
  try { payload = await decodePayload(raw); } catch { /* sotto */ }
  if (!payload) { fail('Link non leggibile: fattelo rimandare dal capotavola.'); return; }
  if (payload.t === 'menu') renderMenuPick(payload);
  else if (payload.t === 'quota') renderQuota(payload);
  else fail('Link non riconosciuto.');
}

// ---------- scelta dei piatti ----------

function renderMenuPick(payload) {
  title.textContent = payload.dinner;
  let me = payload.seat; // può già essere indicato dal capotavola
  const picks = new Map(); // menuId → qty

  const render = () => {
    if (!me) {
      main.innerHTML = `
        <div class="card">
          <h2>👋 Chi sei?</h2>
          <div class="row wrap">
            ${payload.seats.map((s) => `<button class="btn" data-me="${s.id}">${esc(s.name)}</button>`).join('')}
          </div>
        </div>`;
      main.querySelectorAll('[data-me]').forEach((b) => b.addEventListener('click', () => {
        me = payload.seats.find((s) => s.id === b.dataset.me);
        render();
      }));
      return;
    }
    const total = [...picks.entries()].reduce((a, [id, q]) => {
      const dish = payload.menu.find((m) => m.id === id);
      return a + (dish ? dish.price * q : 0);
    }, 0);
    main.innerHTML = `
      <div class="card">
        <h2>🍽 Ciao ${esc(me.name)}! Cosa hai preso?</h2>
        ${payload.menu.map((m) => {
          const q = picks.get(m.id) || 0;
          return `
          <div class="menu-check">
            <div class="item-main">
              <div class="item-label">${esc(m.label)}</div>
              <div class="item-sub">${fmtCents(m.price)}</div>
            </div>
            <div class="stepper">
              <button data-minus="${m.id}" aria-label="Meno">−</button>
              <output>${q}</output>
              <button data-plus="${m.id}" aria-label="Più">+</button>
            </div>
          </div>`;
        }).join('')}
        <div class="totalbar"><span>Il tuo totale</span><span class="amount">${fmtCents(total)}</span></div>
      </div>
      <button class="btn primary block" id="send-picks" ${picks.size ? '' : 'disabled'}>💬 Invia le tue scelte</button>
      <p class="hint" style="text-align:center;margin-top:8px">Si apre WhatsApp con un link: mandalo a chi gestisce il conto.</p>
    `;
    main.querySelectorAll('[data-plus]').forEach((b) => b.addEventListener('click', () => {
      picks.set(b.dataset.plus, (picks.get(b.dataset.plus) || 0) + 1);
      render();
    }));
    main.querySelectorAll('[data-minus]').forEach((b) => b.addEventListener('click', () => {
      const q = (picks.get(b.dataset.minus) || 0) - 1;
      if (q <= 0) picks.delete(b.dataset.minus); else picks.set(b.dataset.minus, q);
      render();
    }));
    main.querySelector('#send-picks')?.addEventListener('click', async () => {
      const rows = [...picks.entries()].map(([id, q]) => {
        const dish = payload.menu.find((m) => m.id === id);
        return { label: dish.label, price: dish.price, qty: q };
      });
      const enc = await encodePayload(buildPicksPayload(payload.dinner, me.id, me.name, rows));
      const appUrl = new URL('index.html', window.location.href);
      appUrl.hash = enc;
      const msg = `🍷 ${payload.dinner} — le scelte di ${me.name}. Apri il link per aggiungerle al conto:\n${appUrl.toString()}`;
      window.open(whatsappUrl(msg), '_blank') || shareOrCopy(msg, 'Le mie scelte');
    });
  };
  render();
}

// ---------- quota personale ----------

function renderQuota(payload) {
  title.textContent = payload.dinner;
  const lines = payload.lines.map((l) => `
    <div><span>${esc(l.label)}${l.n > 1 ? ` <span style="opacity:.6">÷${l.n}</span>` : ''}</span><span class="val">${fmtCents(l.cents)}</span></div>`).join('');
  const extra = [
    payload.coperto ? `<div><span>Coperto</span><span class="val">${fmtCents(payload.coperto)}</span></div>` : '',
    payload.tip ? `<div><span>Mancia</span><span class="val">${fmtCents(payload.tip)}</span></div>` : '',
    payload.discount ? `<div><span>Sconto</span><span class="val neg">−${fmtCents(payload.discount)}</span></div>` : '',
    payload.roundedTotal > payload.total ? `<div><span>Arrotondamento</span><span class="val">${fmtCents(payload.roundedTotal - payload.total)}</span></div>` : '',
  ].join('');
  const payBtns = paymentButtonsHtml(payload.pay, payload.roundedTotal);

  main.innerHTML = `
    <div class="card">
      <h2>La quota di ${esc(payload.seat.name)}</h2>
      <div class="quota-lines">${lines}${extra}</div>
      <div class="totalbar"><span>Da pagare</span><span class="amount">${fmtCents(payload.roundedTotal)}</span></div>
    </div>
    ${payBtns ? `<div class="card"><h2>💸 Rimborsa ${esc(payload.payer || 'chi ha pagato')}</h2><div class="row wrap" style="flex-direction:column;align-items:stretch">${payBtns}</div></div>`
      : '<div class="card"><p class="hint">💶 Si paga direttamente alla cassa del ristorante.</p></div>'}
    <div class="row" style="margin-bottom:12px">
      <button class="btn primary" id="accept" style="flex:1">✅ Accetto</button>
      <button class="btn" id="dispute" style="flex:1">✏️ Chiedi modifica</button>
    </div>
  `;
  wirePaymentButtons(main);
  main.querySelector('#accept').addEventListener('click', () => {
    const msg = `✅ ${payload.dinner} — ${payload.seat.name}: confermo la mia quota di ${fmtCents(payload.roundedTotal)}.`;
    window.open(whatsappUrl(msg), '_blank') || shareOrCopy(msg, 'Quota accettata');
  });
  main.querySelector('#dispute').addEventListener('click', () => {
    const msg = `✏️ ${payload.dinner} — ${payload.seat.name}: sulla mia quota di ${fmtCents(payload.roundedTotal)} c’è qualcosa da rivedere: `;
    window.open(whatsappUrl(msg), '_blank') || shareOrCopy(msg, 'Richiesta modifica');
  });
}

window.addEventListener('hashchange', () => window.location.reload());
boot();
