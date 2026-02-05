
const CACHE_NAME = 'spacetuner-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/vite.svg'
];

// Install: Cache core assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
          console.log("Failed to cache core assets", err);
      });
    })
  );
});

// Activate: Clean old caches
self.addEventListener('activate', (event) => {
  self.clients.claim();
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch: Intercept requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. API: Network Only (Gemini)
  if (url.hostname.includes('googleapis.com') && url.pathname.includes('generativelanguage')) {
    return;
  }

  // 2. Static Assets & CDN Dependencies: Cache First
  // esm.sh, tailwind, fonts
  if (
    url.hostname === 'esm.sh' || 
    url.hostname === 'cdn.tailwindcss.com' ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if(!networkResponse || networkResponse.status !== 200 && networkResponse.type !== 'opaque') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        }).catch(() => {
           // If offline and not in cache, nothing we can do for external assets
           return null;
        });
      })
    );
    return;
  }

  // 3. App Shell & Local files: Network First (fallback to cache)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (!response || response.status !== 200) {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
