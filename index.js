const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.sendAnnouncement = functions.region("europe-west1").https.onCall(async (data, context) => {
  const { title, body, tokens } = data;
  
  if (!tokens || tokens.length === 0) {
    return { success: false, message: "No tokens" };
  }

  const message = {
    notification: { title: title, body: body },
    data: { url: "dashboard.html" }, // CLICK ACTION
    tokens: tokens,
    webpush: {
      notification: {
        icon: "icon-512.png",
        badge: "icon-192.png",
        vibrate: [200, 100, 200]
      }
    }
  };

  const response = await admin.messaging().sendEachForMulticast(message);
  return { success: true, sent: response.successCount };
});
