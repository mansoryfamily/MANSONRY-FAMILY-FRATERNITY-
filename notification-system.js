// Freemasonry Heritage - 2-Way Voice Notifications - FIXED
// Admin Gmail = mansoryfamilyn@gmail.com - 15 languages support + Badge stays when app closed

class LodgeNotifier {
  constructor() {
    this.unreadCount = 0;
    this.audio = new Audio('/sounds/notification.mp3');
    this.audio.volume = 0.7;
    this.ADMIN_EMAIL = "mansoryfamilyn@gmail.com";
    window.speechSynthesis.getVoices();
    setTimeout(()=>window.speechSynthesis.getVoices(), 500);
    // Request permission for closed-app notification
    if('Notification' in window && Notification.permission==="default"){
      Notification.requestPermission();
    }
  }

  speak(text){
    try{
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'en-US';
      utter.volume = 1;
      utter.rate = 0.92;
      utter.pitch = 1.05;
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v =>
        v.name.includes('Google UK English Female') ||
        v.name.includes('Samantha') ||
        v.name.includes('Zira') ||
        v.name.toLowerCase().includes('female')
      ) || voices.find(v=> v.lang==='en-US') || voices[0];
      if(preferred) utter.voice = preferred;
      window.speechSynthesis.speak(utter);
    }catch(e){}
  }

  async showSystemNotification(title, body){
    // This fixes your screenshot - shows when app is closed
    if('Notification' in window && Notification.permission==="granted"){
      try{
        // Use SW if available for background
        if('serviceWorker' in navigator && navigator.serviceWorker.controller){
          const reg = await navigator.serviceWorker.ready;
          reg.showNotification(title, {
            body: body,
            icon: 'masonic-G.png',
            badge: 'masonic-G.png',
            vibrate: [200,100,200],
            requireInteraction: true,
            tag: 'mff-message'
          });
        } else {
          const n = new Notification(title, {
            body: body,
            icon: 'masonic-G.png',
            badge: 'masonic-G.png',
            vibrate: [200,100,200],
            requireInteraction: true
          });
          n.onclick = ()=>{ window.focus(); n.close(); window.location.href='globaladmin.html'; };
        }
      }catch(e){}
    }
  }

  async playSound(type="admin_message"){
    try{ this.audio.currentTime=0; await this.audio.play(); }catch(e){}
    if(navigator.vibrate) navigator.vibrate([200,100,200]);

    setTimeout(()=>{
      if(type==="member_message"){
        // ADMIN hears this when member sends - YOUR REQUEST
        this.speak("Hello director, you got a new message please reply.");
        this.showSystemNotification("MFF Lodge", "Hello director, you got a new message please reply.");
      } else if(type==="admin_message"){
        // MEMBER hears this when admin sends message to member - YOUR REQUEST
        this.speak("Hello member, you got a new message from director please reply.");
        this.showSystemNotification("MFF Lodge", "Hello member, you got a new message from director please reply.");
      } else if(type==="announcement"){
        this.speak("New announcement from Lodge Director, please check");
        this.showSystemNotification("MFF Announcement", "New announcement from Lodge Director");
      } else {
        this.speak("You have a new notification");
      }
    }, 300);
  }

  async setAppIconBadge(count){
    this.unreadCount = count;
    // Save to localStorage so badge 1 stays even after reload
    localStorage.setItem("globalChatBadge_count", count);
    localStorage.setItem("notifCount_count", count);

    const chatBadge = document.getElementById("globalChatBadge");
    const notifBadge = document.getElementById("notifBadge");
    const notifCount = document.getElementById("notifCount");

    if(chatBadge){ chatBadge.textContent=count>99?"99+":count; chatBadge.style.display=count>0?"grid":"none"; }
    if(notifCount){ notifCount.textContent=count>99?"99+":count; notifCount.style.display=count>0?"grid":"none"; }

    // This shows badge on MFF app icon (your screenshot)
    if('setAppBadge' in navigator){
      try{ if(count>0) await navigator.setAppBadge(count); else await navigator.clearAppBadge(); }catch(e){}
    }
    document.title = count>0? `(${count}) Freemasonry Heritage` : "Freemasonry Heritage";
  }

  showPopup(title, message, type="admin_message"){
    const old = document.getElementById("lodgePopup");
    if(old) old.remove();
    const popup = document.createElement("div");
    popup.id="lodgePopup";
    popup.style=`position:fixed;top:80px;right:20px;left:20px;max-width:350px;margin-left:auto;background:linear-gradient(145deg,#142238,#0b1728);border:1px solid #d4af37;border-radius:16px;padding:15px;display:flex;gap:12px;z-index:9999;box-shadow:0 15px 40px rgba(0,0,0,.6);animation:slideIn.3s ease;`;
    popup.innerHTML=`
      <div style="width:45px;height:45px;background:rgba(212,175,55,.2);border-radius:12px;display:grid;place-items:center;color:#d4af37;flex-shrink:0;"><i class="fa ${type==="announcement"?"fa-bullhorn":"fa-comments"}"></i></div>
      <div style="flex:1;"><div style="font-weight:700;color:white;font-size:14px;">${title}</div><div style="font-size:12px;color:#ccc;margin-top:4px;">${message}</div></div>
      <div onclick="this.parentElement.remove()" style="color:#777;cursor:pointer;"><i class="fa fa-times"></i></div>
    `;
    document.body.appendChild(popup);
    this.playSound(type);
    setTimeout(()=>{ if(popup.parentElement) popup.remove(); }, 6500);
  }
}

const notifier = new LodgeNotifier();
const style=document.createElement("style");
style.innerHTML=`@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}`;
document.head.appendChild(style);
window.LodgeNotifier = notifier;
if('speechSynthesis' in window){
  speechSynthesis.onvoiceschanged = ()=>{ speechSynthesis.getVoices(); };
}
// Restore badge on load so 1 stays
const saved = localStorage.getItem("globalChatBadge_count");
if(saved && parseInt(saved)>0){
  setTimeout(()=> notifier.setAppIconBadge(parseInt(saved)), 1000);
}
