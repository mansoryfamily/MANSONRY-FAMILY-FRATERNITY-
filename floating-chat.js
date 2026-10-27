// Floating, non-movable chat shortcut pinned to the top edge on phones.
// It shows the real unread count for the member's global admin chat, so people
// who ignore or dismiss a push notification still see that a message is waiting.
(function () {
  'use strict';

  var ADMIN_UID = 'DMeM2UuLgDOusNvmzRGZygBdxOG2';
  var FIREBASE_CONFIG = {
    apiKey: 'AIzaSyBSs3ekiR8vQ_1Ar5oZVBKGjuOQbwcgNEM',
    authDomain: 'mansonry-family-fraternity.firebaseapp.com',
    databaseURL: 'https://mansonry-family-fraternity-default-rtdb.europe-west1.firebasedatabase.app',
    projectId: 'mansonry-family-fraternity',
    storageBucket: 'mansonry-family-fraternity.firebasestorage.app',
    messagingSenderId: '964415179161',
    appId: '1:964415179161:web:cef44a38e4de304d7c6b08'
  };

  var path = (location.pathname || '').toLowerCase();
  if (/globaladmin\.html|login\.html|register\.html|loader\.html|admin\.html/.test(path)) return;
  if (document.getElementById('mffFloatChat')) return;

  var style = document.createElement('style');
  style.textContent = [
    '#mffFloatChat{position:fixed;top:calc(6px + env(safe-area-inset-top));right:calc(10px + env(safe-area-inset-right));left:auto;transform:none;width:44px;height:44px;border-radius:50%;',
    'background:linear-gradient(145deg,#142238,#0b1728);border:1.5px solid #d4af37;box-shadow:0 8px 22px rgba(0,0,0,.55),0 0 0 3px rgba(212,175,55,.12);',
    'display:grid;place-items:center;z-index:100002;cursor:pointer;padding:0;outline:none;-webkit-tap-highlight-color:transparent;transition:border-color .2s,box-shadow .2s;}',
    '#mffFloatChat svg{width:22px;height:22px;fill:#d4af37;pointer-events:none;transition:fill .2s;}',
    '#mffFloatChat.has-unread{border-color:#00e676;box-shadow:0 8px 22px rgba(0,0,0,.55),0 0 0 4px rgba(0,230,118,.18);animation:mffFloatPulse 1.8s infinite;}',
    '#mffFloatChat.has-unread svg{fill:#00e676;}',
    '#mffFloatBadge{position:absolute;top:-6px;right:-6px;min-width:20px;height:20px;padding:0 5px;border-radius:999px;background:#00e676;color:#032412;',
    'font:900 11px/20px Poppins,Arial,sans-serif;text-align:center;display:none;box-shadow:0 2px 8px rgba(0,0,0,.5),0 0 0 2px #0b1728;border:1px solid rgba(255,255,255,.35);letter-spacing:.2px;}',
    '@keyframes mffFloatPulse{0%,100%{box-shadow:0 8px 22px rgba(0,0,0,.55),0 0 0 4px rgba(0,230,118,.18)}50%{box-shadow:0 8px 22px rgba(0,0,0,.55),0 0 0 9px rgba(0,230,118,0)}}',
    '@media(min-width:901px){#mffFloatChat{top:auto;bottom:24px;left:auto;right:24px;transform:none;}}',
    '@media(max-width:900px){header{padding-right:64px!important;}header .logo{font-size:16px!important;max-width:30vw;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}}'
  ].join('');
  document.head.appendChild(style);

  var btn = document.createElement('button');
  btn.id = 'mffFloatChat';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Open administration messages');
  btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6.2 12 12.6l9-6.4V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v.2ZM3 8.6V18a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.6l-9 6.4-9-6.4Z"/></svg><span id="mffFloatBadge" aria-live="polite">0</span>';
  document.body.appendChild(btn);
  var badge = document.getElementById('mffFloatBadge');
  // Hidden until Firebase confirms a signed-in member. Guests and people who
  // have not registered must not see the Administration shortcut.
  btn.style.display = 'none';
  btn.setAttribute('aria-hidden', 'true');
  var currentUid = '';

  function showIcon() {
    btn.style.display = 'grid';
    btn.removeAttribute('aria-hidden');
  }

  function hideIcon() {
    btn.style.display = 'none';
    btn.setAttribute('aria-hidden', 'true');
  }

  function storedUid() {
    try {
      var raw = localStorage.getItem('mff_user');
      if (!raw) return '';
      var user = JSON.parse(raw);
      return user && user.uid ? String(user.uid) : '';
    } catch (e) { return ''; }
  }

  // Signed-in users get the shortcut immediately (with the remembered badge),
  // then Firebase confirms the session. Guests never see it.
  var cachedUid = storedUid();
  if (cachedUid) {
    currentUid = cachedUid;
    showIcon();
  }

  function setBadge(count) {
    var n = Math.max(0, Number(count) || 0);
    badge.textContent = n > 99 ? '99+' : String(n);
    badge.style.display = n > 0 ? 'block' : 'none';
    btn.classList.toggle('has-unread', n > 0);
    btn.title = n > 0 ? (n + ' unread message' + (n === 1 ? '' : 's')) : 'Administration messages';
    btn.setAttribute('aria-label', n > 0 ? (n + ' unread administration message' + (n === 1 ? '' : 's')) : 'Open administration messages');
    try { localStorage.setItem('globalChatBadge_count', String(n)); } catch (e) {}
    if (window.LodgeNotifier) {
      try { window.LodgeNotifier.setAppIconBadge(n); } catch (e) {}
    }
  }

  btn.addEventListener('click', function () {
    var uid = currentUid || storedUid();
    if (uid) {
      location.href = './globaladmin.html?chatId=' + encodeURIComponent(ADMIN_UID + '_' + uid);
    } else {
      location.href = './globaladmin.html';
    }
  });

  // Show a remembered count instantly, then replace it with live data.
  try {
    var saved = parseInt(localStorage.getItem('globalChatBadge_count') || '0', 10);
    if (saved > 0) setBadge(saved);
  } catch (e) {}

  function startLive(attempt) {
    attempt = attempt || 0;
    var loggedIn = localStorage.getItem('mff_logged_in') === 'true' || !!storedUid();
    if (!loggedIn) {
      // The dashboard writes the profile cache a moment after the module
      // boots, so give it a few short chances before treating this as a guest.
      if (attempt < 10) { setTimeout(function () { startLive(attempt + 1); }, 400); return; }
      hideIcon();
      setBadge(0);
      return;
    }
    showIcon();

    Promise.all([
      import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js')
    ]).then(function (mods) {
      var appMod = mods[0], authMod = mods[1], dbMod = mods[2];
      var app = appMod.getApps().length ? appMod.getApp() : appMod.initializeApp(FIREBASE_CONFIG);
      var auth = authMod.getAuth(app);
      var db = dbMod.getDatabase(app);
      var unsubscribe = null;
      var notifUnsubscribe = null;
      var baseline = 0;
      var firstSnapshot = true;

      function stop() {
        if (unsubscribe) { try { unsubscribe(); } catch (e) {} unsubscribe = null; }
        if (notifUnsubscribe) { try { notifUnsubscribe(); } catch (e) {} notifUnsubscribe = null; }
        setBadge(0);
      }

      function subscribe(uid) {
        if (unsubscribe) { try { unsubscribe(); } catch (e) {} }
        if (notifUnsubscribe) { try { notifUnsubscribe(); } catch (e) {} notifUnsubscribe = null; }
        baseline = 0;
        firstSnapshot = true;
        unsubscribe = dbMod.onValue(dbMod.ref(db, 'chats/' + ADMIN_UID + '_' + uid), function (snap) {
          var chat = snap.val() || {};
          if (chat.hiddenFor && chat.hiddenFor[uid]) { setBadge(0); return; }
          var msgs = chat.messages || {};
          var seen = Number(chat.seenByMember || 0);
          var count = 0;
          var latest = null;
          Object.keys(msgs).forEach(function (mid) {
            var m = msgs[mid];
            if (!m || typeof m !== 'object') return;
            if (m.deletedFor && m.deletedFor[uid]) return;
            if (m.senderId !== ADMIN_UID) return;
            if (Number(m.time || 0) > seen) {
              count += 1;
              if (!latest || Number(m.time || 0) > Number(latest.time || 0)) {
                latest = { id: mid, text: m.text || '', mediaType: m.mediaType || '', time: Number(m.time || 0) };
              }
            }
          });
          setBadge(count);
          if (latest) {
            if (!firstSnapshot && latest.time > baseline && Date.now() - latest.time < 120000 && window.LodgeNotifier) {
              var body = latest.text || (latest.mediaType === 'audio' ? '🎤 Voice note' : latest.mediaType === 'video' ? '🎥 Video' : '📷 Photo');
              try { window.LodgeNotifier.showPopup('Director', body, 'admin_message', { id: latest.id }); } catch (e) {}
            }
            if (!baseline || latest.time > baseline) baseline = latest.time;
          }
          firstSnapshot = false;
        }, function () {
          // Keep the last known badge on a transient read error.
        });

        // Announcement inbox: the admin writes one record per member under
        // notifications/<uid>/<announcementId>. Show the newest unseen one as
        // a popup (the same record also drives the closed-app push).
        notifUnsubscribe = dbMod.onValue(dbMod.ref(db, 'notifications/' + uid), function (snap) {
          var data = snap.val() || {};
          var ids = Object.keys(data).filter(function (id) {
            var n = data[id];
            return n && typeof n === 'object' && n.announcementId;
          });
          if (!ids.length) return;
          ids.sort(function (a, b) { return Number(data[b].timestamp || 0) - Number(data[a].timestamp || 0); });
          var latest = data[ids[0]];
          var marker = 'mff_ann_seen_' + (latest.announcementId || ids[0]);
          var already = false;
          try { already = localStorage.getItem(marker) === '1'; } catch (e) {}
          if (already) return;
          try { localStorage.setItem(marker, '1'); } catch (e) {}
          // Do not replay very old announcements on first launch.
          if (latest.timestamp && Date.now() - Number(latest.timestamp) > 7 * 24 * 60 * 60 * 1000) return;
          if (!window.LodgeNotifier) return;
          try {
            window.LodgeNotifier.showPopup(
              'MFF Announcement',
              latest.message || latest.title || 'New announcement',
              'announcement',
              { id: latest.announcementId || ids[0] }
            );
          } catch (e) {}
        });
      }

      authMod.onAuthStateChanged(auth, function (user) {
        if (user && user.uid) {
          currentUid = user.uid;
          showIcon();
          subscribe(user.uid);
        } else {
          currentUid = '';
          hideIcon();
          stop();
        }
      });
    }).catch(function () {
      // Never show the Administration shortcut to a guest if auth cannot load.
      hideIcon();
    });
  }

  // Start after the page's own module has initialised Firebase. The dashboard,
  // member and policy pages call initializeApp() themselves, and racing them
  // would throw a duplicate-app error on those pages.
  function bootLive() {
    setTimeout(function () { startLive(0); }, 800);
  }
  if (document.readyState === 'complete') bootLive();
  else window.addEventListener('load', bootLive, { once: true });
})();
