const CACHE_NAME = 'food-nutrition-v1';

const SHELL = [
  '/',
  '/search',
  '/foodNutrition',
  '/history',
  '/wishlist',
  '/contact',
  '/ContactForm',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/image/logoFoodNutrition.png'

];

self.addEventListener('install', event => {
  console.log('[SW] Instalando Service Worker...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Cacheando recursos del shell');
        return cache.addAll(SHELL);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  console.log('[SW] Activando Service Worker...');

  event.waitUntil(
    caches.keys()
      .then(nombres => {
        return Promise.all(
          nombres
            .filter(nombre => nombre !== CACHE_NAME)
            .map(nombre => caches.delete(nombre))
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (
    event.request.url.includes('/api/') ||
    !url.origin.includes(self.location.origin)
  ) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(
          JSON.stringify({
            error: 'Sin conexión. Los datos no están disponibles offline.'
          }),
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      })
    );

    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(respuestaCacheada => {
        if (respuestaCacheada) {
          return respuestaCacheada;
        }

        return fetch(event.request)
          .then(respuestaRed => {
            if (
              !respuestaRed ||
              respuestaRed.status !== 200 ||
              respuestaRed.type !== 'basic'
            ) {
              return respuestaRed;
            }

            const copiaRespuesta = respuestaRed.clone();

            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, copiaRespuesta);
            });

            return respuestaRed;
          })
          .catch(() => {
            if (event.request.destination === 'document') {
              return caches.match('/');
            }
          });
      })
  );
});