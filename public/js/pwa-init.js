// ============================================================
// PWA INIT — Aplicaciones Móviles · Cátedra 2025-2026
// ============================================================
// Este archivo registra el Service Worker y gestiona el
// ciclo de vida de la PWA. NO es necesario modificarlo.
// Incluirlo al final de cada página HTML de tu aplicación.
// ============================================================

(function () {
  'use strict';

  const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);

  if (isLocal) {
    // En desarrollo, una PWA previa puede servir HTML y JS desactualizados.
    window.addEventListener('load', async () => {
      const wasControlled = Boolean(navigator.serviceWorker?.controller);
      const registrations = await navigator.serviceWorker?.getRegistrations() ?? [];
      await Promise.all(registrations.map(registration => registration.unregister()));
      const names = await caches.keys();
      await Promise.all(names.filter(name => name.startsWith('food-nutrition-'))
        .map(name => caches.delete(name)));
      if (wasControlled) window.location.reload();
    }, { once: true });
    return;
  }

  // Registrar el Service Worker si el navegador lo soporta
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then(registration => {
          console.log('[PWA] Service Worker registrado correctamente.');
          console.log('[PWA] Scope:', registration.scope);

          // Verificar si hay una actualización disponible
          registration.addEventListener('updatefound', () => {
            const nuevoSW = registration.installing;
            nuevoSW.addEventListener('statechange', () => {
              if (nuevoSW.state === 'installed' &&
                  navigator.serviceWorker.controller) {
                console.log('[PWA] Nueva versión disponible. Recargá la página para actualizarla.');
              }
            });
          });
        })
        .catch(error => {
          console.error('[PWA] Error al registrar el Service Worker:', error);
        });
    });
  } else {
    console.warn('[PWA] Este navegador no soporta Service Workers. La app funcionará como web app convencional.');
  }

  // Capturar el evento de instalación para uso futuro
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    window._pwaInstallPrompt = event;
    console.log('[PWA] La aplicación puede ser instalada.');
  });

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] ¡Aplicación instalada correctamente!');
    window._pwaInstallPrompt = null;
  });

})();
