// Mansory Family Lodge - Service Worker v4 - Reply + Badge + Sound + Firebase B - FINAL
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBSs3ekiR8vQ_1Ar5oZVBKGjuOQbwcgNEM",
  authDomain: "mansonry-family-fraternity.firebaseapp.com",
  databaseURL: "https://mansonry-family-fraternity-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "mansonry-family-fraternity",
  storageBucket: "mansonry-family-fraternity.firebasestorage.app",
  messagingSenderId: "964415179161",
  appId: "1:964415179161:web:a309ab13fa7875da7c6b08"
});
const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'MFF Lodge';
  self.registration.showNotification(title, {
    body: payload.notification?.body || 'New message from Lodge',
    icon: '/MANSONRY-FAMILY-FRATERNITY-/icon-512.png',
    badge: '/MANSONRY-FAMILY-FRATERNITY-/icon-512.png',
    vibrate: [200, 100, 200, 100, 200]
  });
});

const CACHE_NAME = 'mff-v4';
const SCOPE = '/MANSONRY-FAMILY-FRATERNITY-/';
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(()=> self.clients.claim()));
});
self.addEventListener('push', e => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch { data = { body: e.data ? e.data.text() : 'New message from Lodge' }; }
  const title = data.title || 'MFF Lodge';
  const options = {
    body: data.body || 'You have a new message',
    icon: SCOPE + 'icon-512.png',
    badge: SCOPE + 'icon-512.png',
    vibrate: [200, 100, 200, 100, 200],
    sound: SCOPE + 'notification.mp3',
    tag: 'mff-message',
    renotify: true,
    requireInteraction: true,
    data: { url: data.url || SCOPE + 'dashboard.html', sender: data.sender || 'admin', messageId: data.messageId || Date.now() },
    actions: [{ action: 'reply', title: 'Reply', type: 'text', placeholder: 'Type a message...' }, { action: 'open', title: 'Open' }]
  };
  e.waitUntil((async () => { await self.registration.showNotification(title, options); try{ if(navigator.setAppBadge) await navigator.setAppBadge(1); }catch{} })());
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'reply') {
    const replyText = e.reply || e.action;
    e.waitUntil((async () => {
      try {
        const clientsList = await clients.matchAll({ type: 'window' });
        if (clientsList.length > 0) { clientsList.forEach(client => { client.postMessage({ type: 'REPLY_FROM_NOTIFICATION', reply: replyText, sender: e.notification.data.sender, time: new Date().toISOString() }); }); }
        await fetch('https://mansonry-family-fraternity-default-rtdb.europe-west1.firebasedatabase.app/replies.json', { method: 'POST', body: JSON.stringify({ reply: replyText, sender: e.notification.data.sender, time: Date.now() }) }).catch(()=>{});
        await self.registration.showNotification('Reply sent', { body: `"${replyText}"`, icon: SCOPE + 'icon-512.png', badge: SCOPE + 'icon-512.png', tag: 'reply-confirm', silent: true });
        setTimeout(() => { self.registration.getNotifications({tag: 'reply-confirm'}).then(n => n.forEach(x=>x.close())); }, 2000);
      } catch (err) {}
    })());
  } else {
    const urlToOpen = e.notification.data.url || SCOPE + 'dashboard.html';
    e.waitUntil((async () => {
      try { if (navigator.clearAppBadge) await navigator.clearAppBadge(); } catch {}
      const windowClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (let client of windowClients) { if (client.url.includes(urlToOpen) && 'focus' in client) { return client.focus(); } }
      if (clients.openWindow) { return clients.openWindow(urlToOpen); }
    })());
  }
});
self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (e.data?.type === 'CLEAR_BADGE' && navigator.clearAppBadge) navigator.clearAppBadge().catch(()=>{});
});
