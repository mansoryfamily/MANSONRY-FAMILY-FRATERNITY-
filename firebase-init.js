import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging.js";
const firebaseConfig = {
  apiKey: "AIzaSyBSs3ekiR8vQ_1Ar5oZVBKGjuOQbwcgNEM",
  authDomain: "mansonry-family-fraternity.firebaseapp.com",
  databaseURL: "https://mansonry-family-fraternity-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "mansonry-family-fraternity",
  storageBucket: "mansonry-family-fraternity.firebasestorage.app",
  messagingSenderId: "964415179161",
  appId: "1:964415179161:web:a309ab13fa7875da7c6b08",
  measurementId: "G-R53KE646L5"
};
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);
navigator.serviceWorker.ready.then(async (reg) => {
  try {
    const token = await getToken(messaging, {
      vapidKey: "BAGy-aXv1nzMOMdtlBa_F29-tQ2_uvkG1VheAg4FyMF6C6WQBqQbrUXlehDO7htLuPQ980I-uuYF5Cz33i2zVME",
      serviceWorkerRegistration: reg
    });
    if(token){
      localStorage.setItem('mff_fcm_token', token);
      console.log("MFF Token ready for broadcast");
      // Save token so you can broadcast to all
      await fetch("https://mansonry-family-fraternity-default-rtdb.europe-west1.firebasedatabase.app/tokens.json", {
        method: "POST",
        body: JSON.stringify({ token, created: Date.now() })
      });
    }
  } catch(e){ console.log("FCM failed", e); }
});
onMessage(messaging, (payload) => {
  if (Notification.permission === 'granted') {
    new Notification(payload.notification.title, { body: payload.notification.body, icon: '/MANSONRY-FAMILY-FRATERNITY-/icon-512.png' });
  }
  if ('setAppBadge' in navigator) navigator.setAppBadge(1).catch(()=>{});
  new Audio('/MANSONRY-FAMILY-FRATERNITY-/notification.mp3').play().catch(()=>{});
});
