self.addEventListener('install', e=>self.skipWaiting());
self.addEventListener('activate', e=>e.waitUntil(clients.claim()));
self.addEventListener('notificationclick', e=>{
  e.notification.close();
  e.waitUntil(clients.openWindow('globaladmin.html'));
});
self.addEventListener('push', e=>{
  if(e.data){
    const d=e.data.json();
    self.registration.showNotification(d.title||'MFF Lodge', {
      body:d.body||'New message',
      icon:'masonic-G.png',
      badge:'masonic-G.png',
      vibrate:[200,100,200],
      tag:'mff-message',
      requireInteraction:true
    });
  }
});
