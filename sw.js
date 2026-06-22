const CACHE_NAME = 'saif-seha-musaed-v11';
const BASE_URL = self.registration.scope;
const CORE_ASSETS = [
  '',
  'manifest.webmanifest',
  'favicon.svg',
  'maskable-icon.svg'
].map((asset) => new URL(asset, BASE_URL).toString());

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);
  const scopeUrl = new URL(BASE_URL);

  if (requestUrl.origin !== scopeUrl.origin || event.request.cache === 'no-store') {
    return;
  }

  const acceptsHtml = event.request.headers.get('accept')?.includes('text/html');

  if (event.request.mode === 'navigate' || acceptsHtml) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return networkResponse;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match(BASE_URL)))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return networkResponse;
        })
        .catch(() => caches.match(BASE_URL));
    })
  );
});
