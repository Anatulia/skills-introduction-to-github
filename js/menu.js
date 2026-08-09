// Schermata 2 — Menù: foto/OCR, inserimento manuale, condivisione agli ospiti.

import { parsePrice, fmtCents, uid, diners } from './model.js';
import { parseOcrText } from './ocr-parse.js';
import { runOcr } from './menu-ocr.js';
import { encodePayload, buildMenuPayload, guestUrl, whatsappUrl } from './share.js';
import { encodeText, toSvg } from './qr.js';
import { esc, openDialog, toast, shareOrCopy } from './ui.js';

export function renderMenu(root, ctx) {
  const { state } = ctx;
  const rows = state.menu.map((m) => `
    <div class="item-row" data-id="${m.id}">
      <div class="item-main">
        <div class="item-label">${esc(m.label)}</div>
      </div>
      <div class="item-price">${fmtCents(m.price)}</div>
      <button class="del icon-btn" data-del="${m.id}" aria-label="Elimina" style="min-width:36px;min-height:36px;font-size:15px">✕</button>
    </div>`).join('');

  root.innerHTML = `
    <div class="card">
      <h2>📷 Il menù del ristorante</h2>
      <div class="row">
        <button class="btn primary" id="ocr-menu" style="flex:1">📷 Fotografa il menù</button>
        <button class="btn" id="add-dish">＋ A mano</button>
      </div>
      <p class="hint" style="margin-top:8px">Scatta una foto al menù: l’app legge piatti e prezzi, poi puoi correggerli.</p>
      <input type="file" accept="image/*" id="menu-file" hidden>
    </div>
    <div class="card">
      <h2>Piatti (${state.menu.length})</h2>
      ${rows || '<div class="empty-state"><div class="big">🍝</div>Nessun piatto ancora.<br>Fotografa il menù o aggiungili a mano.</div>'}
    </div>
    <div class="card">
      <h2>📤 Fai scegliere i piatti agli amici</h2>
      <p class="hint" style="margin-bottom:10px">Invia il menù: ognuno apre il link dal suo telefono, spunta le sue voci e ti rimanda le scelte — l’app le importa da sola.</p>
      <div class="row">
        <button class="btn primary" id="share-menu" style="flex:1" ${state.menu.length ? '' : 'disabled'}>💬 Condividi link</button>
        <button class="btn" id="qr-menu" ${state.menu.length ? '' : 'disabled'}>⬛ QR</button>
      </div>
    </div>
  `;

  const fileInput = root.querySelector('#menu-file');
  root.querySelector('#ocr-menu').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) startOcrFlow(fileInput.files[0], ctx, 'menu');
    fileInput.value = '';
  });

  root.querySelector('#add-dish').addEventListener('click', () => openDishEditor(null, ctx));
  root.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', (e) => {
    e.stopPropagation();
    state.menu = state.menu.filter((m) => m.id !== b.dataset.del);
    ctx.save(); ctx.rerender();
  }));
  root.querySelectorAll('.item-row').forEach((r) => r.addEventListener('click', () => {
    const dish = state.menu.find((m) => m.id === r.dataset.id);
    if (dish) openDishEditor(dish, ctx);
  }));

  root.querySelector('#share-menu').addEventListener('click', async () => {
    const url = await menuLink(state);
    const msg = `🍷 ${state.dinnerName || 'Cena'} — scegli dal menù quello che hai preso e rimandami le scelte:\n${url}`;
    shareOrCopy(msg, 'Menù della cena');
  });
  root.querySelector('#qr-menu').addEventListener('click', async () => {
    const url = await menuLink(state);
    showQr(url, 'Inquadra per aprire il menù');
  });
}

async function menuLink(state) {
  const payload = await encodePayload(buildMenuPayload(state));
  return guestUrl(payload);
}

export function showQr(text, caption) {
  try {
    const qr = encodeText(text);
    openDialog(`
      <h3 style="text-align:center">${esc(caption)}</h3>
      <div class="qr-box">${toSvg(qr)}</div>
      <div class="dialog-actions"><button class="btn" data-close>Chiudi</button></div>
    `);
  } catch {
    toast('Contenuto troppo lungo per un QR: usa il link 💬');
  }
}

