const CACHE_NAME = 'food-nutrition-v2';
const IS_LOCAL = ['localhost', '127.0.0.1'].includes(self.location.hostname);

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
  if (IS_LOCAL) {
    event.waitUntil(self.skipWaiting());
    return;
  }
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
  if (IS_LOCAL) {
    event.waitUntil((async () => {
      const names = await caches.keys();
      await Promise.all(names.filter(name => name.startsWith('food-nutrition-'))
        .map(name => caches.delete(name)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: 'window' });
      await Promise.all(clients.map(client => client.navigate(client.url)));
    })());
    return;
  }
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
  if (IS_LOCAL) {
    event.respondWith(fetch(event.request));
    return;
  }
  const url = new URL(event.request.url);

  if (
    event.request.url.includes('/api/') ||
    !url.origin.includes(self.location.origin)
  ) {
    // Dejar que la falla de red llegue al servicio para que pueda reintentar.
    event.respondWith(fetch(event.request));

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
