import { getDatabase, ref, push, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const database = getDatabase();
const auth = getAuth();

const titleInput = document.getElementById('notificationTitle');
const messageInput = document.getElementById('notificationMessage');
const sendBtn = document.getElementById('sendNotificationBtn');

sendBtn.addEventListener('click', async () => {
    const title = titleInput.value.trim();
    const message = messageInput.value.trim();
    const admin = auth.currentUser;

    if(!title || !message){
        alert("Please enter both Title and Message");
        return;
    }

    if(!admin){
        alert("You must be logged in as admin");
        return;
    }

    sendBtn.disabled = true;
    sendBtn.textContent = "Sending...";

    try {
        // Push to Firebase under /announcements
        const announcementRef = ref(database, 'announcements');
        await push(announcementRef, {
            title: title,
            message: message,
            sentBy: admin.uid,
            sentByEmail: admin.email,
            timestamp: serverTimestamp()
        });

        alert("✅ Announcement sent to all members!");
        titleInput.value = "";
        messageInput.value = "";

    } catch (error) {
        alert("Error sending: " + error.message);
        console.error(error);
    } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = "📢 Send to All Members";
    }
});
