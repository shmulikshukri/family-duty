import { useEffect, useState } from "react";
import {
  collection, doc, onSnapshot, updateDoc,
  addDoc, query, orderBy, serverTimestamp, getDoc, writeBatch
} from "firebase/firestore";
import { db, messaging, getToken } from "../firebase";
import { useAuth } from "../contexts/AuthContext";

const VAPID_KEY = "BIhFqXOnN96TCU2bPrrF04B_CHcHz4XevbpJ5LhR8huFDWD3XcdeOQDaBveSSszW6rrbAfuD3BJcUnnizMcKO_U";

export function useDuty() {
  const { user, profile } = useAuth();
  const [settings, setSettings] = useState(null);
  const [users, setUsers] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Listen to settings doc
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "app", "settings"), (snap) => {
      if (snap.exists()) setSettings(snap.data());
    });
    return unsub;
  }, []);

  // Listen to users collection
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "users"),
      (snap) => {
        const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        all.sort((a, b) => {
          if (a.role === "pending" && b.role !== "pending") return 1;
          if (a.role !== "pending" && b.role === "pending") return -1;
          return (a.turnOrder ?? 99) - (b.turnOrder ?? 99);
        });
        setUsers(all);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  // Listen to history
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "history"), orderBy("createdAt", "desc")),
      (snap) => setHistory(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return unsub;
  }, []);

  const currentUser = settings ? users.find((u) => u.id === settings.currentTurnUid) : null;
  const currentIndex = users.findIndex((u) => u.id === settings?.currentTurnUid);
  const nextUser = users[(currentIndex + 1) % users.length] || null;

  // Mark duty done (by current user or admin on behalf)
  async function markDone(onBehalfOfUid = null) {
    const targetUid = onBehalfOfUid || settings?.currentTurnUid;
    const targetUser = users.find((u) => u.id === targetUid);
    if (!targetUser) return;

    const idx = users.findIndex((u) => u.id === targetUid);
    const nextUid = users[(idx + 1) % users.length]?.id;

    const batch = writeBatch(db);
    batch.update(doc(db, "app", "settings"), { currentTurnUid: nextUid, nextDutyDate: null });
    await batch.commit();

    await addDoc(collection(db, "history"), {
      type: "done",
      userId: targetUid,
      userName: targetUser.name,
      userPhoto: targetUser.photo || null,
      performedBy: user.uid,
      createdAt: serverTimestamp(),
    });

    // Notify next user
    if (nextUid) await sendPushNotification(nextUid, "תורנות משפחתית 🏠", "הגיע התור שלך לתורנות!");
  }

  // Skip turn
  async function useSkip() {
    if (!profile?.canSkip) return;
    const idx = users.findIndex((u) => u.id === user.uid);
    const nextUid = users[(idx + 1) % users.length]?.id;

    const batch = writeBatch(db);
    batch.update(doc(db, "users", user.uid), { canSkip: false });
    batch.update(doc(db, "app", "settings"), { currentTurnUid: nextUid });
    await batch.commit();

    await addDoc(collection(db, "history"), {
      type: "skip",
      userId: user.uid,
      userName: profile.name,
      userPhoto: profile.photo || null,
      performedBy: user.uid,
      createdAt: serverTimestamp(),
    });

    if (nextUid) await sendPushNotification(nextUid, "תורנות משפחתית 🏠", "הגיע התור שלך — מישהו דילג!");
  }

  // Admin: grant skip
  async function grantSkip(uid) {
    await updateDoc(doc(db, "users", uid), { canSkip: true });
    // Notify user
    await sendPushNotification(uid, "תורנות משפחתית 🏠", "קיבלת הרשאת דילוג חד-פעמית מהמנהל!");
  }

  // Admin: revoke skip
  async function revokeSkip(uid) {
    await updateDoc(doc(db, "users", uid), { canSkip: false });
  }

  // Admin: set next duty date
  async function setNextDutyDate(dateISO) {
    await updateDoc(doc(db, "app", "settings"), { nextDutyDate: dateISO });
    if (settings?.currentTurnUid) {
      const d = new Date(dateISO).toLocaleString("he-IL");
      await sendPushNotification(settings.currentTurnUid, "תורנות משפחתית 🏠", `תורנות נקבעה ל-${d}`);
    }
  }

  // Admin: approve pending user
  async function setUserRole(uid, role, turnOrder) {
    const members = users.filter(u => u.role === "member" || u.role === "admin");
    const order = turnOrder ?? members.length;
    await updateDoc(doc(db, "users", uid), { role, turnOrder: order });
    // If no current turn set yet, set this user as first
    if (!settings?.currentTurnUid && role === "member") {
      await updateDoc(doc(db, "app", "settings"), { currentTurnUid: uid }).catch(async () => {
        const { setDoc } = await import("firebase/firestore");
        const { db: firedb } = await import("../firebase");
        // settings doc doesn't exist yet, will be created on first markDone
      });
    }
  }

  // Admin: reorder turn
  async function setTurn(uid) {
    await updateDoc(doc(db, "app", "settings"), { currentTurnUid: uid });
  }

  // Register FCM token for current user
  async function registerPushToken() {
    if (!messaging || !user) return;
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      if (token) await updateDoc(doc(db, "users", user.uid), { fcmToken: token });
    } catch (e) {
      console.error("FCM token error", e);
    }
  }

  // Send push via Cloud Function (see README for setup)
  async function sendPushNotification(uid, title, body) {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      const token = userDoc.data()?.fcmToken;
      if (!token) return;
      // Call your Firebase Cloud Function endpoint:
      await fetch("https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/sendPush", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, title, body }),
      });
    } catch (e) {
      console.error("Push error", e);
    }
  }

  return {
    settings, users, history, loading,
    currentUser, nextUser, currentIndex,
    markDone, useSkip, grantSkip, revokeSkip,
    setNextDutyDate, setUserRole, setTurn, registerPushToken,
  };
}
