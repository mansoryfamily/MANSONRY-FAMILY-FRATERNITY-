self.addEventListener('install', e=>self.skipWaiting());
self.addEventListener('activate', e=>e.waitUntil(clients.claim()));
self.addEventListener('notificationclick', e=>{
  e.notification.close();
  e.waitUntil(clients.openWindow('globaladmin.html'));
});
