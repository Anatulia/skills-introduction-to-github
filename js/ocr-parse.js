// Parsing puro del testo OCR (menù e scontrini) e confronto scontrino ↔ conto.
// Nessuna dipendenza dal DOM: testabile in Node.

import { parsePrice } from './model.js';

// Righe tipo "Tagliatelle al ragù ..... 12,50" / "COPERTO 2.50" / "3 x Vino rosso 54,00"
const PRICE_AT_END = /^(.*?)[\s.·_\-–—]*(?:€\s*)?(\d{1,4}[.,]\d{2})\s*(?:€|EUR)?\s*$/i;
const QTY_PREFIX = /^(\d{1,2})\s*[x×]\s*(.+)$/i;

export function parseOcrText(text) {
  const out = [];
  for (const raw of String(text || '').split(/\r?\n/)) {
    const line = raw.replace(/\s+/g, ' ').trim();
    if (line.length < 4) continue;
    const m = line.match(PRICE_AT_END);
    if (!m) continue;
    let label = m[1].replace(/[.·_\-–—]{2,}/g, ' ').replace(/\s+/g, ' ').trim();
    const price = parsePrice(m[2]);
    if (price === null || price <= 0) continue;
    let qty = 1;
    const q = label.match(QTY_PREFIX);
    if (q) { qty = parseInt(q[1], 10); label = q[2].trim(); }
    if (!label || /^(totale|subtotale|tot\.?|iva|resto|contante|carta|pos)$/i.test(label)) continue;
    label = label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
    out.push({ label, price, qty });
  }
  return out;
}

function normalize(s) {
  return String(s).toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

// similarità 0..1 per token in comune (tollerante agli errori OCR sulle parole corte)
export function similarity(a, b) {
  const ta = new Set(normalize(a).split(' ').filter((w) => w.length > 2));
  const tb = new Set(normalize(b).split(' ').filter((w) => w.length > 2));
  if (!ta.size || !tb.size) return normalize(a) === normalize(b) ? 1 : 0;
  let common = 0;
  for (const w of ta) if (tb.has(w)) common += 1;
  return (2 * common) / (ta.size + tb.size);
}

// Confronta le voci inserite nell'app con le righe lette dallo scontrino.
// items: [{label, unitPrice, qty}] — receiptLines: [{label, price, qty}]
// Ritorna { matched, onlyOnReceipt, onlyInApp, priceDiffs }
export function compareReceipt(items, receiptLines) {
  const usedReceipt = new Set();
  const matched = [];
  const priceDiffs = [];
  const onlyInApp = [];

  for (const item of items) {
    let best = -1;
    let bestScore = 0.49; // soglia minima
    receiptLines.forEach((line, i) => {
      if (usedReceipt.has(i)) return;
      const score = similarity(item.label, line.label);
      if (score > bestScore) { bestScore = score; best = i; }
    });
    if (best === -1) { onlyInApp.push(item); continue; }
    usedReceipt.add(best);
    const line = receiptLines[best];
    const appTotal = (item.unitPrice || 0) * (item.qty || 1);
    const receiptTotal = line.price * (line.qty || 1);
    if (appTotal !== receiptTotal) {
      priceDiffs.push({ item, line, appTotal, receiptTotal });
    } else {
      matched.push({ item, line });
    }
  }
  const onlyOnReceipt = receiptLines.filter((_, i) => !usedReceipt.has(i));
  return { matched, onlyOnReceipt, onlyInApp, priceDiffs };
}
