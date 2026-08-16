// FCM requires its own dedicated service worker file at the site root to
// display notifications while the tab is backgrounded or closed. Foreground
// (tab open) delivery is handled separately in pushNotifications.ts via
// onMessage(), which shows the app's own Toast instead of a system notification.
importScripts('https://www.gstatic.com/firebasejs/12.17.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.17.1/firebase-messaging-compat.js');

// Same public client config as web/src/services/firebase.ts — these values
// are not secrets (they identify the Firebase project, not authorize access).
firebase.initializeApp({
  apiKey: 'AIzaSyDawFgZ-HOfvFcLHr9opmxKsImhPcykhPc',
  authDomain: 'superlig-fantasy-optimizer.firebaseapp.com',
  projectId: 'superlig-fantasy-optimizer',
  storageBucket: 'superlig-fantasy-optimizer.firebasestorage.app',
  messagingSenderId: '453181602868',
  appId: '1:453181602868:web:c26ac13d00af084f845e61',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || 'Süper Lig Fantasy', { body: body || '' });
});