function openDishEditor(dish, ctx) {
  const { state } = ctx;
  const isNew = !dish;
  const dlg = openDialog(`
    <h3>${isNew ? 'Nuovo piatto' : 'Modifica piatto'}</h3>
    <label class="field"><span>Nome</span>
      <input type="text" id="dish-label" value="${esc(dish?.label || '')}" placeholder="es. Tagliatelle al ragù">
    </label>
    <label class="field"><span>Prezzo (€)</span>
      <input type="text" inputmode="decimal" id="dish-price" value="${dish ? fmtCents(dish.price, false) : ''}" placeholder="12,50">
    </label>
    <div class="dialog-actions">
      <button class="btn ghost" data-close>Annulla</button>
      <button class="btn primary" id="dish-ok">${isNew ? 'Aggiungi' : 'Salva'}</button>
    </div>
  `);
  dlg.querySelector('#dish-label').focus();
  dlg.querySelector('#dish-ok').addEventListener('click', () => {
    const label = dlg.querySelector('#dish-label').value.trim();
    const price = parsePrice(dlg.querySelector('#dish-price').value);
    if (!label || price === null || price <= 0) { toast('Servono nome e prezzo validi'); return; }
    if (isNew) state.menu.push({ id: uid('m'), label, price });
    else { dish.label = label; dish.price = price; }
    dlg.close();
    ctx.save(); ctx.rerender();
  });
}

// ---------- flusso OCR condiviso (menù e scontrino) ----------

export function startOcrFlow(file, ctx, kind) {
  const dlg = openDialog(`
    <h3>${kind === 'menu' ? '📷 Lettura del menù…' : '📷 Lettura dello scontrino…'}</h3>
    <p class="hint" id="ocr-status">Preparazione…</p>
    <progress id="ocr-progress" max="1" value="0" style="width:100%"></progress>
    <div class="dialog-actions"><button class="btn ghost" data-close>Annulla</button></div>
  `);
  let cancelled = false;
  dlg.addEventListener('close', () => { cancelled = true; });

  runOcr(file, (p) => {
    const bar = dlg.querySelector('#ocr-progress');
    const status = dlg.querySelector('#ocr-status');
    if (bar) bar.value = p;
    if (status) status.textContent = `Riconoscimento testo… ${Math.round(p * 100)}%`;
  }).then((text) => {
    if (cancelled) return;
    dlg.close();
    const rows = parseOcrText(text);
    if (!rows.length) { toast('Non ho riconosciuto voci con prezzo: riprova con una foto più nitida'); return; }
    openOcrReview(rows, ctx, kind);
  }).catch(() => {
    if (cancelled) return;
    dlg.close();
    toast('OCR non riuscito (serve la rete la prima volta). Puoi inserire le voci a mano.');
  });
}

// revisione delle righe OCR: tutto modificabile prima dell'import
export function openOcrReview(rows, ctx, kind) {
  const { state } = ctx;
  const dlg = openDialog(`
    <h3>Ho letto ${rows.length} ${rows.length === 1 ? 'voce' : 'voci'} — controlla e correggi</h3>
    <div id="ocr-rows">
      ${rows.map((r, i) => `
        <div class="ocr-row" data-i="${i}">
          ${kind === 'receipt' ? `<input type="text" inputmode="numeric" class="ocr-qty" value="${r.qty}" aria-label="Quantità">` : ''}
          <input type="text" class="ocr-label" value="${esc(r.label)}" aria-label="Nome">
          <input type="text" inputmode="decimal" class="ocr-price" value="${fmtCents(r.price, false)}" aria-label="Prezzo">
          <button class="del" aria-label="Scarta">✕</button>
        </div>`).join('')}
    </div>
    <div class="dialog-actions">
      <button class="btn ghost" data-close>Annulla</button>
      <button class="btn primary" id="ocr-import">${kind === 'menu' ? 'Aggiungi al menù' : 'Confronta col conto'}</button>
    </div>
  `);
  dlg.querySelectorAll('.ocr-row .del').forEach((b) => b.addEventListener('click', () => b.closest('.ocr-row').remove()));
  dlg.querySelector('#ocr-import').addEventListener('click', () => {
    const out = [];
    dlg.querySelectorAll('.ocr-row').forEach((row) => {
      const label = row.querySelector('.ocr-label').value.trim();
      const price = parsePrice(row.querySelector('.ocr-price').value);
      const qty = parseInt(row.querySelector('.ocr-qty')?.value || '1', 10) || 1;
      if (label && price !== null && price > 0) out.push({ label, price, qty });
    });
    dlg.close();
    if (!out.length) return;
    if (kind === 'menu') {
      for (const r of out) state.menu.push({ id: uid('m'), label: r.label, price: r.price });
      toast(`${out.length} ${out.length === 1 ? 'piatto aggiunto' : 'piatti aggiunti'} al menù ✅`);
      ctx.save(); ctx.rerender();
    } else {
      ctx.onReceiptRows?.(out);
    }
  });
}
