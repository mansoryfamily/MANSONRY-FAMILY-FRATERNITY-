importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBSs3ekiR8vQ_1Ar5oZVBKGjuOQbwcgNEM",
  authDomain: "mansonry-family-fraternity.firebaseapp.com",
  projectId: "mansonry-family-fraternity",
  storageBucket: "mansonry-family-fraternity.firebasestorage.app",
  messagingSenderId: "964415179161", // FIXED
  appId: "1:964415179161:web:c8fd1a777542932d7c6b08" // FIXED
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: 'icon-512.png', // Gold compass shows here
    badge: 'icon-192.png',
    image: payload.notification.image || null,
    vibrate: [200, 100, 200],
    data: { url: payload.data?.url || 'index.html' }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({type: 'window'}).then(clientList => {
      // If app is open, focus it. If not, open new
      for (const client of clientList) {
        if (client.url.includes('index.html') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});
