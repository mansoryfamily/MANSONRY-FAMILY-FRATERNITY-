// Freemasonry - Global Notification System with Sound
class LodgeNotifier {
  constructor() {
    this.audio = new Audio('/sounds/notification.mp3');
    this.audio.volume = 0.8;
    this.unreadCount = 0;
    this.initBadgeAPI();
  }
  initBadgeAPI(){
    // For PWA badge like Messages 1
    if('setAppBadge' in navigator){
      console.log("Badge API supported");
    }
  }
  async playSound(){
    try{ 
      this.audio.currentTime=0; 
      await this.audio.play(); 
      // Vibrate on phone
      if(navigator.vibrate) navigator.vibrate([200,100,200]);
    }catch(e){ console.log("Sound blocked, user must interact first"); }
  }
  async setAppIconBadge(count){
    this.unreadCount = count;
    // 1. Update header chat badge
    const chatBadge = document.getElementById("globalChatBadge");
    const notifBadge = document.getElementById("notifBadge");
    if(chatBadge){ chatBadge.textContent=count>99?"99+":count; chatBadge.style.display=count>0?"grid":"none"; }
    if(notifBadge){ notifBadge.textContent=count>99?"99+":count; notifBadge.style.display=count>0?"grid":"none"; }
    // 2. Update PWA app icon badge like your screenshot
    if('setAppBadge' in navigator){
      try{
        if(count>0) await navigator.setAppBadge(count);
        else await navigator.clearAppBadge();
      }catch(e){}
    }
    // 3. Update document title
    document.title = count>0 ? `(${count}) Freemasonry Heritage` : "Freemasonry Heritage";
  }
  showPopup(title, message, type="message"){
    // Remove old popup
    const old = document.getElementById("lodgePopup");
    if(old) old.remove();

    const popup = document.createElement("div");
    popup.id="lodgePopup";
    popup.style=`position:fixed;top:80px;right:20px;left:20px;max-width:350px;margin-left:auto;background:linear-gradient(145deg,#142238,#0b1728);border:1px solid #d4af37;border-radius:16px;padding:15px;display:flex;gap:12px;z-index:9999;box-shadow:0 15px 40px rgba(0,0,0,.6);animation:slideIn .3s ease;`;
    popup.innerHTML=`
      <div style="width:45px;height:45px;background:rgba(212,175,55,.2);border-radius:12px;display:grid;place-items:center;color:#d4af37;flex-shrink:0;"><i class="fa ${type==="announcement"?"fa-bullhorn":type==="chat"?"fa-comments":"fa-bell"}"></i></div>
      <div style="flex:1;"><div style="font-weight:700;color:white;font-size:14px;">${title}</div><div style="font-size:12px;color:#ccc;margin-top:4px;line-height:1.4;">${message}</div></div>
      <div onclick="this.parentElement.remove()" style="color:#777;cursor:pointer;"><i class="fa fa-times"></i></div>
    `;
    document.body.appendChild(popup);
    this.playSound();
    setTimeout(()=>{ if(popup) popup.remove(); }, 6000);
  }
}

const notifier = new LodgeNotifier();

// Add CSS animation
const style=document.createElement("style");
style.innerHTML=`@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}`;
document.head.appendChild(style);

// Export globally
window.LodgeNotifier = notifier;
