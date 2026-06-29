// Service Worker do NíQuel — cache offline.
// Versão do cache: subir este número sempre que publicar uma atualização do
// app, para forçar os usuários a baixarem a versão nova em vez de continuar
// usando o cache antigo.
const CACHE_VERSION = 'niquel-v1';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
];

// Instalação: baixa e guarda os arquivos do app shell no cache.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Ativação: remove caches de versões antigas do app.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Busca: cache-first para os arquivos do próprio app (funciona 100% offline).
// Para recursos externos (ex: Google Fonts), tenta a rede primeiro e usa o
// cache como reserva — sem travar o app se a rede falhar.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (isSameOrigin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, resClone));
          return res;
        }).catch(() => cached);
      })
    );
  } else {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, resClone));
          return res;
        })
        .catch(() => caches.match(req))
    );
  }
});
