# Background chat notifications

`pushOnNewMessage` is a Realtime Database trigger that sends an Android FCM notification when either side of the admin/member chat sends a message. It targets every token stored at `users/{recipientUid}/fcmTokens/{tokenKey}`, removes tokens FCM reports as invalid, and writes an in-app notification record.

The Android app registers the token after login and deletes its old binding on logout. The notification payload includes `chatId` so tapping it opens `globaladmin.html?chatId=...`.

## Before deploying

1. Enable the Blaze billing plan for the Firebase project. Cloud Functions deployment is not available on Spark.
2. Confirm Cloud Messaging is enabled for the project.
3. Review the active Realtime Database rules. The app currently writes the token to `users/{uid}/fcmTokens/{tokenKey}` without Firebase Authentication, which only works while the database rules allow that write. Tightening the rules requires passing the Firebase ID token from the WebView to the native shell.
4. Review the chat rules separately. Allow a member to read/write only `/chats/{adminUid}_{theirUid}` and enforce `senderId` server-side. UI filtering is not a privacy boundary.

## Deploy

Authenticate on the machine that will deploy, select the project, install dependencies, and deploy only the message trigger:

```sh
npx firebase-tools login
cd functions
npm ci
cd ..
npx firebase-tools use mansonry-family-fraternity
npx firebase-tools deploy --only functions:pushOnNewMessage
```

`firebase.json` sets `functions.source` to `functions` and excludes the function source from Hosting uploads. This command does not change the Hosting release.

## Device verification

Install the APK on a device with Google Play services, sign in, and grant notification permission. Send a text and a media message from the other account while the recipient app is in the foreground, background, and fully closed. Verify one notification per new message, the correct sender preview, and that tapping opens that conversation. Force-stopping the app or disabling notifications prevents delivery until Android allows it again.
