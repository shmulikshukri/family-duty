// firebase-messaging-sw.js
// This file must be in the /public folder

importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDS4396Vmv-465Azah6jjW5jYzznGCSatQ",
  authDomain: "family-duty-9d166.firebaseapp.com",
  projectId: "family-duty-9d166",
  storageBucket: "family-duty-9d166.firebasestorage.app",
  messagingSenderId: "72009192545",
  appId: "1:72009192545:web:9b481a7bf815324f03c620",
});

const messaging = firebase.messaging();

// Handle background push notifications
messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: "/logo192.png",
    badge: "/logo192.png",
    vibrate: [200, 100, 200],
    tag: "duty-notification",
    renotify: true,
  });
});
