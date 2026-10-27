import { createRemoteJWKSet, jwtVerify } from "jose";

const JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);

const ALLOWED_ORIGINS = new Set([
  "https://freemasonry-family.web.app",
  "https://freemasonry-family.firebaseapp.com",
  "https://mansonry-family-fraternity.web.app",
  "https://mansonry-family-fraternity.firebaseapp.com",
  "https://mansonryfamily.github.io",
  "http://localhost:5000",
  "http://127.0.0.1:5000"
]);

const uidPattern = /^[A-Za-z0-9_-]{6,128}$/;
const messageIdPattern = /^[A-Za-z0-9_-]{1,128}$/;
const chatIdPattern = /^-?\d+$/;

function allowedOrigin(origin) {
  return !origin || ALLOWED_ORIGINS.has(origin);
}

function corsHeaders(origin) {
  const headers = {
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

function json(origin, body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...corsHeaders(origin)
    }
  });
}

function clean(value, maxLength) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function adminChatIds(env) {
  const value = env.TELEGRAM_ADMIN_CHAT_IDS || env.TELEGRAM_ADMIN_CHAT_ID || "";
  return value
    .split(",")
    .map(item => item.trim())
    .filter(item => chatIdPattern.test(item));
}

function oneSignalConfigured(env) {
  return Boolean(env.ONESIGNAL_APP_ID) && Boolean(env.ONESIGNAL_REST_API_KEY);
}

async function countUsers(env) {
  try {
    const response = await fetch(env.FIREBASE_DB_URL + "/users.json?shallow=true", {
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data && typeof data === "object" ? Object.keys(data).length : 0;
  } catch (error) {
    return null;
  }
}

async function deterministicUuid(name) {
  const namespace = new Uint8Array([
    0x6b, 0xa7, 0xb8, 0x10, 0x9d, 0xad, 0x11, 0xd1,
    0x80, 0xb4, 0x00, 0xc0, 0x4f, 0xd4, 0x30, 0xc8
  ]);
  const nameBytes = new TextEncoder().encode(name);
  const input = new Uint8Array(namespace.length + nameBytes.length);
  input.set(namespace);
  input.set(nameBytes, namespace.length);
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-1", input));
  hash[6] = (hash[6] & 0x0f) | 0x50;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  const hex = Array.from(hash.slice(0, 16), byte => byte.toString(16).padStart(2, "0")).join("");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32)
  ].join("-");
}

async function verifyFirebaseToken(token, env) {
  if (!token) throw new Error("Missing token");
  const result = await jwtVerify(token, JWKS, {
    issuer: "https://securetoken.google.com/" + env.FIREBASE_PROJECT_ID,
    audience: env.FIREBASE_PROJECT_ID
  });
  const uid = result.payload.sub;
  if (typeof uid !== "string" || !uidPattern.test(uid)) {
    throw new Error("Invalid subject");
  }
  return { uid, email: clean(result.payload.email, 160) };
}

async function alreadySent(env, key) {
  try {
    const response = await fetch(
      env.FIREBASE_DB_URL + "/telegramSent/" + encodeURIComponent(key) + ".json",
      { signal: AbortSignal.timeout(5000) }
    );
    if (!response.ok) return false;
    const value = await response.json();
    return value === true || value?.sent === true;
  } catch (error) {
    return false;
  }
}

async function markSent(env, key, type) {
  try {
    await fetch(
      env.FIREBASE_DB_URL + "/telegramSent/" + encodeURIComponent(key) + ".json",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sent: true, type, at: Date.now() }),
        signal: AbortSignal.timeout(5000)
      }
    );
  } catch (error) {}
}

async function sendTelegram(env, chatId, text, button) {
  const body = {
    chat_id: chatId,
    text: text.slice(0, 3900),
    disable_web_page_preview: true
  };
  if (button?.url) {
    body.reply_markup = {
      inline_keyboard: [[{ text: button.text || "Open admin", url: button.url }]]
    };
  }
  const response = await fetch(
    "https://api.telegram.org/bot" + env.TELEGRAM_BOT_TOKEN + "/sendMessage",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000)
    }
  );
  if (!response.ok) {
    const detail = await response.text();
    console.error("Telegram send failed", response.status, detail.slice(0, 220));
    return false;
  }
  return true;
}

