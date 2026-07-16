// firebase-messaging-sw.js

importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
    apiKey: "AIzaSyBSs3ekiR8vQ_1Ar5oZVBKGju",
    authDomain: "mansonry-family-fraternity.firebaseapp.com",
    databaseURL: "https://mansonry-family-fraternity-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "mansonry-family-fraternity",
    storageBucket: "mansonry-family-fraternity.firebasestorage.app",
    messagingSenderId: "964415179161",
    appId: "1:964415179161:web:c8fd1a777542932d7c6b08"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log("Background message:", payload);

    const notificationTitle =
        payload.notification?.title || "Free Masonry Heritage";

    const notificationOptions = {
        body: payload.notification?.body || "You have a new notification.",
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png"
    };

    self.registration.showNotification(
        notificationTitle,
        notificationOptions
    );
});
