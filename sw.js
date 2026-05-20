const CACHE = 'servy-v1';
const PRECACHE = [
  '/',
  '/index.html',
  '/buscar.html',
  '/recomendar.html',
  '/prestador.html',
  '/home-v2.css',
  '/home-v2.js',
  '/assets/servy-circle.png',
  '/assets/servy-full.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first: siempre intenta red, cae a cache solo si falla
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
