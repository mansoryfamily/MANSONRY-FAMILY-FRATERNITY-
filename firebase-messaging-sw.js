importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBSs3ekiR8vQ_1Ar5oZVBKGjuOQbwcgNEM",
  authDomain: "mansonry-family-fraternity.firebaseapp.com",
  projectId: "mansonry-family-fraternity",
  storageBucket: "mansonry-family-fraternity.firebasestorage.app",
  messagingSenderId: "964415179161",
  appId: "1:964415179161:web:c8fd1a777542932d7c6b08"
});

const messaging = firebase.messaging();

// BACKGROUND NOTIFICATION - when app is closed
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: 'icon-512.png', // Shows in notification
    badge: 'icon-192.png', // Small icon on Android
    image: payload.notification.image || null,
    vibrate: [200, 100, 200],
    data: { 
      url: payload.data?.url || 'dashboard.html' // DEFAULT TO DASHBOARD
    },
    tag: 'mff-announcement' // Groups notifications
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// WHEN USER CLICKS NOTIFICATION
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data.url || 'dashboard.html';

  event.waitUntil(
    clients.matchAll({type: 'window', includeUncontrolled: true}).then(clientList => {
      // If dashboard is already open, just focus it
      for (const client of clientList) {
        if (client.url.includes('dashboard.html') && 'focus' in client) {
          return client.focus();
        }
      }
      // If app is open on another page, open dashboard in new tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
