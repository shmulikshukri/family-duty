// 🔧 החלף את הערכים האלה בפרטי הפרויקט שלך מ-Firebase Console
// ראה README.md להוראות מפורטות

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDS4396Vmv-465Azah6jjW5jYzznGCSatQ",
  authDomain: "family-duty-9d166.firebaseapp.com",
  projectId: "family-duty-9d166",
  storageBucket: "family-duty-9d166.firebasestorage.app",
  messagingSenderId: "72009192545",
  appId: "1:72009192545:web:9b481a7bf815324f03c620",
  vapidKey: "BIhFqXOnN96TCU2bPrrF04B_CHcHz4XevbpJ5LhR8huFDWD3XcdeOQDaBveSSszW6rrbAfuD3BJcUnnizMcKO_U",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

let messaging = null;
try {
  messaging = getMessaging(app);
} catch (e) {
  console.log("FCM not supported in this environment");
}
export { messaging, getToken, onMessage };
