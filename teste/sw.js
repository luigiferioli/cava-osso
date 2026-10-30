const CACHE = 'cava-osso-teste-1f1c09d5bf', CACHE_VOZES = 'cava-osso-teste-vozes', MEU = k => k.indexOf('cava-osso-teste-') === 0;
const ARQUIVOS = ['./', 'manifest.webmanifest', 'icone-192.png', 'icone-512.png', 'icone-180.png'];
const VOZES = ["vozes/1-5dba466c.json","vozes/2-db892ead.json","vozes/3-67b5096e.json","vozes/4-3b9471f3.json","vozes/5-f4537508.json","vozes/6-a83cbc48.json","vozes/7-8a862bbb.json","vozes/8-2579e29a.json"];
async function reparoRaiz(base) {
  try {
    const raizUrl = new URL('../', base).href, marca = 'cavaosso-teste.v2';
    for (const k of await caches.keys()) {
      if (k.indexOf('cava-osso-teste') === 0) continue;
      const c = await caches.open(k);
      if (k === 'cava-osso-vozes') { for (const r of await c.keys()) if (r.url.indexOf('/teste/') >= 0) await c.delete(r); continue; }
      const r = await c.match(raizUrl); if (!r) continue;
      if ((await r.clone().text()).indexOf(marca) < 0) continue;
      let ok = false;
      try { const nova = await fetch(raizUrl, { cache: 'reload' }); if (nova.ok && (await nova.clone().text()).indexOf(marca) < 0) { await c.put(raizUrl, nova); ok = true; } } catch (_) {}
      if (!ok) await c.delete(raizUrl);
    }
  } catch (_) {}
}
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS.map(u => new Request(u, { cache: 'reload' }))))); });
self.addEventListener('activate', e => { e.waitUntil((async () => {
  for (const k of await caches.keys()) if (MEU(k) && k !== CACHE && k !== CACHE_VOZES) await caches.delete(k);   // só os caches desta versão (raiz e teste não apagam os do outro)
  const cv = await caches.open(CACHE_VOZES), atuais = VOZES.map(v => new URL(v, self.registration.scope).href);
  for (const r of await cv.keys()) if (atuais.indexOf(r.url) < 0) await cv.delete(r);
  await reparoRaiz(self.registration.scope);
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
    }).catch(() => caches.open(CACHE).then(c => c.match('./'))));
    return;
  }
  e.respondWith(caches.open(CACHE).then(c => c.match(req, { ignoreSearch: true })).then(r => r || fetch(req)));
});
