// Freemasonry Heritage - notifier (sound + popup + badge)
class LodgeNotifier {
  constructor() {
    this.unreadCount=0;
    this.audio=new Audio('./notification.wav'); this.audio.volume=0.7;
    this.ADMIN_EMAIL="mansoryfamilyn@gmail.com";
    this.unlocked=false;
  }

  isInGlobalChat(){
    return window.location.href.includes("globaladmin.html");
  }

  // Mobile browsers only allow audio after a real user gesture. Call this from
  // the first tap/keypress so later notification sounds are allowed.
  unlock(){
    try{
      if(this.unlocked) return;
      this.unlocked=true;
      // Prime the notification sound so later background plays are allowed.
      try{ this.audio.play().then(()=>{ this.audio.pause(); this.audio.currentTime=0; }).catch(()=>{}); }catch(e){}
    }catch(e){}
  }

  async showSystemNotification(title, body){
    // Use Service Worker so Chrome doesn't show the github.io origin.
    try{
      if('serviceWorker' in navigator){
        const reg=await navigator.serviceWorker.ready;
        await reg.showNotification(title, {
          body: body,
          icon: 'masonic-G.png',
          badge: 'masonic-G.png',
          vibrate: [200,100,200],
          requireInteraction: true,
          tag: 'mff-message',
          renotify: true
        });
        return;
      }
    }catch(e){}
    if('Notification' in window && Notification.permission==="granted"){
      try{
        const n=new Notification(title,{body,icon:'masonic-G.png',badge:'masonic-G.png',requireInteraction:true,tag:'mff-message'});
        n.onclick=()=>{ window.focus(); n.close(); };
      }catch(e){}
    }
  }

  async playSound(type="admin_message",message="",opts={}){
    try{ this.audio.currentTime=0; await this.audio.play(); }catch(e){}
    if(navigator.vibrate) navigator.vibrate([200,100,200]);
    const body=String(message||'').trim();
    const fallback = type==="member_message"
      ? "New message from a member."
      : type==="announcement"
        ? "New announcement from Administration."
        : "New message from Administration.";
    setTimeout(()=>{
      this.showSystemNotification(type==="announcement"?"MFF Announcement":"MFF Lodge",body||fallback).catch(()=>{});
    },250);
  }

  async setAppIconBadge(count){
    this.unreadCount=count;
    localStorage.setItem("globalChatBadge_count",count);
    localStorage.setItem("notifCount_count",count);
    const chatBadge=document.getElementById("globalChatBadge");
    const notifBadge=document.getElementById("notifBadge");
    const notifCount=document.getElementById("notifCount");
    if(chatBadge){ chatBadge.textContent=count>99?"99+":count; chatBadge.style.display=count>0?"grid":"none"; }
    if(notifBadge){ notifBadge.textContent=count>99?"99+":count; notifBadge.style.display=count>0?"grid":"none"; }
    if(notifCount){ notifCount.textContent=count>99?"99+":count; notifCount.style.display=count>0?"grid":"none"; }
    if('setAppBadge' in navigator){ try{ if(count>0) await navigator.setAppBadge(count); else await navigator.clearAppBadge(); }catch(e){} }
    document.title=count>0?`(${count}) Freemasonry Heritage`:"Freemasonry Heritage";
  }

  showPopup(title,message,type="admin_message",opts={}){
    // Inside globaladmin keep the popup out of the way, but still sound the alert.
    if(this.isInGlobalChat()){
      this.playSound(type,message,opts);
      return;
    }

    const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const old=document.getElementById("lodgePopup"); if(old) old.remove();
    const popup=document.createElement("div");
    popup.id="lodgePopup";
    popup.style=`position:fixed;top:80px;right:20px;left:20px;max-width:350px;margin-left:auto;background:linear-gradient(145deg,#142238,#0b1728);border:1px solid #d4af37;border-radius:16px;padding:15px;display:flex;gap:12px;z-index:9999;box-shadow:0 15px 40px rgba(0,0,0,.6);animation:slideIn.3s ease;`;
    popup.innerHTML=`<div style="width:45px;height:45px;background:rgba(212,175,55,.2);border-radius:12px;display:grid;place-items:center;color:#d4af37;flex-shrink:0;"><i class="fa ${type==="announcement"?"fa-bullhorn":"fa-comments"}"></i></div><div style="flex:1;"><div style="font-weight:700;color:white;font-size:14px;">${esc(title)}</div><div style="font-size:12px;color:#ccc;margin-top:4px;">${esc(message)}</div><div style="margin-top:8px;display:flex;gap:8px;"><button id="lodgeOpenBtn" style="flex:1;background:linear-gradient(135deg,#d4af37,#b8941f);border:none;border-radius:20px;padding:6px;font-size:11px;font-weight:700;cursor:pointer;">Open</button><button onclick="this.closest('#lodgePopup').remove()" style="flex:1;background:rgba(255,255,255,.1);border:1px solid rgba(212,175,55,.3);border-radius:20px;padding:6px;font-size:11px;color:#fff;cursor:pointer;">Close</button></div></div><div onclick="this.parentElement.remove()" style="color:#777;cursor:pointer;"><i class="fa fa-times"></i></div>`;
    document.body.appendChild(popup);

    const openBtn=document.getElementById("lodgeOpenBtn");
    if(openBtn){
      openBtn.onclick=()=>{
        popup.remove();
        // There is no notifications.html; the board lives on the dashboard.
        if(type==="announcement"){
          window.location.href="dashboard.html#announcements";
        }else{
          window.location.href="globaladmin.html";
        }
      };
    }

    this.playSound(type,message,opts);
    setTimeout(()=>{ if(popup.parentElement) popup.remove(); },8000);
  }
}

