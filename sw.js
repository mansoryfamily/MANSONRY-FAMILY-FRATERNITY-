// Mansory Family Lodge - Service Worker v4 - Android Reply Support + Badge + Sound
const CACHE_NAME = 'mff-v4';
const SCOPE = '/MANSONRY-FAMILY-FRATERNITY-/';

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

// PUSH NOTIFICATION WITH REPLY + VOICE + BADGE + SOUND
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
    icon: SCOPE + 'icon-512.png',
    badge: SCOPE + 'icon-512.png',
    vibrate: [200, 100, 200, 100, 200],
    // Use local sound if you upload notification.mp3, fallback to online
    sound: SCOPE + 'notification.mp3',
    tag: 'mff-message',
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url || SCOPE + 'dashboard.html',
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
    (async () => {
      await self.registration.showNotification(title, options);
      // ADD BADGE COUNT when closed - Android Chrome
      try {
        if ('setAppBadge' in self.navigator || 'setAppBadge' in navigator) {
          // Increment badge
          if (navigator.setAppBadge) await navigator.setAppBadge(1);
        }
      } catch {}
    })()
  );
});

// CLICK + REPLY HANDLING - Kept your original logic 100%
self.addEventListener('notificationclick', e => {
  e.notification.close();

  if (e.action === 'reply') {
    const replyText = e.reply || e.action;
    
    e.waitUntil(
      (async () => {
        try {
          const clientsList = await clients.matchAll({ type: 'window' });
          
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

          await self.registration.showNotification('Reply sent', {
            body: `"${replyText}"`,
            icon: SCOPE + 'icon-512.png',
            badge: SCOPE + 'icon-512.png',
            tag: 'reply-confirm',
            silent: true
          });
          
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
    const urlToOpen = e.notification.data.url || SCOPE + 'dashboard.html';
    e.waitUntil(
      (async () => {
        // Clear badge when user opens
        try { if (navigator.clearAppBadge) await navigator.clearAppBadge(); } catch {}
        
        const windowClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
        for (let client of windowClients) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })()
    );
  }
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  // Clear badge from dashboard
  if (e.data && e.data.type === 'CLEAR_BADGE') {
    if (navigator.clearAppBadge) navigator.clearAppBadge().catch(()=>{});
  }
});
