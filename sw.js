// ── Emondt Materiaalapp – Service Worker ──────────────────────
// Versie: bump dit getal na elke app-update om cache te vernieuwen
const CACHE_NAAM = 'emondt-materiaalapp-v1';

// Bestanden die offline beschikbaar moeten zijn
const TE_CACHEN = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './favicon-32.png',
  // Google Fonts (worden gecached bij eerste bezoek)
  'https://fonts.googleapis.com/css2?family=Questrial&display=swap',
];

// ── INSTALL: cache alle app-bestanden ─────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAAM).then(cache => {
      console.log('[SW] Bestanden in cache opslaan...');
      const lokaal = TE_CACHEN.filter(url => !url.startsWith('http'));
      const extern = TE_CACHEN.filter(url => url.startsWith('http'));
      return cache.addAll(lokaal).then(() =>
        Promise.all(
          extern.map(url =>
            fetch(url, { mode: 'no-cors' })
              .then(res => cache.put(url, res))
              .catch(() => {})
          )
        )
      );
    }).then(() => {
      console.log('[SW] Installatie voltooid');
      return self.skipWaiting();
    })
  );
});

// ── ACTIVATE: verwijder oude caches ───────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(namen =>
      Promise.all(
        namen
          .filter(naam => naam !== CACHE_NAAM)
          .map(naam => {
            console.log('[SW] Oude cache verwijderd:', naam);
            return caches.delete(naam);
          })
      )
    ).then(() => {
      console.log('[SW] Activatie voltooid');
      return self.clients.claim();
    })
  );
});

// ── FETCH: Cache-first strategie ──────────────────────────────
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        fetch(event.request)
          .then(res => {
            if (res && res.status === 200 && res.type !== 'opaque') {
              caches.open(CACHE_NAAM).then(cache => cache.put(event.request, res.clone()));
            }
          })
          .catch(() => {});
        return cached;
      }

      return fetch(event.request)
        .then(res => {
          if (!res || res.status !== 200) return res;
          const clone = res.clone();
          caches.open(CACHE_NAAM).then(cache => cache.put(event.request, clone));
          return res;
        })
        .catch(() => {
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
        });
    })
  );
});

// ── Update melding ────────────────────────────────────────────
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
