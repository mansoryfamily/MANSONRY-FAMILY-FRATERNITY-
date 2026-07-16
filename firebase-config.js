// Firebase Configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import { getMessaging } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js";

const firebaseConfig = {
    apiKey: "AIzaSyBSs3ekiR8vQ_1Ar5oZVBKGju",
    authDomain: "mansonry-family-fraternity.firebaseapp.com",
    databaseURL: "https://mansonry-family-fraternity-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "mansonry-family-fraternity",
    storageBucket: "mansonry-family-fraternity.firebasestorage.app",
    messagingSenderId: "964415179161",
    appId: "1:964415179161:web:c8fd1a777542932d7c6b08",
    measurementId: "G-Q8LC74ZFXN"
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const messaging = getMessaging(app);

// Replace with your Firebase Web Push VAPID key
export const vapidKey = "YOUR_PUBLIC_VAPID_KEY_HERE";
