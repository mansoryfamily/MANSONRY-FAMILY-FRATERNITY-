const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

// REGION MUST MATCH YOUR DATABASE: europe-west1
exports.sendAnnouncement = functions.region("europe-west1").https.onCall(async (data, context) => {
  const { title, body, tokens } = data;
  
  if (!tokens || tokens.length === 0) {
    return { success: false, message: "No tokens provided" };
  }

  const message = {
    notification: { 
      title: title, 
      body: body 
    },
    data: { 
      url: "dashboard.html" // CLICK OPENS DASHBOARD
    },
    tokens: tokens,
    webpush: {
      headers: { Urgency: "high" },
      notification: {
        icon: "icon-512.png",
        badge: "icon-192.png",
        vibrate: [200, 100, 200]
      }
    }
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log("Successfully sent:", response.successCount, "Failed:", response.failureCount);
    return { success: true, sent: response.successCount, failed: response.failureCount };
  } catch (error) {
    console.error("Error sending message:", error);
    return { success: false, error: error.message };
  }
});
