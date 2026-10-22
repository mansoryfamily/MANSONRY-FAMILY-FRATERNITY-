import { createRemoteJWKSet, jwtVerify } from "jose";

const JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);

const ALLOWED_ORIGINS = new Set([
  "https://freemasonry-family.web.app",
  "https://mansonry-family-fraternity.web.app",
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const configured = Boolean(env.TELEGRAM_BOT_TOKEN) && adminChatIds(env).length > 0;

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
        admins: adminChatIds(env).length
      });
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
