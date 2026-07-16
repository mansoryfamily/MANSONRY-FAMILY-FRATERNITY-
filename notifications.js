import { messaging, db, vapidKey } from "./firebase-config.js";

import {
    getToken,
    onMessage
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js";

import {
    ref,
    set
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// Register Service Worker
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/firebase-messaging-sw.js")
        .then(async (registration) => {

            console.log("Service Worker registered.");

            const permission = await Notification.requestPermission();

            if (permission === "granted") {

                const token = await getToken(messaging, {
                    vapidKey: vapidKey,
                    serviceWorkerRegistration: registration
                });

                if (token) {

                    console.log("FCM Token:", token);

                    localStorage.setItem("fcmToken", token);

                    await set(ref(db, "notificationTokens/" + token.replace(/[.#$\[\]]/g, "_")), {
                        token: token,
                        created: Date.now()
                    });

                } else {
                    console.log("No registration token.");
                }

            } else {
                console.log("Notification permission denied.");
            }

        })
        .catch(err => console.error(err));
}

// Foreground notifications
onMessage(messaging, (payload) => {

    console.log("Foreground notification:", payload);

    if (payload.notification) {
        alert(
            payload.notification.title +
            "\n\n" +
            payload.notification.body
        );
    }

});
