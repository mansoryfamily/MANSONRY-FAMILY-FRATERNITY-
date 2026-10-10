// Mansory Push + Badge + Sound - No layout change
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/MANSONRY-FAMILY-FRATERNITY-/sw.js')
  .then(reg => {
    console.log('Mansory SW registered for badges');
    
    // Request notification permission
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
    
    // Update badge when app gets notification
    if ('setAppBadge' in navigator) {
      navigator.setAppBadge(1).catch(()=>{});
    }
  });
}

// Play sound for in-app notifications
function playMansorySound() {
  const audio = new Audio('/MANSONRY-FAMILY-FRATERNITY-/notification.mp3');
  audio.play().catch(()=>{});
  if ('setAppBadge' in navigator) {
    navigator.setAppBadge(1);
  }
}

// Clear badge when user opens app
window.addEventListener('focus', () => {
  if ('clearAppBadge' in navigator) {
    navigator.clearAppBadge();
  }
});
