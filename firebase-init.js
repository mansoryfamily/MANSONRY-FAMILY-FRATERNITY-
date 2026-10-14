import { deleteToken, getMessaging, getToken, isSupported } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { get, push, ref, remove, set } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { app, auth, db } from "./firebase-config.js";

const VAPID_KEY = "BAGy-aXv1nzMOMdtlBa_F29-tQ2_uvkG1VheAg4FyMF6C6WQBqQbrUXlehDO7htLuPQ980I-uuYF5Cz33i2zVME";
let currentUser = null;
let messaging = null;
let registeredDevice = null;
const messagingReady = isSupported().then(supported => {
  if (supported) messaging = getMessaging(app);
  return supported;
}).catch(() => false);

async function registerCurrentDevice() {
  if (!currentUser || !('serviceWorker' in navigator) || !('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;
  if (!await messagingReady) return false;

  try {
    const registration = await navigator.serviceWorker.register('./sw.js');
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });
    if (!token) return false;

    const tokensRef = ref(db, `users/${currentUser.uid}/fcmTokens`);
    const snapshot = await get(tokensRef);
    let tokenKey = null;
    snapshot.forEach(child => {
      if (child.val()?.token === token) tokenKey = child.key;
    });
    if (!tokenKey) tokenKey = push(tokensRef).key;
    await set(ref(db, `users/${currentUser.uid}/fcmTokens/${tokenKey}`), {
      token,
      updatedAt: Date.now()
    });
    registeredDevice = { uid: currentUser.uid, tokenKey };
    localStorage.setItem('mff_fcm_token', token);
    return true;
  } catch (error) {
    console.error('FCM device registration failed:', error);
    return false;
  }
}

window.enableMffNotifications = async function() {
  if (!currentUser) return { ok: false, reason: 'Sign in first.' };
  if (!('Notification' in window)) return { ok: false, reason: 'Notifications are not supported in this browser.' };

  const permission = Notification.permission === 'granted'
    ? 'granted'
    : await Notification.requestPermission();
  if (permission !== 'granted') return { ok: false, reason: 'Notification permission was not granted.' };

  const saved = await registerCurrentDevice();
  return saved ? { ok: true } : { ok: false, reason: 'Could not register this device for notifications.' };
};

onAuthStateChanged(auth, async user => {
  const priorDevice = registeredDevice;
  currentUser = user;
  if (priorDevice && priorDevice.uid !== user?.uid) {
    registeredDevice = null;
    try {
      await remove(ref(db, `users/${priorDevice.uid}/fcmTokens/${priorDevice.tokenKey}`));
      if (messaging) await deleteToken(messaging);
    } catch (error) {
      console.warn('Could not remove signed-out device token:', error);
    }
    localStorage.removeItem('mff_fcm_token');
  }
  if (user && 'Notification' in window && Notification.permission === 'granted') registerCurrentDevice();
});

document.querySelectorAll('[data-enable-notifications]').forEach(button => {
  button.addEventListener('click', async () => {
    const result = await window.enableMffNotifications();
    if (result.ok) {
      button.textContent = 'Notifications enabled';
      button.disabled = true;
    } else {
      button.textContent = result.reason;
    }
  });
});
