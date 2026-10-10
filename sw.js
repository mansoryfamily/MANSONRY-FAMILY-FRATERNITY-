
 // Mansory Family Lodge - Service Worker v4 - Android Reply Support
const CACHE_NAME = 'mff-v4';

self.addEventListener('install', event => {
  self.skipWaiting();
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

  const title = data.title || 'MFF Lodge';

  const options = {
    body: data.body || 'You have a new message',
    icon: './icon-512.png',
    badge: './icon-512.png',
    vibrate: [200, 100, 200, 100, 200],
    sound: 'https://cdn.pixabay.com/audio/2022/03/10/audio_4c1d5a8c3d.mp3',
    tag: 'mff-message',
    renotify: true,
    requireInteraction: true,

    data: {
      url: data.url || './dashboard.html',
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
    const replyText = typeof event.reply === 'string'
      ? event.reply.trim()
      : '';

    if (!replyText) return;

    event.waitUntil(
      (async () => {
        try {
          const clientsList = await self.clients.matchAll({
            type: 'window',
            includeUncontrolled: true
          });

          // If the dashboard is open, send the reply to it.
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

          // Preserve the existing backend request.
          // A failed request does not stop local message delivery.
          try {
            await fetch(
              'https://mansoryfamily.github.io/api/reply',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  reply: replyText,
                  sender: notificationData.sender || 'admin',
                  messageId: notificationData.messageId || null,
                  timestamp: Date.now()
                })
              }
            );
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
            self.registration
              .getNotifications({ tag: 'reply-confirm' })
              .then(notifications => {
                notifications.forEach(item => item.close());
              })
              .catch(() => {});
          }, 2000);

        } catch (error) {
          console.log('Reply failed', error);
        }
      })()
    );

    return;
  }

  // Open the app or focus an existing dashboard.
  const urlToOpen = new URL(
    notificationData.url || './dashboard.html',
    self.registration.scope
  );

  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(windowClients => {
      for (const client of windowClients) {
        if (
          client.url === urlToOpen.href &&
          typeof client.focus === 'function'
        ) {
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
