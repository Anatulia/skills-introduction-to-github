// Condivisione senza server: lo stato viaggia compresso dentro il fragment (#) del link,
// quindi non raggiunge mai alcun server. Compressione deflate via CompressionStream
// (disponibile su tutti i browser moderni), con fallback non compresso.

const B64 = { '+': '-', '/': '_', '=': '' };

function bytesToBase64url(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin).replace(/[+/=]/g, (c) => B64[c]);
}

function base64urlToBytes(s) {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function pipeThrough(bytes, stream) {
  const out = new Response(new Blob([bytes]).stream().pipeThrough(stream));
  return new Uint8Array(await out.arrayBuffer());
}

// payload (oggetto) → stringa compatta per URL. Prefisso: 'd' deflate, 'p' plain.
export async function encodePayload(obj) {
  const json = JSON.stringify(obj);
  const raw = new TextEncoder().encode(json);
  if (typeof CompressionStream !== 'undefined') {
    try {
      const deflated = await pipeThrough(raw, new CompressionStream('deflate-raw'));
      if (deflated.length < raw.length) return 'd' + bytesToBase64url(deflated);
    } catch { /* fallback sotto */ }
  }
  return 'p' + bytesToBase64url(raw);
}

export async function decodePayload(str) {
  if (!str || str.length < 2) return null;
  const kind = str[0];
  const bytes = base64urlToBytes(str.slice(1));
  let raw = bytes;
  if (kind === 'd') raw = await pipeThrough(bytes, new DecompressionStream('deflate-raw'));
  else if (kind !== 'p') return null;
  return JSON.parse(new TextDecoder().decode(raw));
}

// ---------- payload applicativi ----------
// t: 'menu'  → capotavola invia il menù agli ospiti
// t: 'picks' → l'ospite risponde con le sue scelte
// t: 'quota' → il capotavola invia la quota personale

export function buildMenuPayload(state, seat) {
  return {
    t: 'menu',
    dinner: state.dinnerName || 'Cena',
    seat: seat ? { id: seat.id, name: seat.name } : null,
    seats: state.table.seats.filter((s) => s.name).map((s) => ({ id: s.id, name: s.name })),
    menu: state.menu.map((m) => ({ id: m.id, label: m.label, price: m.price })),
  };
}

export function buildPicksPayload(dinner, seatId, seatName, picks) {
  return { t: 'picks', dinner, seat: { id: seatId, name: seatName }, picks };
}

export function buildQuotaPayload(state, seat, rec, extra) {
  return {
    t: 'quota',
    dinner: state.dinnerName || 'Cena',
    seat: { id: seat.id, name: seat.name },
    lines: rec.lines.map((l) => ({ label: l.label, cents: l.cents, n: l.sharedWith })),
    coperto: rec.coperto,
    tip: rec.tip,
    discount: rec.discount,
    total: rec.total,
    roundedTotal: rec.roundedTotal,
    ...extra, // payment handles, payer name
  };
}

export function guestUrl(payload64) {
  const base = new URL('guest.html', window.location.href);
  base.hash = payload64;
  return base.toString();
}

export function whatsappUrl(text) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
