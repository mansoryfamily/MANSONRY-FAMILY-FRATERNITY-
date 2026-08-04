const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

// REGION MUST MATCH: europe-west1
exports.sendAnnouncement = functions.region("europe-west1").https.onCall(async (data, context) => {
  // 1. AUTH CHECK
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "You must be logged in");
  }

  const db = admin.database();
  const adminSnap = await db.ref(`users/${context.auth.uid}`).once("value");
  if (adminSnap.val()?.role !== "admin") {
    throw new functions.https.HttpsError("permission-denied", "Only admins can send");
  }

  // 2. GET DATA FROM YOUR HTML
  const { recipient, title, message } = data;
  
  if (!title || !message) {
    throw new functions.https.HttpsError("invalid-argument", "Title and message required");
  }

  const timestamp = Date.now();
  const annData = {
    title: title, 
    message: message, 
    timestamp: timestamp, 
    sentBy: context.auth.uid, 
    sentByEmail: context.auth.token.email
  };

  try {
    // 3. UPDATE MAIN ANNOUNCEMENT BOARD
    await db.ref("announcements").set(annData);

    // 4. PUSH TO ALL USERS NOTIFICATIONS
    if (recipient === "all") {
      const usersSnap = await db.ref("users").once("value");
      const updates = {};
      usersSnap.forEach(child => {
        const uid = child.key;
        const key = db.ref(`notifications/${uid}`).push().key;
        updates[`notifications/${uid}/${key}`] = annData;
      });
      await db.ref().update(updates);
    } else {
      // SEND TO 1 PERSON
      const key = db.ref(`notifications/${recipient}`).push().key;
      await db.ref(`notifications/${recipient}/${key}`).set(annData);
    }

    return { success: true, message: "Announcement sent" };
  } catch (error) {
    console.error("Error sending announcement:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});
