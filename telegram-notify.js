import { PUSH_NOTIFY_URL, TELEGRAM_NOTIFY_URL } from "./telegram-config.js";

async function postWorker(endpoint, idToken, payload) {
  if (!endpoint || !idToken) return false;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + idToken
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
      keepalive: true
    });
    return response.ok;
  } catch (error) {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function sendTelegramUpdate(idToken, payload) {
  return postWorker(TELEGRAM_NOTIFY_URL, idToken, payload);
}

export async function sendPushUpdate(idToken, payload) {
  return postWorker(PUSH_NOTIFY_URL, idToken, payload);
}
