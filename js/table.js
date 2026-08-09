// Pianta del tavolo in SVG: il pezzo forte dell'app.
// renderTable → schermata principale interattiva; renderMiniTable → selettore partecipanti.

import { diners } from './model.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const VIEW = 400;      // larghezza logica (margine per i nomi laterali)
const VIEW_H = 396;    // altezza logica: spazio extra per i nomi sopra e sotto

function svgEl(name, attrs = {}) {
  const el = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

export function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
}

// posizioni dei posti attorno al tavolo, in coordinate 0..VIEW
export function seatPositions(shape, n) {
  const cx = VIEW / 2;
  const cy = VIEW_H / 2;
  if (shape === 'round') {
    const r = 128;
    return Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
    });
  }
  // rettangolare: posti distribuiti lungo il perimetro di un rettangolo arrotondato
  const w = n <= 6 ? 150 : 190;
  const h = Math.min(240, 90 + Math.ceil(n / 2) * 26);
  const half = { x: w / 2 + 36, y: h / 2 + 36 };
  const perim = [];
  const top = Math.max(1, Math.round(n * (w / (2 * (w + h)))));
  const bottom = top;
  const sides = n - top - bottom;
  const right = Math.ceil(sides / 2);
  const left = sides - right;
  for (let i = 0; i < top; i += 1) perim.push({ x: cx - w / 2 + ((i + 0.5) / top) * w, y: cy - half.y });
  for (let i = 0; i < right; i += 1) perim.push({ x: cx + half.x, y: cy - h / 2 + ((i + 0.5) / right) * h });
  for (let i = 0; i < bottom; i += 1) perim.push({ x: cx + w / 2 - ((i + 0.5) / bottom) * w, y: cy + half.y });
  for (let i = 0; i < left; i += 1) perim.push({ x: cx - half.x, y: cy + h / 2 - ((i + 0.5) / left) * h });
  return perim;
}

function drawTableSurface(svg, shape, n) {
  const cy = VIEW_H / 2;
  if (shape === 'round') {
    svg.append(svgEl('circle', { cx: VIEW / 2, cy, r: 96, class: 'table-top' }));
    svg.append(svgEl('circle', { cx: VIEW / 2, cy, r: 88, class: 'table-inner' }));
  } else {
    const w = (n <= 6 ? 150 : 190) + 24;
    const h = Math.min(240, 90 + Math.ceil(n / 2) * 26) + 24;
    svg.append(svgEl('rect', { x: VIEW / 2 - w / 2, y: cy - h / 2, width: w, height: h, rx: 26, class: 'table-top' }));
    svg.append(svgEl('rect', { x: VIEW / 2 - w / 2 + 8, y: cy - h / 2 + 8, width: w - 16, height: h - 16, rx: 20, class: 'table-inner' }));
  }
}

function drawSeat(svg, seat, pos, opts) {
  const g = svgEl('g', { class: 'seat', 'data-seat': seat.id, tabindex: '0', role: 'button' });
  const named = !!seat.name;
  const r = opts.mini ? 15 : 21;
  g.append(svgEl('circle', { cx: pos.x, cy: pos.y, r: r + 3, class: 'seat-plate' }));
  const avatar = svgEl('circle', {
    cx: pos.x, cy: pos.y, r,
    class: named ? 'seat-avatar named' : 'seat-avatar empty',
  });
  if (named) avatar.setAttribute('fill', seat.color);
  g.append(avatar);
  if (opts.selected && opts.selected.has(seat.id)) {
    g.append(svgEl('circle', { cx: pos.x, cy: pos.y, r: r + 5, class: 'seat-ring' }));
  }
  const label = svgEl('text', {
    x: pos.x, y: pos.y + (opts.mini ? 4 : 5),
    class: named ? 'seat-initials' : 'seat-plus',
    'text-anchor': 'middle',
  });
  label.textContent = named ? initials(seat.name) : '+';
  g.append(label);
  if (!opts.mini && named) {
    const dx = pos.x - VIEW / 2;
    const dy = pos.y - VIEW_H / 2;
    const side = Math.abs(dx) > Math.abs(dy) + 20;
    const attrs = side
      ? { x: pos.x + Math.sign(dx) * (r + 8), y: pos.y + 4, 'text-anchor': dx > 0 ? 'start' : 'end' }
      : { x: pos.x, y: dy > 0 ? pos.y + r + 16 : pos.y - r - 9, 'text-anchor': 'middle' };
    const name = svgEl('text', { ...attrs, class: 'seat-name' });
    const short = seat.name.split(/\s+/)[0].slice(0, side ? 7 : 10);
    name.textContent = short + (seat.weight && seat.weight !== 1 ? ` ×${String(seat.weight).replace('.', ',')}` : '');
    g.append(name);
  }
  g.addEventListener('click', () => opts.onTap(seat));
  g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); opts.onTap(seat); } });
  svg.append(g);
}

// Pianta grande e interattiva. onTapSeat(seat) apre l'editor del posto.
export function renderTable(container, state, onTapSeat) {
  container.innerHTML = '';
  const { shape, seatCount, seats } = state.table;
  const svg = svgEl('svg', { viewBox: `0 0 ${VIEW} ${VIEW_H}`, class: 'table-svg' });
  drawTableSurface(svg, shape, seatCount);
  const positions = seatPositions(shape, seatCount);
  seats.slice(0, seatCount).forEach((seat, i) => drawSeat(svg, seat, positions[i], { onTap: onTapSeat }));
  container.append(svg);
}

// Mini-pianta per scegliere i partecipanti a una voce. selected: Set di seatId, toggle al tap.
export function renderMiniTable(container, state, selected, onChange) {
  container.innerHTML = '';
  const ds = diners(state);
  const { shape } = state.table;
  const svg = svgEl('svg', { viewBox: `0 0 ${VIEW} ${VIEW_H}`, class: 'table-svg mini' });
  drawTableSurface(svg, shape, ds.length || state.table.seatCount);
  const positions = seatPositions(shape, ds.length || 1);
  ds.forEach((seat, i) => drawSeat(svg, seat, positions[i], {
    mini: true,
    selected,
    onTap: (s) => {
      if (selected.has(s.id)) selected.delete(s.id); else selected.add(s.id);
      renderMiniTable(container, state, selected, onChange);
      onChange(selected);
    },
  }));
  container.append(svg);
}