const notifier=new LodgeNotifier();
const style=document.createElement("style");
style.innerHTML=`@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}`;
document.head.appendChild(style);
window.LodgeNotifier=notifier;
const saved=localStorage.getItem("globalChatBadge_count");
if(saved && parseInt(saved)>0){ setTimeout(()=>notifier.setAppIconBadge(parseInt(saved)),1000); }

// Unlock audio on real gestures (required on Android/iOS). unlock() only
// primes the notification sound once per page load.
['pointerdown','touchstart','keydown'].forEach(evt=>{
  document.addEventListener(evt,()=>notifier.unlock(),{passive:true});
});
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible') notifier.unlock();
});

// SAVE ONESIGNAL ID TO FIREBASE - NEEDED FOR CLOSED-APP PUSH
window.OneSignalDeferred = window.OneSignalDeferred || [];
OneSignalDeferred.push(async function(OneSignal) {
  try{
    const id = await OneSignal.User.PushSubscription.id;
    if (!id) return;
    // Try compat SDK first, then modular fallback
    if(window.firebase && firebase.auth){
      const user = firebase.auth().currentUser;
      if (!user) return;
      firebase.database().ref(`users/${user.uid}/oneSignalId`).set(id);
      firebase.database().ref(`playerIds/${user.uid}/${id}`).set({id:id,platform:'web',updatedAt:Date.now()});
      console.log("PlayerId saved compat", id);
    } else if(window.firebaseAuthUser){
      // modular will be handled in page module
      localStorage.setItem("onesignal_pending_id", id);
    }
  }catch(e){ console.log("OneSignal save error", e); }
});

// ---------- NATIVE NOTIFICATION HEALTH ----------
// If the phone has notifications blocked (permission, app-level toggle or a
// disabled channel) no push can ever appear. The Android app exposes the real
// state through MffNative; show a clear, tappable warning instead of letting
// the member/admin believe messages are simply not arriving.
function mffRenderNotificationHealth(status){
  const existing=document.getElementById('mffNotifHealth');
  if(!status || !status.blocked){ if(existing) existing.remove(); return; }
  if(existing) return;
  const copy={
    permission:'Notifications are off. Tap Fix to allow MFF alerts.',
    app:'Notifications are blocked for MFF. Tap Fix to turn them on.',
    channel:'The MFF message channel is turned off. Tap Fix to enable it.'
  };
  const bar=document.createElement('div');
  bar.id='mffNotifHealth';
  bar.style.cssText='position:fixed;left:10px;right:10px;bottom:14px;z-index:100000;display:flex;align-items:center;gap:10px;padding:11px 13px;border-radius:14px;background:#2a1c05;border:1px solid #d4b16a;color:#ffe9b0;font:600 12px/1.4 system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.55)';
  const icon=document.createElement('span');icon.textContent='🔔';icon.style.fontSize='18px';
  const text=document.createElement('span');text.style.flex='1';text.textContent=copy[status.blocked]||copy.app;
  const fix=document.createElement('button');
  fix.type='button';fix.textContent='Fix';
  fix.style.cssText='flex:none;border:none;border-radius:999px;padding:7px 14px;background:#d4b16a;color:#111;font:800 12px system-ui,sans-serif;cursor:pointer';
  fix.addEventListener('click',function(){
    try{
      if(status.blocked==='permission' && window.MffNative && typeof window.MffNative.requestNotificationPermission==='function'){
        window.MffNative.requestNotificationPermission();
      }else if(window.MffNative && typeof window.MffNative.openNotificationSettings==='function'){
        window.MffNative.openNotificationSettings();
      }
    }catch(e){}
  });
  bar.appendChild(icon);bar.appendChild(text);bar.appendChild(fix);
  document.body.appendChild(bar);
}

function mffCheckNotificationHealth(){
  if(!window.MffNative || typeof window.MffNative.notificationStatus!=='function') return;
  try{
    const raw=window.MffNative.notificationStatus();
    const status=typeof raw==='string' ? JSON.parse(raw) : raw;
    if(status) mffRenderNotificationHealth(status);
  }catch(e){}
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',function(){ setTimeout(mffCheckNotificationHealth,1200); });
}else{
  setTimeout(mffCheckNotificationHealth,1200);
}
// Re-check a few times: the user may grant permission or enable the channel
// while the page is open, and the banner must disappear immediately.
let mffHealthTicks=0;
const mffHealthTimer=setInterval(function(){
  mffHealthTicks++;
  mffCheckNotificationHealth();
  if(mffHealthTicks>=40) clearInterval(mffHealthTimer);
},15000);

