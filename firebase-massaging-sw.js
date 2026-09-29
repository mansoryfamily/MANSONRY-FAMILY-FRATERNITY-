importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyBSs3ekiR8vQ_1Ar5oZVBKGjuOQbwcgNEM",
  authDomain: "mansonry-family-fraternity.firebaseapp.com",
  databaseURL: "https://mansonry-family-fraternity-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "mansonry-family-fraternity",
  storageBucket: "mansonry-family-fraternity.firebasestorage.app",
  messagingSenderId: "964415179161",
  appId: "1:964415179161:web:c8fd1a777542932d7c6b08"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// When app CLOSED - show push like your screenshot with sound + badge 1
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "Freemasonry Heritage";
  const body = payload.notification?.body || "New message from Lodge";
  const badgeCount = parseInt(payload.data?.badgeCount || "1");

  const options = {
    body: body,
    icon: "/masonic-icon.png",
    badge: "/masonic-icon.png",
    sound: "/sounds/notification.mp3",
    vibrate: [200, 100, 200],
    tag: payload.data?.chatId || "lodge-notif",
    renotify: true,
    requireInteraction: true,
    data: { url: payload.data?.url || "/help.html" },
    actions: [{ action: "open", title: "Open" }]
  };
  self.registration.showNotification(title, options);

  // Set app icon badge like your Messages 1 screenshot (Android PWA)
  if (self.navigator.setAppBadge) {
    self.navigator.setAppBadge(badgeCount).catch(()=>{});
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (self.navigator.clearAppBadge) self.navigator.clearAppBadge().catch(()=>{});
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
