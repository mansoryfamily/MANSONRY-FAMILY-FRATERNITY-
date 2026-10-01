const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
admin.initializeApp();

const ONESIGNAL_APP_ID = "fd3193e3-77bb-4374-988d-4162b6fb5ab";
const ONESIGNAL_REST_KEY = "YOUR_REST_API_KEY_HERE"; // get from OneSignal Dashboard > Settings > Keys

// Helper to send OneSignal push
async function sendOneSignalPush(playerIds, title, message, data = {}) {
  if (!playerIds || playerIds.length === 0) return;
  try {
    await axios.post("https://onesignal.com/api/v1/notifications", {
      app_id: ONESIGNAL_APP_ID,
      include_player_ids: playerIds,
      headings: { en: title },
      contents: { en: message },
      data: data,
      android_channel_id: "mff-chat", // create in OneSignal for sound
      priority: 10,
    }, {
      headers: { "Authorization": `Basic ${ONESIGNAL_REST_KEY}`, "Content-Type": "application/json" }
    });
    console.log("Push sent to", playerIds);
  } catch (e) {
    console.error("OneSignal error", e.response?.data || e.message);
  }
}

// TRIGGER 1: NEW CHAT MESSAGE - WORKS WHEN APP CLOSED
exports.onNewChatMessage = functions.database
  .ref("/chats/{chatId}/messages/{messageId}")
  .onCreate(async (snapshot, context) => {
    const chatId = context.params.chatId;
    const message = snapshot.val();
    if (!message || !message.senderId) return null;

    const senderId = message.senderId;
    const senderName = message.senderName || "Lodge Director";
    const text = message.text || message.message || "New message";

    // Get chat info to find receiver
    const chatSnap = await admin.database().ref(`/chats/${chatId}`).once("value");
    const chat = chatSnap.val();
    if (!chat) return null;

    // chatId format is: memberUID_ADMINUID  => find other UID
    const uids = chatId.split("_");
    const receiverId = uids.find(uid => uid !== senderId);
    if (!receiverId) return null;

    // Don't send push if receiver is the sender (should not happen)
    if (receiverId === senderId) return null;

    // Get receiver's OneSignal playerId from users node
    const userSnap = await admin.database().ref(`/users/${receiverId}/oneSignalId`).once("value");
    let playerIds = [];
    const oneId = userSnap.val();
    if (oneId) {
      playerIds = Array.isArray(oneId) ? oneId : [oneId];
    } else {
      // fallback: try to get from /playerIds/{uid}
      const pSnap = await admin.database().ref(`/playerIds/${receiverId}`).once("value");
      if (pSnap.exists()) {
        const val = pSnap.val();
        playerIds = Array.isArray(val) ? val : Object.values(val);
      }
    }

    if (playerIds.length === 0) {
      console.log("No playerId for", receiverId);
      return null;
    }

    const title = receiverId === "DMeM2UuLgDOusNvmzRGZygBdxOG2" ? `New message from ${senderName}` : "Lodge Director replied";
    const preview = text.length > 60 ? text.substring(0, 57) + "..." : text;

    // This will show notification even when MFF app is CLOSED like in your screenshot
    await sendOneSignalPush(playerIds, title, preview, {
      type: "chat",
      chatId: chatId,
      url: "./globaladmin.html"
    });

    // Also create notification entry for in-app badge (your help.html ghost fix will count it)
    await admin.database().ref(`/notifications/${receiverId}`).push({
      title: title,
      message: preview,
      type: "chat",
      chatId: chatId,
      read: false,
      timestamp: Date.now(),
      senderId: senderId
    });

    return null;
  });

// TRIGGER 2: NEW ANNOUNCEMENT - optional
exports.onNewAnnouncement = functions.database
  .ref("/announcements/{annId}")
  .onCreate(async (snapshot) => {
    const ann = snapshot.val();
    if (!ann) return null;
    // Send to all users
    try {
      await axios.post("https://onesignal.com/api/v1/notifications", {
        app_id: ONESIGNAL_APP_ID,
        included_segments: ["All"],
        headings: { en: "New Lodge Announcement" },
        contents: { en: ann.title || "New announcement from Lodge" },
        data: { type: "announcement", url: "./dashboard.html" }
      }, {
        headers: { "Authorization": `Basic ${ONESIGNAL_REST_KEY}` }
      });
    } catch (e) { console.error(e); }
    return null;
  });