function buildMessage(env, payload, uid, email) {
  const type = payload.type;
  if (type === "message") {
    const chatId = clean(payload.chatId, 180);
    const messageId = clean(payload.messageId, 128);
    if (!messageIdPattern.test(messageId)) return null;
    if (chatId !== env.ADMIN_UID + "_" + uid) return null;
    const senderName = clean(payload.senderName, 80) || "Member";
    const text = clean(payload.text, 1500) || "New message";
    return {
      key: "msg_" + uid + "_" + messageId,
      type,
      text:
        "New message for admin\n" +
        "From: " + senderName + "\n\n" +
        text,
      button: {
        text: "Open chat",
        url: env.SITE_URL + "/globaladmin.html?chatId=" + encodeURIComponent(chatId)
      }
    };
  }

  if (type === "registration") {
    const name = clean(payload.name, 120) || "Member";
    const phone = clean(payload.phone, 40) || "Not provided";
    const country = clean(payload.country, 80) || "Not provided";
    return {
      key: "reg_" + uid,
      type,
      text:
        "New member registered\n" +
        "Name: " + name + "\n" +
        "Email: " + (email || "Not provided") + "\n" +
        "Phone: " + phone + "\n" +
        "Country: " + country,
      button: {
        text: "Open admin",
        url: env.SITE_URL + "/globaladmin.html"
      }
    };
  }

  if (type === "application") {
    const name = clean(payload.name, 120) || "Member";
    const phone = clean(payload.phone, 40) || "Not provided";
    const country = clean(payload.country, 80) || "Not provided";
    const lodge = clean(payload.lodge, 120) || "Not provided";
    return {
      key: "app_" + uid,
      type,
      text:
        "New membership application\n" +
        "Name: " + name + "\n" +
        "Email: " + (email || "Not provided") + "\n" +
        "Phone: " + phone + "\n" +
        "Country: " + country + "\n" +
        "Nearest lodge: " + lodge,
      button: {
        text: "Review application",
        url: env.SITE_URL + "/application.html"
      }
    };
  }

  return null;
}

function chatMemberUid(env, chatId) {
  if (!chatId.startsWith(env.ADMIN_UID + "_")) return null;
  const memberUid = chatId.slice(env.ADMIN_UID.length + 1);
  return uidPattern.test(memberUid) ? memberUid : null;
}

function buildPushMessage(env, payload, senderUid) {
  if (payload.type !== "chat") return null;
  const chatId = clean(payload.chatId, 180);
  const messageId = clean(payload.messageId, 128);
  if (!messageIdPattern.test(messageId)) return null;

  const memberUid = chatMemberUid(env, chatId);
  if (!memberUid) return null;

  // Push works in both directions: admin -> member and member -> admin.
  let recipientUid;
  let title;
  if (senderUid === env.ADMIN_UID) {
    recipientUid = memberUid;
    title = "MFF Administration";
  } else if (senderUid === memberUid) {
    recipientUid = env.ADMIN_UID;
    title = clean(payload.senderName, 80) || "Member";
  } else {
    return null;
  }
  if (recipientUid === senderUid) return null;

  const text = clean(payload.text, 500) || "New message";
  return {
    key: "push_msg_" + recipientUid + "_" + messageId,
    recipientUid,
    title,
    body: text,
    data: {
      type: "chat",
      chatId,
      messageId,
      senderId: senderUid,
      url: env.SITE_URL + "/globaladmin.html?chatId=" + encodeURIComponent(chatId)
    }
  };
}

