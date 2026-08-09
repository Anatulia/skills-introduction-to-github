// Service worker: l'app funziona anche senza rete (al ristorante il segnale manca spesso).
// Strategia: cache-first per i file dell'app, network-first per il resto.

const CACHE = 'tavolo-v1';
const ASSETS = [
  './',
  'index.html',
  'guest.html',
  'css/style.css',
  'js/app.js',
  'js/guest.js',
  'js/model.js',
  'js/ocr-parse.js',
  'js/table.js',
  'js/tavolo.js',
  'js/menu.js',
  'js/menu-ocr.js',
  'js/bill.js',
  'js/settle.js',
  'js/history.js',
  'js/storage.js',
  'js/share.js',
  'js/qr.js',
  'js/ui.js',
  'manifest.webmanifest',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.allSettled(ASSETS.map((a) => c.add(a))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // i file grossi dell'OCR vengono messi in cache la prima volta che servono
  const cacheable = url.origin === location.origin;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request).then((res) => {
      if (cacheable && res.ok) {
        const clone = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, clone));
      }
      return res;
    })),
  );
});
