const CACHE = 'cava-osso-1f238cc1ec', CACHE_VOZES = 'cava-osso-vozes';
const ARQUIVOS = ['./', 'manifest.webmanifest', 'icone-192.png', 'icone-512.png', 'icone-180.png'];
const VOZES = ["vozes/1-6d7e9794.json","vozes/2-db892ead.json","vozes/3-f4537508.json","vozes/4-a83cbc48.json","vozes/5-67b5096e.json","vozes/6-3b9471f3.json","vozes/7-8a862bbb.json","vozes/8-2579e29a.json"];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS.map(u => new Request(u, { cache: 'reload' }))))); });
self.addEventListener('activate', e => { e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== CACHE && k !== CACHE_VOZES) await caches.delete(k);
  const cv = await caches.open(CACHE_VOZES), atuais = VOZES.map(v => new URL(v, self.registration.scope).href);
  for (const r of await cv.keys()) if (atuais.indexOf(r.url) < 0) await cv.delete(r);
  await self.clients.claim();
})()); });
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.indexOf('/vozes/') >= 0) {
    e.respondWith(caches.open(CACHE_VOZES).then(c => c.match(req).then(r => r || fetch(req).then(res => { if (res.ok) c.put(req, res.clone()); return res; }))));
    return;
  }
  if (req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('/index.html')) {
    e.respondWith(fetch(req, { cache: 'no-cache' }).then(res => {
      if (res.ok) { const copia = res.clone(); caches.open(CACHE).then(c => c.put('./', copia)); }
      return res;
    }).catch(() => caches.match('./')));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(r => r || fetch(req)));
});
