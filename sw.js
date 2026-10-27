// Masonry Family Lodge - Service Worker v9 - safe offline fallback
const CACHE_NAME = 'mff-v10';

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-512.png",
  "./notification.wav",
  "./images.jpeg"
];

const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Masonry Family - Offline</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;font-family:system-ui,sans-serif}
body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#07111f;color:#fff;text-align:center;padding:24px}
.box{max-width:360px}
h1{color:#d4af37;font-size:22px;margin-bottom:12px}
p{color:#9fb0c5;line-height:1.6;font-size:14px;margin-bottom:22px}
button{background:#d4af37;color:#111;border:0;border-radius:30px;padding:13px 30px;font-weight:700;font-size:15px}
</style></head><body><div class="box">
<h1>You are offline</h1>
<p>This page could not be reached. Check your connection and try again.</p>
<button onclick="location.reload()">Retry</button>
</div></body></html>`;

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(ASSETS).catch(() => {}))
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

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      if (response && response.ok) {
        const cache = await caches.open(CACHE_NAME);
        // Cache the exact request. Never serve index.html for a different
        // page: that made the app look "stuck on the main page" whenever a
        // navigation failed on a weak connection.
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    } catch (error) {
      const cached = await caches.match(request);
      if (cached) return cached;

      if (request.mode === 'navigate') {
        return new Response(OFFLINE_HTML, {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }
      return Response.error();
    }
  })());
});


// PUSH NOTIFICATION WITH REPLY + VOICE
self.addEventListener('push', event => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (error) {
    data = {
      body: event.data ? event.data.text() : 'New message from Lodge'
    };
  }
  // OneSignal web push wraps our `data` object in `custom`; the plain
  // Firebase/raw shape keeps it at the top level. Support both.
  const extra = data.custom || data.data || {};
  const type = extra.type || data.type || 'chat';
  const title = data.title || data.heading || (type === 'announcement' ? 'MFF Announcement' : 'MFF Lodge');
  const options = {
    body: data.body || data.message || (type === 'announcement' ? 'New announcement from Lodge' : 'You have a new message'),
    icon: './icon-512.png',
    badge: './icon-512.png',
    vibrate: [200, 100, 200, 100, 200],
    sound: 'https://cdn.pixabay.com/audio/2022/03/10/audio_4c1d5a8c3d.mp3',
    tag: type === 'announcement' ? ('mff-ann-' + (extra.announcementId || Date.now())) : 'mff-message',
    renotify: true,
    requireInteraction: true,
    data: {
      type,
      url: extra.url || data.url || (type === 'announcement' ? './dashboard.html' : './dashboard.html'),
      sender: extra.sender || data.sender || 'admin',
      chatId: extra.chatId || data.chatId || '',
      announcementId: extra.announcementId || data.announcementId || '',
      messageId: extra.messageId || data.messageId || Date.now()
    },
    actions: type === 'announcement'
      ? [{ action: 'open', title: 'Open' }]
      : [
          {
            action: 'reply',
            title: 'Reply',
            type: 'text',
            placeholder: 'Type a message...'
          },
          {
            action: 'open',
            title: 'Open'
          }
        ]
  };
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// CLICK + REPLY HANDLING
self.addEventListener('notificationclick', event => {
  const notification = event.notification;
  const notificationData = notification.data || {};
  notification.close();
  if (event.action === 'reply') {
    const replyText = typeof event.reply === 'string' ? event.reply.trim() : '';
    if (!replyText) return;
    event.waitUntil(
      (async () => {
        try {
          const clientsList = await self.clients.matchAll({
            type: 'window',
            includeUncontrolled: true
          });
          if (clientsList.length > 0) {
            clientsList.forEach(client => {
              client.postMessage({
                type: 'REPLY_FROM_NOTIFICATION',
                reply: replyText,
                sender: notificationData.sender || 'admin',
                messageId: notificationData.messageId || null,
                time: new Date().toISOString()
              });
            });
          }
          try {
            await fetch('https://mansoryfamily.github.io/api/reply', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                reply: replyText,
                sender: notificationData.sender || 'admin',
                messageId: notificationData.messageId || null,
                timestamp: Date.now()
              })
            });
          } catch (error) {
            console.log('Reply backend unavailable:', error);
          }
          await self.registration.showNotification('Reply sent', {
            body: `"${replyText}"`,
            icon: './icon-512.png',
            badge: './icon-512.png',
            tag: 'reply-confirm',
            silent: true
          });
          setTimeout(() => {
            self.registration.getNotifications({ tag: 'reply-confirm' }).then(notifications => {
              notifications.forEach(item => item.close());
            }).catch(() => {});
          }, 2000);
        } catch (error) {
          console.log('Reply failed', error);
        }
      })()
    );
    return;
  }
  const urlToOpen = new URL(notificationData.url || './dashboard.html', self.registration.scope);
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url === urlToOpen.href && typeof client.focus === 'function') {
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
