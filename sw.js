// Service worker — cachea el "cascarón" estático de la app (HTML/CSS/JS/íconos) para
// que cargue rápido. No garantiza uso sin conexión: la app necesita internet para
// hablar con Supabase (los registros y las cuentas viven ahí, no en este dispositivo).
const CACHE_NAME = 'ojitos-de-mili-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/supabase-config.js',
  './js/auth.js',
  './js/core.js',
  './js/app.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-180.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Red primero (para recibir actualizaciones apenas haya conexión), con la caché como
// respaldo cuando no hay red.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// ---------- avisos del temporizador del parche ----------
// La Edge Function send-patch-reminders manda esto cuando se cumple el
// tiempo de hoy (ver supabase/functions/send-patch-reminders). Llega aunque
// la app esté cerrada, mientras el dispositivo esté suscrito (js/core.js).
self.addEventListener('push', (event) => {
  let data = { title: '¡Ya se puede sacar el parche! 🎉', body: 'Se cumplió el tiempo de hoy para Mili.' };
  try { if (event.data) data = { ...data, ...event.data.json() }; } catch (e) {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: 'icons/icon-192.png',
      badge: 'icons/icon-192.png',
      tag: 'ojitos-de-mili-temporizador',
      renotify: true,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('./');
    })
  );
});
