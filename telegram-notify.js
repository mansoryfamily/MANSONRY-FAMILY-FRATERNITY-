import { TELEGRAM_NOTIFY_URL } from "./telegram-config.js";

export async function sendTelegramUpdate(idToken, payload) {
  if (!TELEGRAM_NOTIFY_URL || !idToken) return false;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(TELEGRAM_NOTIFY_URL, {
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