// OneSignal subscriptions registered by the Android app / PWA.
// Targeting these IDs directly is far more reliable than external_id alone,
// because external_id is only present after the user signs in.
async function oneSignalSubscriptions(env, uid) {
  const ids = new Set();
  const base = env.FIREBASE_DB_URL;
  const read = async (path) => {
    try {
      const response = await fetch(base + path, { signal: AbortSignal.timeout(5000) });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      return null;
    }
  };

  const [players, single] = await Promise.all([
    read("/playerIds/" + encodeURIComponent(uid) + ".json?shallow=true"),
    read("/users/" + encodeURIComponent(uid) + "/oneSignalId.json")
  ]);

  if (players && typeof players === "object") {
    Object.keys(players).forEach(id => {
      if (id) ids.add(id);
    });
  }
  if (typeof single === "string" && single.trim()) ids.add(single.trim());

  return [...ids];
}

async function sendOneSignal(env, message) {
  if (!oneSignalConfigured(env)) {
    return { ok: false, error: "Push not configured" };
  }

  const subscriptions = await oneSignalSubscriptions(env, message.recipientUid);
  const body = {
    app_id: env.ONESIGNAL_APP_ID,
    target_channel: "push",
    headings: { en: message.title },
    contents: { en: message.body },
    data: message.data,
    small_icon: "ic_stat_mff",
    priority: 10,
    idempotency_key: await deterministicUuid(message.key)
  };

  // Prefer real subscription IDs when we have them; fall back to the
  // external_id (Firebase uid) that OneSignal.login() sets on the app.
  if (subscriptions.length) {
    body.include_subscription_ids = subscriptions;
  } else {
    body.include_aliases = { external_id: [message.recipientUid] };
  }

  const response = await fetch("https://api.onesignal.com/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: "Key " + env.ONESIGNAL_REST_API_KEY
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000)
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("OneSignal send failed", response.status, detail.slice(0, 220));
    return { ok: false, error: "Push delivery failed" };
  }

  const result = await response.json().catch(() => ({}));
  return {
    ok: true,
    delivered: Boolean(result.id),
    recipients: result.recipients === undefined ? null : Number(result.recipients),
    id: result.id || null
  };
}

async function clearQueuedEvent(env, recipientUid, eventId) {
  try {
    await fetch(
      env.FIREBASE_DB_URL +
        "/userEvents/" + encodeURIComponent(recipientUid) +
        "/" + encodeURIComponent(eventId) + ".json",
      { method: "DELETE", signal: AbortSignal.timeout(5000) }
    );
  } catch (error) {}
}

async function handlePush(request, env, origin) {
  if (!oneSignalConfigured(env)) {
    return json(origin, { ok: false, error: "Push not configured" }, 503);
  }

  const auth = request.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) {
    return json(origin, { ok: false, error: "Unauthorized" }, 401);
  }

  let user;
  try {
    user = await verifyFirebaseToken(auth.slice(7).trim(), env);
  } catch (error) {
    return json(origin, { ok: false, error: "Unauthorized" }, 401);
  }

  let payload;
  try {
    payload = await request.json();
  } catch (error) {
    return json(origin, { ok: false, error: "Invalid JSON" }, 400);
  }

  const message = buildPushMessage(env, payload || {}, user.uid);
  if (!message) {
    return json(origin, { ok: false, error: "Invalid payload" }, 400);
  }

  const result = await sendOneSignal(env, message);
  if (!result.ok) {
    return json(origin, { ok: false, error: result.error }, 502);
  }

  await clearQueuedEvent(env, message.recipientUid, clean(payload.messageId, 128));
  return json(origin, {
    ok: true,
    delivered: Boolean(result.delivered),
    recipients: result.recipients,
    id: result.id || null
  });
}

