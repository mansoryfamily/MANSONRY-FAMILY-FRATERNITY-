// Mansory Family Lodge - Service Worker v4 - Android Reply Support
const CACHE_NAME = 'mff-v4';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(()=> self.clients.claim())
  );
});

// PUSH NOTIFICATION WITH REPLY + VOICE
self.addEventListener('push', e => {
  let data = {};
  try {
    data = e.data ? e.data.json() : {};
  } catch {
    data = { body: e.data ? e.data.text() : 'New message from Lodge' };
  }

  const title = data.title || 'MFF Lodge';
  const options = {
    body: data.body || 'You have a new message',
    icon: 'icon-512.png',
    badge: 'icon-512.png',
    vibrate: [200, 100, 200, 100, 200], // WhatsApp style vibration
    sound: 'https://cdn.pixabay.com/audio/2022/03/10/audio_4c1d5a8c3d.mp3',
    tag: 'mff-message',
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url || 'dashboard.html',
      sender: data.sender || 'admin',
      messageId: data.messageId || Date.now()
    },
    actions: [
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

  e.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// CLICK + REPLY HANDLING
self.addEventListener('notificationclick', e => {
  e.notification.close();

  if (e.action === 'reply') {
    const replyText = e.reply || e.action;
    
    // Send reply to server WITHOUT opening app - like WhatsApp
    e.waitUntil(
      (async () => {
        try {
          // Save reply locally for dashboard to read
          const clientsList = await clients.matchAll({ type: 'window' });
          
          // If dashboard is open, send message to it
          if (clientsList.length > 0) {
            clientsList.forEach(client => {
              client.postMessage({
                type: 'REPLY_FROM_NOTIFICATION',
                reply: replyText,
                sender: e.notification.data.sender,
                time: new Date().toISOString()
              });
            });
          }
          
          // Also try to send to your backend/OneSignal
          await fetch('https://mansoryfamily.github.io/api/reply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              reply: replyText,
              sender: e.notification.data.sender,
              messageId: e.notification.data.messageId,
              timestamp: Date.now()
            })
          }).catch(()=>{});

          // Show confirmation notification
          await self.registration.showNotification('Reply sent', {
            body: `"${replyText}"`,
            icon: 'icon-512.png',
            badge: 'icon-512.png',
            tag: 'reply-confirm',
            silent: true
          });
          
          // Auto close confirm after 2 sec
          setTimeout(() => {
            self.registration.getNotifications({tag: 'reply-confirm'}).then(notifs => {
              notifs.forEach(n => n.close());
            });
          }, 2000);

        } catch (err) {
          console.log('Reply failed', err);
        }
      })()
    );
    
  } else {
    // Open app
    const urlToOpen = e.notification.data.url || 'dashboard.html';
    e.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
        // If app already open, focus it
        for (let client of windowClients) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open new
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  }
});

// Handle messages from dashboard
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
