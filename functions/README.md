# Background chat notifications

The `pushOnNewMessage` Realtime Database trigger sends FCM web pushes for either direction of the admin/member chat. It targets every token stored at `users/{recipientUid}/fcmTokens/{tokenKey}`, removes stale tokens returned by FCM, and writes an in-app notification record. The browser code registers tokens only after a signed-in user explicitly enables notifications; the shared root `sw.js` displays background pushes and opens the addressed chat.

## Before deploying

1. In Firebase Console, confirm Cloud Messaging is enabled and the Web Push certificate public key corresponds to the VAPID public key in `firebase-init.js`.
2. Merge the following path into the existing Realtime Database rules. Do not replace the project's current rules with this fragment; preserve existing access for chats, applications, and other data.

```json
"users": {
  "$uid": {
    "fcmTokens": {
      ".read": "auth != null && auth.uid === $uid",
      ".write": "auth != null && auth.uid === $uid"
    }
  }
}
```

3. Add/verify chat rules that allow a member to read/write only `/chats/{adminUid}_{theirUid}` and allow the admin UID to access only conversations with that admin UID. Also enforce member identity on `senderId`; the UI filtering is not a privacy boundary. No database rules file is included in this repository, so chat privacy cannot be confirmed until the active Firebase rules are reviewed.
4. Open this repository in a trusted environment with Firebase CLI authenticated to the correct project. Review the target project before deployment.

## Deploy

From the repository root, install the function dependencies, select the intended Firebase project, and deploy only the message trigger:

```sh
cd functions
npm ci
cd ..
firebase use <firebase-project-id>
firebase deploy --only functions:pushOnNewMessage
```

Firebase may require the project to be on the Blaze billing plan for Cloud Functions deployment. This deploy command does not deploy Hosting or change the app's Hosting release.

## Device verification

Use two supported devices or browsers with separate signed-in accounts. On each, open Dashboard, Admin Panel, or Global Chat and choose **Enable notifications**; grant permission. Send a text and a media message from one account to the other while the recipient app is closed and again while it is open. Verify one notification per new message, correct sender preview, and that tapping opens that conversation. Repeat in the opposite direction. A browser without permission, a removed/uninstalled PWA, operating-system notification suppression, or a device without network cannot receive a web push. Delivery is best-effort through the browser/OS push service and is not guaranteed to match Telegram's managed service.
