// Freemasonry Heritage - FIXED no github.io showing
class LodgeNotifier {
  constructor() {
    this.unreadCount=0;
    this.audio=new Audio('/sounds/notification.mp3'); this.audio.volume=0.7;
    this.ADMIN_EMAIL="mansoryfamilyn@gmail.com";
    window.speechSynthesis.getVoices();
    setTimeout(()=>window.speechSynthesis.getVoices(),500);
  }
  speak(text){
    try{
      window.speechSynthesis.cancel();
      const u=new SpeechSynthesisUtterance(text);
      u.lang='en-US'; u.rate=0.92; u.pitch=1.05;
      const voices=window.speechSynthesis.getVoices();
      const pref=voices.find(v=>v.name.includes('Google UK English Female')||v.name.includes('Samantha')||v.name.includes('Zira')||v.name.toLowerCase().includes('female'))||voices.find(v=>v.lang==='en-US')||voices[0];
      if(pref) u.voice=pref;
      window.speechSynthesis.speak(u);
    }catch(e){}
  }
  async showSystemNotification(title, body){
    // FIX: Use Service Worker so Chrome doesn't show mansoryfamily.github.io
    try{
      if('serviceWorker' in navigator){
        const reg=await navigator.serviceWorker.ready;
        reg.showNotification(title, {
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
  async playSound(type="admin_message"){
    try{ this.audio.currentTime=0; await this.audio.play(); }catch(e){}
    if(navigator.vibrate) navigator.vibrate([200,100,200]);
    setTimeout(()=>{
      if(type==="member_message"){
        this.speak("Hello director, you got a new message please reply.");
        this.showSystemNotification("MFF Lodge", "Hello director, you got a new message please reply.");
      } else if(type==="admin_message"){
        this.speak("Hello member, you got a new message from director please reply.");
        this.showSystemNotification("MFF Lodge", "Hello member, you got a new message from director please reply.");
      } else if(type==="announcement"){
        this.speak("New announcement from Lodge Director, please check");
        this.showSystemNotification("MFF Lodge", "New announcement from Lodge Director");
      }
    },300);
  }
  async setAppIconBadge(count){
    this.unreadCount=count;
    localStorage.setItem("globalChatBadge_count",count);
    localStorage.setItem("notifCount_count",count);
    const chatBadge=document.getElementById("globalChatBadge");
    const notifBadge=document.getElementById("notifBadge");
    const notifCount=document.getElementById("notifCount");
    if(chatBadge){ chatBadge.textContent=count>99?"99+":count; chatBadge.style.display=count>0?"grid":"none"; }
    if(notifCount){ notifCount.textContent=count>99?"99+":count; notifCount.style.display=count>0?"grid":"none"; }
    if('setAppBadge' in navigator){ try{ if(count>0) await navigator.setAppBadge(count); else await navigator.clearAppBadge(); }catch(e){} }
    document.title=count>0?`(${count}) Freemasonry Heritage`:"Freemasonry Heritage";
  }
  showPopup(title,message,type="admin_message"){
    const old=document.getElementById("lodgePopup"); if(old) old.remove();
    const popup=document.createElement("div");
    popup.id="lodgePopup";
    popup.style=`position:fixed;top:80px;right:20px;left:20px;max-width:350px;margin-left:auto;background:linear-gradient(145deg,#142238,#0b1728);border:1px solid #d4af37;border-radius:16px;padding:15px;display:flex;gap:12px;z-index:9999;box-shadow:0 15px 40px rgba(0,0,0,.6);animation:slideIn.3s ease;`;
    popup.innerHTML=`<div style="width:45px;height:45px;background:rgba(212,175,55,.2);border-radius:12px;display:grid;place-items:center;color:#d4af37;flex-shrink:0;"><i class="fa ${type==="announcement"?"fa-bullhorn":"fa-comments"}"></i></div><div style="flex:1;"><div style="font-weight:700;color:white;font-size:14px;">${title}</div><div style="font-size:12px;color:#ccc;margin-top:4px;">${message}</div></div><div onclick="this.parentElement.remove()" style="color:#777;cursor:pointer;"><i class="fa fa-times"></i></div>`;
    document.body.appendChild(popup);
    this.playSound(type);
    setTimeout(()=>{ if(popup.parentElement) popup.remove(); },6500);
  }
}
const notifier=new LodgeNotifier();
const style=document.createElement("style");
style.innerHTML=`@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}`;
document.head.appendChild(style);
window.LodgeNotifier=notifier;
if('speechSynthesis' in window){ speechSynthesis.onvoiceschanged=()=>{ speechSynthesis.getVoices(); }; }
const saved=localStorage.getItem("globalChatBadge_count");
if(saved && parseInt(saved)>0){ setTimeout(()=>notifier.setAppIconBadge(parseInt(saved)),1000); }
