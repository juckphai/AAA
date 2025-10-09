// กำหนดชื่อ Cache
const staticCacheName = 'money-tracker-static-v4';
const dynamicCacheName = 'money-tracker-dynamic-v2';

// ไฟล์ที่ต้องการ cache
const assets = [
  './',
  './index.html',
  './styles.css',
  './script.js',
  './manifest.json'
];

// install service worker
self.addEventListener('install', evt => {
  console.log('Service Worker: Installing');
  evt.waitUntil(
    caches.open(staticCacheName).then(cache => {
      console.log('Caching shell assets');
      return cache.addAll(assets);
    })
  );
  self.skipWaiting();
});

// activate event
self.addEventListener('activate', evt => {
  console.log('Service Worker: Activated');
  evt.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== staticCacheName && key !== dynamicCacheName)
          .map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// fetch event
self.addEventListener('fetch', evt => {
  // ข้ามการ cache สำหรับ CDN ภายนอก
  if (evt.request.url.includes('cdnjs.cloudflare.com') || 
      evt.request.url.includes('cdn.jsdelivr.net')) {
    return fetch(evt.request);
  }
  
  evt.respondWith(
    caches.match(evt.request).then(cacheRes => {
      return cacheRes || fetch(evt.request).then(fetchRes => {
        return caches.open(dynamicCacheName).then(cache => {
          // Cache only successful responses
          if (fetchRes.status === 200) {
            cache.put(evt.request.url, fetchRes.clone());
          }
          return fetchRes;
        });
      });
    }).catch(() => {
      // Fallback สำหรับหน้า HTML
      if (evt.request.destination === 'document') {
        return caches.match('./index.html');
      }
    })
  );
});