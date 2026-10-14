// Mansory Family Lodge - Service Worker v4 - Android Reply Support
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

const CACHE_NAME = 'mff-v4';

firebase.initializeApp({
  apiKey: "AIzaSyBSs3ekiR8vQ_1Ar5oZVBKGjuOQbwcgNEM",
  authDomain: "mansonry-family-fraternity.firebaseapp.com",
  databaseURL: "https://mansonry-family-fraternity-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "mansonry-family-fraternity",
  storageBucket: "mansonry-family-fraternity.firebasestorage.app",
  messagingSenderId: "964415179161",
  appId: "1:964415179161:web:cef44a38e4de304d7c6b08"
});

const messaging = firebase.messaging();
messaging.onBackgroundMessage(payload => {
  const data = payload.data || {};
  const title = data.title || payload.notification?.title || 'MFF Lodge';
  const body = data.body || payload.notification?.body || 'You have a new message.';
  return self.registration.showNotification(title, {
    body,
    icon: './icon-512.png',
    badge: './icon-192.png',
    vibrate: [200, 100, 200],
    tag: data.chatId || 'mff-message',
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url || './globaladmin.html',
      chatId: data.chatId || '',
      senderId: data.senderId || ''
    }
  });
});

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-512.png",
  "./images.jpeg"
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(ASSETS).catch(()=>{}))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key.startsWith('mff-') && key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// *** MISSING PART ADDED - REQUIRED FOR INSTALL ***
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then(r => {
        if (r && r.ok) {
          const clone = r.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return r;
      })
      .catch(() => caches.match(event.request).then(m => m || caches.match("./index.html")))
  );
});

self.addEventListener('notificationclick', event => {
  const notification = event.notification;
  const notificationData = notification.data || {};
  notification.close();
  const urlToOpen = new URL(notificationData.url || './globaladmin.html', self.registration.scope);
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        if (new URL(client.url).origin === urlToOpen.origin && typeof client.focus === 'function') {
          client.navigate(urlToOpen.href);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen.href);
      }
    })
  );
});

// HANDLE MESSAGES FROM DASHBOARD
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
