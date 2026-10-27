// Freemasonry Heritage - notifier (sound + voice + popup + badge)
// Voice works on dashboard/help and outside globaladmin, and now speaks the
// actual incoming message instead of the same generic sentence every time.
class LodgeNotifier {
  constructor() {
    this.unreadCount=0;
    this.audio=new Audio('./notification.wav'); this.audio.volume=0.7;
    this.ADMIN_EMAIL="mansoryfamilyn@gmail.com";
    this.lastVoiceTime=0;
    this.spoken=new Map();
    this.unlocked=false;
    try{ window.speechSynthesis.getVoices(); }catch(e){}
    setTimeout(()=>{ try{ window.speechSynthesis.getVoices(); }catch(e){} },500);
  }

  isInGlobalChat(){
    return window.location.href.includes("globaladmin.html");
  }

  pickVoice(){
    try{
      const voices=window.speechSynthesis.getVoices()||[];
      return voices.find(v=>/Google UK English Female|Samantha|Zira|Aria|Jenny|Google US English/i.test(v.name)) ||
             voices.find(v=>/^en(-|_)/i.test(v.lang) && /female/i.test(v.name)) ||
             voices.find(v=>/^en(-|_)/i.test(v.lang)) ||
             voices[0] || null;
    }catch(e){ return null; }
  }

  // Mobile browsers only allow speech after a real user gesture. Call this from
  // the first tap/keypress so later background message voices are allowed.
  unlock(){
    try{
      if(!('speechSynthesis' in window) || this.unlocked) return;
      this.unlocked=true;
      window.speechSynthesis.getVoices();
      if(window.speechSynthesis.paused) window.speechSynthesis.resume();
      const u=new SpeechSynthesisUtterance(' ');
      u.volume=0; u.rate=1; u.pitch=1;
      window.speechSynthesis.speak(u);
      // Prime the notification sound too, so later background plays are allowed.
      try{ this.audio.play().then(()=>{ this.audio.pause(); this.audio.currentTime=0; }).catch(()=>{}); }catch(e){}
    }catch(e){}
  }

  speak(text,opts={}){
    try{
      if(!('speechSynthesis' in window)) return;
      const clean=String(text==null?'':text)
        .replace(/🎤\s*/g,'Voice note. ')
        .replace(/📷\s*/g,'Photo. ')
        .replace(/🎥\s*/g,'Video. ')
        .replace(/\s+/g,' ')
        .trim();
      if(!clean) return;

      // Deduplicate by message id when we have one. Firebase re-renders the
      // same message on every status change, and pages with their own chat
      // listeners can call showPopup twice for the same message.
      const key=opts.id?('id:'+opts.id):('text:'+clean.slice(0,120));
      const now=Date.now();
      const previous=this.spoken.get(key);
      if(previous && now-previous<120000) return;
      this.spoken.set(key,now);
      if(this.spoken.size>60){
        const cutoff=now-300000;
        for(const [k,v] of this.spoken){ if(v<cutoff) this.spoken.delete(k); }
      }
      if(now-this.lastVoiceTime<600) return;
      this.lastVoiceTime=now;

      // Android WebView has no usable speechSynthesis engine. The app exposes
      // a native TextToSpeech bridge, which also ignores autoplay restrictions.
      if(window.MffNative && typeof window.MffNative.speak==='function'){
        try{ window.MffNative.speak(clean); return; }catch(e){}
      }

      try{ if(window.speechSynthesis.paused) window.speechSynthesis.resume(); }catch(e){}
      window.speechSynthesis.cancel();
      const u=new SpeechSynthesisUtterance(clean);
      u.lang=opts.lang||'en-US'; u.rate=0.95; u.pitch=1.02; u.volume=1;
      const pref=this.pickVoice(); if(pref) u.voice=pref;
      // Chrome sometimes drops an utterance queued immediately after cancel().
      setTimeout(()=>{
        try{
          if(!window.speechSynthesis.speaking) window.speechSynthesis.speak(u);
          setTimeout(()=>{ try{ if(window.speechSynthesis.paused) window.speechSynthesis.resume(); }catch(e){} },400);
        }catch(e){}
      },120);
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
    // Speak a clear, consistent alert. Chat alerts use the wording the lodge
    // asked for; announcements still include the announcement text.
    const phrase = type==="member_message"
      ? "Hello admin, you got a new message from a member."
      : type==="announcement"
        ? "Hello member, you got a new announcement from Administration."
        : "Hello member, you got a new message from Administration.";
    const spoken = type==="announcement" && body ? (phrase+" "+body) : phrase;
    setTimeout(()=>{
      this.speak(spoken,opts);
      this.showSystemNotification(type==="announcement"?"MFF Announcement":"MFF Lodge",body||phrase).catch(()=>{});
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
    // Inside globaladmin keep the popup out of the way, but still speak.
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
if('speechSynthesis' in window){ speechSynthesis.onvoiceschanged=()=>{ try{ speechSynthesis.getVoices(); }catch(e){} }; }
const saved=localStorage.getItem("globalChatBadge_count");
if(saved && parseInt(saved)>0){ setTimeout(()=>notifier.setAppIconBadge(parseInt(saved)),1000); }

// Unlock speech on the first real gesture (required on Android/iOS).
['pointerdown','touchstart','keydown'].forEach(evt=>{
  document.addEventListener(evt,()=>notifier.unlock(),{once:true,passive:true});
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
      firebase.database().ref(`playerIds/${user.uid}/${id}`).set(true);
      console.log("PlayerId saved compat", id);
    } else if(window.firebaseAuthUser){
      // modular will be handled in page module
      localStorage.setItem("onesignal_pending_id", id);
    }
  }catch(e){ console.log("OneSignal save error", e); }
});
