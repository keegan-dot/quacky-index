const CACHE = 'quacky-v5';
const ASSETS = ['/', '/index.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Let the network handle API/media requests directly.
  if (e.request.url.includes('open-meteo.com') || e.request.url.includes('erddap') || e.request.url.includes('youtube')) {
    return;
  }
  // Network-first for the app shell: always fetch fresh when online so pushed
  // updates appear immediately; fall back to cache only when offline.
  e.respondWith(
    fetch(e.request)
      .then(resp => {
        if (e.request.method === 'GET' && resp.ok) {
          const copy = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return resp;
      })
      .catch(() => caches.match(e.request))
  );
});
