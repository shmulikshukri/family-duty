// functions/index.js
// Deploy with: firebase deploy --only functions

const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

/**
 * HTTP Cloud Function to send a push notification to a specific FCM token.
 * Called from the React app when a duty event occurs.
 */
exports.sendPush = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }

  const { token, title, body } = req.body;
  if (!token || !title || !body) {
    res.status(400).json({ error: "Missing token, title, or body" });
    return;
  }

  try {
    await admin.messaging().send({
      token,
      notification: { title, body },
      android: { priority: "high", notification: { sound: "default", channelId: "duty" } },
      apns: { payload: { aps: { sound: "default", badge: 1 } } },
    });
    res.json({ success: true });
  } catch (err) {
    console.error("FCM error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Scheduled function — checks every hour if a duty date has passed
 * and sends a reminder push to the relevant user.
 */
exports.scheduledDutyReminder = functions.pubsub
  .schedule("every 60 minutes")
  .onRun(async () => {
    const db = admin.firestore();
    const settingsSnap = await db.doc("app/settings").get();
    const settings = settingsSnap.data();
    if (!settings?.nextDutyDate || !settings?.currentTurnUid) return null;

    const dutyDate = new Date(settings.nextDutyDate);
    const now = new Date();
    const diffHours = (dutyDate - now) / 3600000;

    // Send reminder 2 hours before
    if (diffHours > 0 && diffHours <= 2) {
      const userSnap = await db.doc(`users/${settings.currentTurnUid}`).get();
      const token = userSnap.data()?.fcmToken;
      const name = userSnap.data()?.name || "";
      if (!token) return null;

      await admin.messaging().send({
        token,
        notification: {
          title: "תורנות משפחתית 🏠",
          body: `${name}, תזכורת — תורנות בעוד פחות מ-2 שעות!`,
        },
        android: { priority: "high", notification: { sound: "default" } },
        apns: { payload: { aps: { sound: "default" } } },
      });
    }
    return null;
  });
