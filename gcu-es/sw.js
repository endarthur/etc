/* ══════════════════════════════════════════════════
   GCUES v0.1 — Service Worker
   Cache-first for app shell, stale-while-revalidate for fonts
   ══════════════════════════════════════════════════ */

const CACHE_NAME = 'gcues-v1';
const APP_SHELL = [
  './',
  './gcues.html',
  './manifest.json'
];

// ── Install: pre-cache app shell ──
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: clean old caches ──
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch strategy ──
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Google Fonts: stale-while-revalidate
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(e.request).then(cached => {
          const fetched = fetch(e.request).then(response => {
            if (response.ok) cache.put(e.request, response.clone());
            return response;
          }).catch(() => cached);
          return cached || fetched;
        })
      )
    );
    return;
  }

  // App shell: cache-first
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(e.request).then(cached =>
        cached || fetch(e.request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          }
          return response;
        })
      )
    );
    return;
  }

  // Everything else: network-first
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
