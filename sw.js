// ── Emondt Materiaalapp – Service Worker ──────────────────────
const CACHE_NAAM = 'emondt-materiaalapp-v5';

// Alleen statische assets cachen — NOOIT index.html
const ASSETS = [
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './favicon-32.png',
];

// ── INSTALL ───────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAAM)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: verwijder alle oude caches ──────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(namen => Promise.all(
        namen.filter(n => n !== CACHE_NAAM).map(n => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

// ── FETCH ─────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // index.html en navigatie: ALTIJD van het netwerk — nooit uit cache
  if (event.request.destination === 'document' ||
      url.pathname.endsWith('index.html') ||
      url.pathname === '/' || url.pathname === '') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Externe requests (Sheets API, fonts): altijd netwerk
  if (url.origin !== self.location.origin) {
    event.respondWith(
      fetch(event.request).catch(() => new Response('', { status: 503 }))
    );
    return;
  }

  // Statische assets (iconen, manifest): cache-first
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(res => {
        if (res && res.status === 200) {
          caches.open(CACHE_NAAM).then(c => c.put(event.request, res.clone()));
        }
        return res;
      });
    })
  );
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

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
