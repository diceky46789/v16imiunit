const CACHE='word-order-slot-v16-1-modular-plus';
const FILES=[
 './','./index.html','./style.css','./manifest.json','./problems.json',
 './js/storage.js','./js/csv.js','./js/order.js','./js/folders.js',
 './js/practice.js','./js/audio.js','./js/list.js','./js/app.js',
 './icon-192.png','./icon-512.png'
];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',e=>{e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)))});
