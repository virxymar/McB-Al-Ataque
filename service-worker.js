const CACHE='mcb-al-ataque-v9';
const CORE=[
  './',
  './index.html',
  './configurador.html',
  './mcb-preflight.js',
  './mcb-hotfixes.js',
  './mcb-people-v2.js',
  './mcb-today-v2.js',
  './manifest.webmanifest',
  './icon.svg'
];
const FALLBACK='./index.html';

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE)
      .then(cache=>cache.addAll(CORE))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

function isMainNavigation(url){
  return (url.pathname.endsWith('/')||url.pathname.endsWith('/index.html'))&&!url.searchParams.has('safe');
}

function safeStart(){
  const html='<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>McB · Al Ataque</title><body style="font-family:system-ui;background:#f7f3ed;color:#2c2b28;display:grid;place-items:center;min-height:100vh;margin:0"><div style="text-align:center">🏠<br>Preparando McB…</div><script src="mcb-preflight.js"></script><script>location.replace("./index.html?safe=1")<\/script></body>';
  return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
}

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin) return;

  if(event.request.mode==='navigate'){
    if(isMainNavigation(url)){
      event.respondWith(Promise.resolve(safeStart()));
      return;
    }
    event.respondWith(
      fetch(event.request,{cache:'no-store'})
        .then(response=>{
          if(response&&response.ok){
            const copy=response.clone();
            caches.open(CACHE).then(cache=>cache.put(event.request,copy));
          }
          return response;
        })
        .catch(()=>caches.match(event.request,{ignoreSearch:true}).then(r=>r||caches.match(FALLBACK)))
    );
    return;
  }

  event.respondWith(
    fetch(event.request,{cache:'no-store'})
      .then(response=>{
        if(response&&response.ok){
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put(event.request,copy));
        }
        return response;
      })
      .catch(()=>caches.match(event.request,{ignoreSearch:true}))
  );
});