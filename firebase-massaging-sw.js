importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBSs3ekiR8vQ_1Ar5oZVBKGjuOQbwcgNEM",
  authDomain: "mansonry-family-fraternity.firebaseapp.com",
  databaseURL: "https://mansonry-family-fraternity-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "mansonry-family-fraternity",
  storageBucket: "mansonry-family-fraternity.firebasestorage.app",
  messagingSenderId: "964415179161",
  appId: "1:964415179161:web:cef44a38e4de304d7c6b08",
  measurementId: "G-9Q2KEWMXVR"
});

const messaging = firebase.messaging();

// THIS WORKS WHEN APP CLOSED - Badge like WhatsApp screenshot
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "MFF Lodge";
  const body = payload.notification?.body || "Hello member, you got a new message from director please reply.";
  
  if (self.navigator.setAppBadge) {
    try{ self.navigator.setAppBadge(1); }catch{}
  }

  self.registration.showNotification(title, {
    body: body,
    icon: "./icon-512.png",
    badge: "./icon-192.png",
    vibrate: [200,100,200],
    tag: "mff-message",
    renotify: true,
    requireInteraction: true,
    data: {url: "./globaladmin.html"}
  });
});

self.addEventListener("notificationclick", e=>{
  e.notification.close();
  if(self.navigator.clearAppBadge) try{self.navigator.clearAppBadge();}catch{}
  e.waitUntil(clients.openWindow(e.notification.data?.url || "./globaladmin.html"));
});
