import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging.js";
const firebaseConfig = {
  apiKey: "PUT_API_KEY_HERE",
  authDomain: "mansory-family.firebaseapp.com",
  projectId: "mansory-family",
  storageBucket: "mansory-family.appspot.com",
  messagingSenderId: "PUT_SENDER_ID_HERE",
  appId: "PUT_APP_ID_HERE"
};
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);
navigator.serviceWorker.ready.then(async (reg) => {
  try {
    const token = await getToken(messaging, {
      vapidKey: "BAGy-aXv1nzMOMdtlBa_F29-tQ2_uvkG1VheAg4FyMF6C6WQBqQbrUXlehDO7htLuPQ980I-uuYF5Cz33i2zVME",
      serviceWorkerRegistration: reg
    });
    localStorage.setItem('mff_fcm_token', token);
    console.log("Mansory Token ready");
  } catch(e){ console.log("FCM failed", e); }
});
onMessage(messaging, (payload) => {
  const { title, body } = payload.notification;
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/MANSONRY-FAMILY-FRATERNITY-/icon-512.png' });
  }
  if ('setAppBadge' in navigator) navigator.setAppBadge(1);
  new Audio('/MANSONRY-FAMILY-FRATERNITY-/notification.mp3').play().catch(()=>{});
});
