const CACHE_NAME = 'vngrd-v2'; // Incrementing version clears the old laggy cache
const assets = [
  './index.html',
  './src/app.js',
  './src/Compositor.js'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Forces the new, faster worker to take over immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(assets))
  );
});

self.addEventListener('fetch', (event) => {
    // This strategy serves from cache first, then network, to stop the lag
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});