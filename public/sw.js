/* Offline-first service worker: the app shell is cached on install, fonts are cached as they are seen.
   Bump VERSION when you change any file so installed copies update. */
const VERSION='sb-v1',SHELL=['./','index.html','manifest.webmanifest','icons/icon.svg','icons/icon-192.png','icons/icon-512.png','icons/maskable-512.png','icons/apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==VERSION&&x.startsWith('sb-')).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
 const r=e.request,u=new URL(r.url);
 if(r.method!=='GET')return;
 // never cache API traffic (Firebase, Anthropic): those need the live network
 if(/(firestore|identitytoolkit|securetoken|firebase)\.googleapis\.com|api\.anthropic\.com/.test(u.host))return;
 if(u.origin===location.origin){
  // pages: network first so updates arrive, cache as the offline fallback
  if(r.mode==='navigate'){e.respondWith(fetch(r).then(x=>{const c=x.clone();caches.open(VERSION).then(k=>k.put('index.html',c));return x}).catch(()=>caches.match('index.html')));return}
  e.respondWith(caches.match(r).then(m=>m||fetch(r).then(x=>{const c=x.clone();caches.open(VERSION).then(k=>k.put(r,c));return x})));return}
 // fonts and other static third-party files: cache as seen
 if(/fonts\.(googleapis|gstatic)\.com/.test(u.host))e.respondWith(caches.match(r).then(m=>m||fetch(r).then(x=>{const c=x.clone();caches.open(VERSION).then(k=>k.put(r,c));return x}).catch(()=>m)))});