// Fallback for projects without Cloud Functions (Spark plan):
// drain the userEvents queue every minute and push it through OneSignal.
async function pushQueuedEvents(env) {
  if (!oneSignalConfigured(env)) {
    return { ok: false, error: "Push not configured" };
  }

  let queue;
  try {
    const response = await fetch(env.FIREBASE_DB_URL + "/userEvents.json", {
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) return { ok: false, error: "Queue read failed" };
    queue = await response.json();
  } catch (error) {
    return { ok: false, error: "Queue read failed" };
  }

  if (!queue || typeof queue !== "object") {
    return { ok: true, scanned: 0, sent: 0 };
  }

  const now = Date.now();
  const jobs = [];
  for (const [recipientUid, events] of Object.entries(queue)) {
    if (!uidPattern.test(recipientUid) || !events || typeof events !== "object") continue;
    for (const [eventId, event] of Object.entries(events)) {
      if (!event || event.type !== "chat" || event.pushedAt) continue;
      if (!messageIdPattern.test(eventId)) continue;
      // Give an open app a moment to render it in-app first.
      if (!event.time || now - Number(event.time) < 2000) continue;
      jobs.push({ recipientUid, eventId, event });
    }
  }

  jobs.sort((a, b) => Number(a.event.time || 0) - Number(b.event.time || 0));

  let sent = 0;
  let expired = 0;
  for (const job of jobs.slice(0, 50)) {
    const age = now - Number(job.event.time || 0);
    if (age > 24 * 60 * 60 * 1000) {
      await clearQueuedEvent(env, job.recipientUid, job.eventId);
      expired += 1;
      continue;
    }

    const chatId = clean(job.event.chatId, 180);
    const message = {
      key: "push_msg_" + job.recipientUid + "_" + job.eventId,
      recipientUid: job.recipientUid,
      title: clean(job.event.title, 80) || "MFF Lodge",
      body: clean(job.event.body, 500) || "New message",
      data: {
        type: "chat",
        chatId,
        messageId: job.eventId,
        senderId: clean(job.event.senderId, 128),
        url: env.SITE_URL + "/globaladmin.html?chatId=" + encodeURIComponent(chatId)
      }
    };

    const result = await sendOneSignal(env, message);
    if (!result.ok) continue;
    sent += 1;
    // Keep the event when OneSignal reached zero devices (for example the
    // member has not installed the updated app yet) so it retries next minute.
    if (result.recipients === 0) continue;
    await clearQueuedEvent(env, job.recipientUid, job.eventId);
  }

  return { ok: true, scanned: jobs.length, sent, expired };
}

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(pushQueuedEvents(env));
  },

  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const configured = Boolean(env.TELEGRAM_BOT_TOKEN) && adminChatIds(env).length > 0;
    const pushConfigured = oneSignalConfigured(env);

    if (!allowedOrigin(origin)) {
      return json(origin, { ok: false, error: "Origin not allowed" }, 403);
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return json(origin, {
        ok: true,
        configured,
        admins: adminChatIds(env).length,
        push: pushConfigured
      });
    }

    if (request.method === "POST" && url.pathname === "/push") {
      return handlePush(request, env, origin);
    }

    if (request.method !== "POST" || url.pathname !== "/notify") {
      return json(origin, { ok: false, error: "Not found" }, 404);
    }

    if (!configured) {
      return json(origin, { ok: false, error: "Bot not configured" }, 503);
    }

    const auth = request.headers.get("Authorization") || "";
    if (!auth.startsWith("Bearer ")) {
      return json(origin, { ok: false, error: "Unauthorized" }, 401);
    }

    let user;
    try {
      user = await verifyFirebaseToken(auth.slice(7).trim(), env);
    } catch (error) {
      return json(origin, { ok: false, error: "Unauthorized" }, 401);
    }

    let payload;
    try {
      payload = await request.json();
    } catch (error) {
      return json(origin, { ok: false, error: "Invalid JSON" }, 400);
    }

    const message = buildMessage(env, payload || {}, user.uid, user.email);
    if (!message) {
      return json(origin, { ok: false, error: "Invalid payload" }, 400);
    }

    if (await alreadySent(env, message.key)) {
      return json(origin, { ok: true, duplicate: true });
    }

    if (message.type === "registration") {
      const total = await countUsers(env);
      if (total !== null) message.text += "\nTotal members: " + total;
    }

    const admins = adminChatIds(env);
    const results = await Promise.allSettled(
      admins.map(chatId => sendTelegram(env, chatId, message.text, message.button))
    );
    const sent = results.filter(item => item.status === "fulfilled" && item.value).length;

    if (sent === 0) {
      return json(origin, { ok: false, error: "Telegram delivery failed" }, 502);
    }

    await markSent(env, message.key, message.type);
    return json(origin, { ok: true, sent, admins: admins.length });
  }
};
