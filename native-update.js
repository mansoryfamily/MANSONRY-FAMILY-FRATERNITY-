(function () {
  "use strict";

  var DOWNLOAD_URL = "https://freemasonry-family.web.app/download";
  var FALLBACK_VERSION = "1.0.7";
  var BANNER_ID = "mffNativeUpdate";
  var SNOOZE_KEY = "mff_native_update_later";
  var SNOOZE_MS = 6 * 60 * 60 * 1000;

  // The native shell appends "MFFAndroid/<version>" to the WebView user agent.
  // This lets the hosted site prompt users on old APKs, including 1.0.4 which
  // hides the normal install/update popups.
  var match = navigator.userAgent.match(/MFFAndroid\/([\d.]+)/i);
  if (!match) return;
  var current = match[1];

  // Version 1.0.7 was republished without the spoken narrator and with the
  // closed-app notification fix. The version name did not change, so old
  // installs are recognised by the missing/older MFFBuild token instead.
  var MIN_BUILD = 2;
  var buildMatch = navigator.userAgent.match(/MFFBuild\/(\d+)/i);
  var currentBuild = buildMatch ? parseInt(buildMatch[1], 10) || 0 : 0;

  function parts(value) {
    return String(value || "").split(".").map(function (n) {
      return parseInt(n, 10) || 0;
    });
  }

  function isOlder(currentVersion, latestVersion) {
    var a = parts(currentVersion);
    var b = parts(latestVersion);
    var len = Math.max(a.length, b.length);
    for (var i = 0; i < len; i++) {
      var x = a[i] || 0;
      var y = b[i] || 0;
      if (x < y) return true;
      if (x > y) return false;
    }
    return false;
  }

  function show(latest, notes) {
    if (document.getElementById(BANNER_ID)) return;

    var wrap = document.createElement("div");
    wrap.id = BANNER_ID;
    wrap.setAttribute("role", "dialog");
    wrap.style.cssText =
      "position:fixed;inset:0;z-index:2147483647;display:flex;align-items:flex-end;" +
      "justify-content:center;padding:16px;background:rgba(3,8,18,.72);" +
      "backdrop-filter:blur(6px);font-family:system-ui,-apple-system,'Segoe UI',sans-serif;";

    wrap.innerHTML =
      '<div style="width:100%;max-width:420px;background:linear-gradient(160deg,#121d33,#080e1f);' +
      "border:2px solid #d4af37;border-radius:20px;padding:22px;color:#fff;" +
      'box-shadow:0 24px 80px rgba(0,0,0,.65);">' +
        '<div style="display:flex;gap:12px;align-items:center;margin-bottom:12px;">' +
          '<img src="./icon-192.png" alt="" style="width:52px;height:52px;border-radius:14px;' +
          "border:2px solid #d4af37;object-fit:cover;\" onerror=\"this.style.display='none'\">" +
          '<div><div style="color:#f0d185;font-weight:800;font-size:17px;">Update available</div>' +
          '<div style="color:#9fb0c5;font-size:12px;">' +
          (isOlder(current, latest)
            ? "Version " + current + " &rarr; " + latest
            : "Updated " + latest + " build &mdash; reinstall required") +
          "</div></div>" +
        "</div>" +
        '<p style="margin:0 0 16px;color:#c8d2e0;font-size:13px;line-height:1.55;">' +
        (notes || "A newer version of Masonry Family is ready. Update now to keep chats and notifications working.") +
        "</p>" +
        '<button id="mffNativeUpdateGo" style="width:100%;border:0;border-radius:999px;padding:14px;' +
        'background:linear-gradient(135deg,#f0d185,#d4af37);color:#111;font-weight:800;font-size:14px;">' +
        "Update now</button>" +
        '<button id="mffNativeUpdateLater" style="width:100%;margin-top:8px;border:1px solid #3b4a63;' +
        'border-radius:999px;padding:12px;background:transparent;color:#c8d2e0;font-weight:600;font-size:13px;">' +
        "Later</button>" +
      "</div>";

    document.body.appendChild(wrap);

    document.getElementById("mffNativeUpdateGo").onclick = function () {
      try {
        localStorage.removeItem(SNOOZE_KEY);
      } catch (error) {}
      window.location.href = DOWNLOAD_URL;
    };
    document.getElementById("mffNativeUpdateLater").onclick = function () {
      try {
        localStorage.setItem(SNOOZE_KEY, String(Date.now()));
      } catch (error) {}
      wrap.remove();
    };
  }

  function snoozed() {
    try {
      return Date.now() - Number(localStorage.getItem(SNOOZE_KEY) || 0) < SNOOZE_MS;
    } catch (error) {
      return false;
    }
  }

  function boot() {
    var latest = FALLBACK_VERSION;
    var notes = "";

    function finish() {
      var outdated = isOlder(current, latest) || currentBuild < MIN_BUILD;
      if (outdated && !snoozed()) show(latest, notes);
    }

    try {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", "./version.json?t=" + Date.now(), true);
      xhr.timeout = 4000;
      xhr.onload = function () {
        try {
          var data = JSON.parse(xhr.responseText);
          if (data && data.versionName) latest = String(data.versionName);
          if (data && data.notes) notes = String(data.notes);
        } catch (error) {}
        finish();
      };
      xhr.onerror = xhr.ontimeout = finish;
      xhr.send();
    } catch (error) {
      finish();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
