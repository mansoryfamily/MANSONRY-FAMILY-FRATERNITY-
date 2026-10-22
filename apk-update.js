(function () {
  var VERSION = "1.0.3";
  var APK_URL = "https://freemasonry-family.web.app/download";
  var DISMISS_KEY = "mff_apk_update_dismissed_" + VERSION;
  var POPUP_ID = "mffApkUpdatePrompt";
  var isAndroid = /Android/i.test(navigator.userAgent);
  var isInstalled = false;
  var isStandalone = false;
  var dismissed = false;

  try {
    isInstalled = localStorage.getItem("mff_installed") === "true";
    dismissed = Date.now() - Number(localStorage.getItem(DISMISS_KEY) || 0) < 7 * 24 * 60 * 60 * 1000;
  } catch (error) {}

  isInstalled = isInstalled || !!window.MffNative || !!window.__MFF_NATIVE_APP__;
  try {
    isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  } catch (error) {}

  if (!isAndroid || isInstalled || isStandalone || dismissed) return;
  if (document.getElementById("installPopup") || document.getElementById(POPUP_ID)) return;

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch (error) {}
    var popup = document.getElementById(POPUP_ID);
    if (!popup) return;
    popup.classList.remove("show");
    setTimeout(function () {
      if (popup.parentNode) popup.parentNode.removeChild(popup);
    }, 260);
  }

  function show() {
    if (document.getElementById(POPUP_ID) || document.getElementById("installPopup")) return;

    var style = document.createElement("style");
    style.textContent =
      "#mffApkUpdatePrompt{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(3,8,18,.78);backdrop-filter:blur(8px);opacity:0;pointer-events:none;transition:opacity .25s ease;font-family:system-ui,-apple-system,'Segoe UI',sans-serif}" +
      "#mffApkUpdatePrompt.show{opacity:1;pointer-events:auto}" +
      "#mffApkUpdatePrompt .mff-apk-card{width:100%;max-width:360px;padding:26px 22px;border:2px solid #d4af37;border-radius:20px;background:linear-gradient(160deg,#121d33,#080e1f);box-shadow:0 24px 80px rgba(0,0,0,.65),0 0 35px rgba(212,175,55,.18);text-align:center;color:#fff;transform:translateY(12px) scale(.98);transition:transform .25s ease}" +
      "#mffApkUpdatePrompt.show .mff-apk-card{transform:translateY(0) scale(1)}" +
      "#mffApkUpdatePrompt img{width:68px;height:68px;border-radius:16px;border:2px solid #d4af37;object-fit:cover;margin-bottom:14px}" +
      "#mffApkUpdatePrompt h3{margin:0 0 6px;color:#f0d185;font-size:19px;line-height:1.25}" +
      "#mffApkUpdatePrompt p{margin:0 0 18px;color:#c8d2e0;font-size:13px;line-height:1.55}" +
      "#mffApkUpdatePrompt small{display:block;margin-top:10px;color:#8795aa;font-size:11px;line-height:1.45}" +
      "#mffApkUpdatePrompt .mff-apk-actions{display:flex;gap:10px}" +
      "#mffApkUpdatePrompt button{flex:1;border:0;border-radius:999px;padding:13px 12px;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit}" +
      "#mffApkUpdatePrompt .mff-apk-download{background:linear-gradient(135deg,#f0d185,#d4af37);color:#111}" +
      "#mffApkUpdatePrompt .mff-apk-later{background:transparent;border:1px solid #3b4a63;color:#c8d2e0}";
    document.head.appendChild(style);

    var popup = document.createElement("div");
    popup.id = POPUP_ID;
    popup.innerHTML =
      '<div class="mff-apk-card">' +
        '<img src="./icon-192.png" alt="Masonry Family">' +
        '<h3>Masonry Family ' + VERSION + " update</h3>" +
        "<p>Download the latest Android APK and install it over the old app. Your chats and account stay the same.</p>" +
        '<div class="mff-apk-actions">' +
          '<button type="button" class="mff-apk-download">Download update</button>' +
          '<button type="button" class="mff-apk-later">Later</button>' +
        "</div>" +
        "<small>If the download does not start, open this page in Chrome.</small>" +
      "</div>";
    document.body.appendChild(popup);

    popup.querySelector(".mff-apk-download").addEventListener("click", function () {
      dismiss();
      window.location.href = APK_URL;
    });
    popup.querySelector(".mff-apk-later").addEventListener("click", dismiss);

    setTimeout(function () {
      popup.classList.add("show");
    }, 40);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(show, 1800);
    }, { once: true });
  } else {
    setTimeout(show, 1800);
  }
})();
