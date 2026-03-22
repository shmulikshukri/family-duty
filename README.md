# תורנות משפחתית — מדריך התקנה מלא

## מה יש כאן
אפליקציית React + Firebase לניהול תורנויות משפחתיות עם:
- כניסה עם Google
- תורנות סדרתית אוטומטית
- הרשאת דילוג חד-פעמית
- התראות פוש (FCM)
- לוח ניהול למנהל
- PWA — מתקינים על הטלפון כמו אפליקציה רגילה

---

## שלב 1 — יצירת פרויקט Firebase

1. כנס ל-[https://console.firebase.google.com](https://console.firebase.google.com)
2. לחץ **"Add project"** ותן שם (למשל `family-duty`)
3. השבת Google Analytics (לא חובה) ולחץ **Create project**

---

## שלב 2 — הפעל את השירותים הדרושים

### Authentication
- בתפריט שמאל: **Authentication** → **Get started**
- לשונית **Sign-in method** → הפעל **Google**
- הוסף את הדומיין שלך ב-**Authorized domains** (Vercel יוסיף אוטומטית)

### Firestore Database
- בתפריט: **Firestore Database** → **Create database**
- בחר **Start in production mode** → בחר אזור (europe-west1 מומלץ לישראל)

### Cloud Messaging (FCM)
- **Project Settings** (גלגל שיניים) → לשונית **Cloud Messaging**
- תחת **Web Push certificates** → **Generate key pair**
- שמור את ה-**Key pair** — זהו ה-`VAPID_KEY`

---

## שלב 3 — קבל את פרטי ה-config

- **Project Settings** → לשונית **General**
- גלול למטה ל-**Your apps** → לחץ **</>** (Web app) → רשום שם → **Register app**
- העתק את ה-`firebaseConfig` שמופיע

---

## שלב 4 — עדכן את הקוד

החלף את הערכים ב-**2 מקומות**:

### `src/firebase.js`
```js
const firebaseConfig = {
  apiKey: "...",           // מה-console
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "...",
  vapidKey: "...",         // ה-VAPID KEY שיצרת
};
```

### `public/firebase-messaging-sw.js`
```js
firebase.initializeApp({
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "...",
});
```

גם ב-`src/hooks/useDuty.js` שנה:
```js
const VAPID_KEY = "YOUR_VAPID_KEY"; // אותו VAPID KEY
```

---

## שלב 5 — העלה את חוקי האבטחה ל-Firestore

- ב-Firebase Console → **Firestore** → לשונית **Rules**
- העתק את התוכן של `firestore.rules` ולחץ **Publish**

---

## שלב 6 — הגדר את המנהל הראשון

לאחר ש-**אתה** (המנהל) נכנסת לאפליקציה בפעם הראשונה עם Google:

1. ב-Firebase Console → **Firestore** → אוסף `users`
2. מצא את המסמך שלך (ה-uid שלך)
3. שנה את השדה `role` מ-`pending` ל-`admin`
4. הוסף שדה `turnOrder` עם ערך `0`

---

## שלב 7 — הפעל Cloud Functions (לשליחת פוש)

```bash
npm install -g firebase-tools
firebase login
firebase init functions   # בחר JavaScript
```

החלף את `functions/index.js` בקובץ המצורף, ואז:
```bash
firebase deploy --only functions
```

עדכן את ה-URL ב-`src/hooks/useDuty.js`:
```js
await fetch("https://REGION-PROJECT.cloudfunctions.net/sendPush", ...
```

הURL יופיע בסוף הריצה של `firebase deploy`.

---

## שלב 8 — פריסה ב-Vercel (בחינם)

```bash
npm install
npm run build
npm install -g vercel
vercel --prod
```

או:
1. דחוף את הקוד ל-GitHub
2. כנס ל-[vercel.com](https://vercel.com) → **New Project** → חבר ל-repo
3. Vercel יבנה ויפרוס אוטומטית

לאחר הפריסה — הוסף את דומיין ה-Vercel ב-Firebase Console תחת **Authentication → Authorized domains**.

---

## שלב 9 — התקנה כאפליקציה על הטלפון

**אייפון (Safari):**
כנס לאתר → לחץ כפתור שיתוף → **"הוסף למסך הבית"**

**אנדרואיד (Chrome):**
כנס לאתר → לחץ על **"התקן אפליקציה"** שמופיע אוטומטית

---

## מבנה Firestore

```
app/
  settings/
    currentTurnUid: "uid123"
    nextDutyDate: "2025-07-15T10:00"

users/
  {uid}/
    name: "דנה"
    email: "dana@gmail.com"
    photo: "https://..."
    role: "admin" | "member" | "pending"
    turnOrder: 0
    canSkip: false
    fcmToken: "..."

history/
  {docId}/
    type: "done" | "skip"
    userId: "uid123"
    userName: "דנה"
    performedBy: "uid456"
    createdAt: Timestamp
```

---

## שאלות נפוצות

**כמה עולה?**
Firebase Spark (חינם) מספיק ל-5 משתמשים בנוחות. Cloud Functions דורשות Blaze (Pay as you go) — עם שימוש קטן כזה יעלה 0$ בפועל.

**איך מוסיפים חבר משפחה?**
הם נכנסים עם Google → מופיעים אצל המנהל כ"ממתינים לאישור" → המנהל לוחץ "אשר".

**מה קורה אם מישהו מחליף טלפון?**
ה-FCM token מתעדכן אוטומטית בכניסה הבאה לאפליקציה.
