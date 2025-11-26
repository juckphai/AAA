// service-worker.js
// อัปเดตเวอร์ชัน cache เพื่อให้เครื่องลูกข่ายรู้ว่ามีการเปลี่ยนแปลง (v445 -> v446)
const staticCacheName = 'account-app-static-v449';
const dynamicCacheName = 'account-app-dynamic-v449';

// รายการไฟล์ที่ต้องการ Cache ทันทีที่ติดตั้ง (รวม CDN แล้ว)
const assets = [
  './',
  './index.html',
  './manifest.json',
  './style.css',
  './script.js',
  './192.png',
  './512.png',
  // เพิ่มไลบรารีภายนอกเพื่อให้ทำงาน Offline ได้
  'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.2/papaparse.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'
];

// 1. Install Event: ติดตั้งและ Cache ไฟล์เริ่มต้น
self.addEventListener('install', evt => {
  console.log('Service Worker: Installing');
  evt.waitUntil(
    caches.open(staticCacheName)
      .then(cache => {
        console.log('Caching shell assets');
        return cache.addAll(assets);
      })
      .catch(err => {
        console.error('Cache addAll error:', err);
      })
  );
  // บังคับให้ SW ตัวใหม่ทำงานทันทีไม่ต้องรอปิด Tab
  self.skipWaiting();
});

// 2. Activate Event: ลบ Cache เวอร์ชั่นเก่าออก
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

// 3. Fetch Event: จัดการการโหลดข้อมูล (Cache First strategy)
self.addEventListener('fetch', evt => {
  
  // ตรวจสอบว่าเป็น request ที่รองรับหรือไม่ (ป้องกัน error กับ chrome-extension หรือ protocol แปลกๆ)
  if (evt.request.url.indexOf('http') !== 0) return;

  evt.respondWith(
    caches.match(evt.request)
      .then(cacheRes => {
        // A. ถ้ามีใน Cache ให้ใช้จาก Cache เลย (เร็วที่สุด)
        return cacheRes || fetch(evt.request).then(fetchRes => {
            // B. ถ้าไม่มีใน Cache ให้โหลดจาก Network
            return caches.open(dynamicCacheName).then(cache => {
                // เก็บลง Dynamic Cache เฉพาะไฟล์ที่โหลดสำเร็จและเป็นไฟล์ปกติ
                if (fetchRes.status === 200) {
                   cache.put(evt.request.url, fetchRes.clone());
                }
                return fetchRes;
            });
        });
      })
      .catch(() => {
        // C. ถ้า Offline และหาไฟล์ไม่ได้ (เช่นเปลี่ยนหน้า) ให้ส่งหน้า index.html แทน
        if (evt.request.destination === 'document') {
          return caches.match('./index.html');
        }
      })
  );
});