const admin = require("firebase-admin");
const functions = require("firebase-functions/v1");

admin.initializeApp();

const SITE_BASE_URL = "https://mansoryfamily.github.io/MANSONRY-FAMILY-FRATERNITY-";
const ADMIN_UID = "DMeM2UuLgDOusNvmzRGZygBdxOG2";

function messagePreview(message) {
  if (message.text) return message.text.slice(0, 140);
  if (message.mediaType === "video") return "Sent you a video";
  if (message.mediaUrl) return "Sent you a photo";
  return "You have a new message";
}

function tokenRecords(snapshot) {
  const records = [];
  const seen = new Set();
  snapshot.forEach(child => {
    const value = child.val();
    const token = typeof value === "string" ? value : value?.token;
    if (token && !seen.has(token)) {
      seen.add(token);
      records.push({ key: child.key, token });
    }
  });
  return records;
}

exports.pushOnNewMessage = functions.database
  .ref("/chats/{chatId}/messages/{messageId}")
  .onCreate(async (snapshot, context) => {
    const message = snapshot.val();
    const chatId = context.params.chatId;
    const chatPrefix = `${ADMIN_UID}_`;
    if (!message?.senderId || !chatId.startsWith(chatPrefix)) return null;
    const memberUid = chatId.slice(chatPrefix.length);
    if (!memberUid || memberUid === ADMIN_UID) return null;

    let recipientUid;
    if (message.senderId === ADMIN_UID) recipientUid = memberUid;
    else if (message.senderId === memberUid) recipientUid = ADMIN_UID;
    else return null;

    const database = admin.database();
    const recipientRef = database.ref(`users/${recipientUid}`);
    const [recipientSnapshot, senderSnapshot] = await Promise.all([
      recipientRef.child("fcmTokens").once("value"),
      database.ref(`users/${message.senderId}`).once("value")
    ]);
    const devices = tokenRecords(recipientSnapshot);
    if (devices.length === 0) return null;

    const sender = senderSnapshot.val() || {};
    const senderName = sender.fullName || sender.name || message.senderEmail || "A member";
    const url = `${SITE_BASE_URL}/globaladmin.html?chatId=${encodeURIComponent(chatId)}`;
    const title = `Message from ${senderName}`;
    const body = messagePreview(message);
    const data = {
      type: "chat",
      title,
      body,
      chatId,
      messageId: context.params.messageId,
      senderId: message.senderId,
      url
    };

    const staleKeys = [];
    for (let offset = 0; offset < devices.length; offset += 500) {
      const batch = devices.slice(offset, offset + 500);
      const result = await admin.messaging().sendEachForMulticast({
        tokens: batch.map(device => device.token),
        notification: { title, body },
        data,
        android: {
          priority: "high",
          notification: {
            channelId: "mff_chat",
            sound: "default",
            color: "#D4AF37",
            icon: "ic_stat_mff",
            tag: chatId,
            clickAction: "org.freemasony.heritage.ke.OPEN_CHAT"
          }
        },
        webpush: {
          headers: { Urgency: "high", TTL: "2419200" },
          notification: {
            icon: `${SITE_BASE_URL}/icon-512.png`,
            badge: `${SITE_BASE_URL}/icon-192.png`,
            requireInteraction: true,
            tag: chatId
          }
        }
      });

      result.responses.forEach((response, index) => {
        const code = response.error?.code;
        if (code === "messaging/registration-token-not-registered" || code === "messaging/invalid-registration-token") {
          staleKeys.push(batch[index].key);
        }
      });
    }

    if (staleKeys.length) {
      const removals = {};
      staleKeys.forEach(key => { removals[`users/${recipientUid}/fcmTokens/${key}`] = null; });
      await database.ref().update(removals);
    }

    await database.ref(`notifications/${recipientUid}`).push({
      title,
      message: body,
      type: "chat",
      chatId,
      read: false,
      timestamp: Date.now(),
      senderId: message.senderId
    });

    return null;
  });
