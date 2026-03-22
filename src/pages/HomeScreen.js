import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { useDuty } from "../hooks/useDuty";

const COLORS = {
  green:  { bg: "#9FE1CB", text: "#085041" },
  blue:   { bg: "#B5D4F4", text: "#0C447C" },
  amber:  { bg: "#FAC775", text: "#633806" },
  pink:   { bg: "#F4C0D1", text: "#72243E" },
  purple: { bg: "#CECBF6", text: "#3C3489" },
};
const COLOR_LIST = Object.values(COLORS);

function Avatar({ name, photo, index, size = 36 }) {
  const c = COLOR_LIST[index % COLOR_LIST.length];
  if (photo) return (
    <img src={photo} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
  );
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: c.bg, color: c.text,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.36, fontWeight: 500, flexShrink: 0
    }}>
      {name?.[0] || "?"}
    </div>
  );
}

function Badge({ label, type }) {
  const styles = {
    now:  { background: "#9FE1CB", color: "#085041" },
    next: { background: "#FAEEDA", color: "#633806" },
    skip: { background: "#CECBF6", color: "#3C3489" },
  };
  const s = styles[type] || styles.now;
  return (
    <span style={{
      fontSize: 11, padding: "2px 8px", borderRadius: 99,
      fontWeight: 500, ...s, marginRight: 4, whiteSpace: "nowrap"
    }}>{label}</span>
  );
}

export default function HomeScreen() {
  const { profile, logout } = useAuth();
  const { settings, users, history, currentUser, nextUser, markDone, useSkip, loading } = useDuty();
  const [tab, setTab] = React.useState("home");
  const isMe = currentUser?.id === profile?.uid;
  const myProfile = users.find(u => u.id === profile?.uid);

  if (loading) return <div style={{ padding: "2rem", textAlign: "center", color: "#888", direction: "rtl" }}>טוען...</div>;

  const nextDutyFormatted = settings?.nextDutyDate
    ? new Date(settings.nextDutyDate).toLocaleString("he-IL")
    : null;

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "1rem", direction: "rtl", fontFamily: "system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 500, color: "#111" }}>תורנות משפחתית</div>
          <div style={{ fontSize: 13, color: "#666" }}>שלום, {profile?.name}</div>
        </div>
        <button onClick={logout} style={{
          fontSize: 12, padding: "5px 12px", borderRadius: 8, border: "0.5px solid #ddd",
          background: "white", color: "#666", cursor: "pointer"
        }}>יציאה</button>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex", gap: 4, marginBottom: "1.5rem",
        background: "#f2f2f0", borderRadius: 12, padding: 4
      }}>
        {["home", "history"].map((t, i) => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: "8px", fontSize: 13, borderRadius: 8,
            border: tab === t ? "0.5px solid #ddd" : "none",
            background: tab === t ? "white" : "transparent",
            color: tab === t ? "#111" : "#666",
            fontWeight: tab === t ? 500 : 400, cursor: "pointer", fontFamily: "inherit"
          }}>
            {i === 0 ? "בית" : "היסטוריה"}
          </button>
        ))}
      </div>

      {tab === "home" && (
        <>
          {/* Hero card */}
          <div style={{
            background: isMe ? "#E1F5EE" : "#f5f5f3",
            border: `0.5px solid ${isMe ? "#9FE1CB" : "#e0e0e0"}`,
            borderRadius: 12, padding: "1.25rem", marginBottom: "1rem"
          }}>
            <div style={{ fontSize: 12, color: isMe ? "#0F6E56" : "#666", marginBottom: 4 }}>
              {isMe ? "זה התור שלך! 🎯" : "תורנות נוכחית"}
            </div>
            <div style={{ fontSize: 22, fontWeight: 500, color: isMe ? "#085041" : "#111" }}>
              {currentUser?.name || "—"}
            </div>
            <div style={{ fontSize: 13, color: isMe ? "#0F6E56" : "#666", marginTop: 2 }}>
              {isMe ? "בצע את התורנות וסמן" : "ממתין לביצוע"}
            </div>
            {nextDutyFormatted && (
              <div style={{ fontSize: 13, color: isMe ? "#0F6E56" : "#888", marginTop: 6 }}>
                📅 עד: {nextDutyFormatted}
              </div>
            )}
          </div>

          {/* Skip banner */}
          {isMe && myProfile?.canSkip && (
            <div style={{
              background: "#EEEDFE", border: "0.5px solid #AFA9EC", borderRadius: 8,
              padding: "10px 12px", marginBottom: 8, fontSize: 13, color: "#3C3489",
              display: "flex", alignItems: "center", gap: 8
            }}>
              🎫 יש לך הרשאת דילוג חד-פעמית מהמנהל
            </div>
          )}

          {/* Action buttons */}
          {isMe && (
            <>
              <button onClick={() => markDone()} style={{
                width: "100%", padding: "11px", borderRadius: 8, marginBottom: 8,
                background: "#1D9E75", color: "white", border: "none",
                fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit"
              }}>
                ✓ סמן שביצעתי
              </button>
              <button
                onClick={useSkip}
                disabled={!myProfile?.canSkip}
                style={{
                  width: "100%", padding: "11px", borderRadius: 8, marginBottom: 8,
                  background: myProfile?.canSkip ? "#FAEEDA" : "#f5f5f3",
                  color: myProfile?.canSkip ? "#633806" : "#aaa",
                  border: `0.5px solid ${myProfile?.canSkip ? "#FAC775" : "#e0e0e0"}`,
                  fontSize: 14, fontWeight: 500,
                  cursor: myProfile?.canSkip ? "pointer" : "not-allowed",
                  fontFamily: "inherit"
                }}
              >
                {myProfile?.canSkip
                  ? `דלג על התור ← יעבור ל${nextUser?.name}`
                  : "דילוג — אין הרשאה"}
              </button>
            </>
          )}

          {/* Turn order list */}
          <div style={{ fontSize: 11, fontWeight: 500, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", margin: "1.25rem 0 0.5rem" }}>
            סדר התורנויות
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {users.map((u, i) => {
              const isCurrent = u.id === settings?.currentTurnUid;
              const isNext = nextUser?.id === u.id && !isCurrent;
              return (
                <div key={u.id} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                  background: isCurrent ? "#E1F5EE" : "white",
                  border: `0.5px solid ${isCurrent ? "#9FE1CB" : "#e0e0e0"}`,
                  borderRadius: 8
                }}>
                  <Avatar name={u.name} photo={u.photo} index={i} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "#111" }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: "#888" }}>{u.email}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {u.canSkip && <Badge label="דילוג" type="skip" />}
                    {isCurrent && <Badge label="עכשיו" type="now" />}
                    {isNext && <Badge label="הבא" type="next" />}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === "history" && (
        <>
          <div style={{ fontSize: 11, fontWeight: 500, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>
            פעילות אחרונה
          </div>
          {history.length === 0 && (
            <div style={{ textAlign: "center", color: "#aaa", fontSize: 13, padding: "2rem" }}>אין עדיין היסטוריה</div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {history.map((h, i) => {
              const u = users.find(x => x.id === h.userId);
              const uIdx = users.findIndex(x => x.id === h.userId);
              return (
                <div key={h.id} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                  background: "white", border: "0.5px solid #e0e0e0", borderRadius: 8
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                    background: h.type === "skip" ? "#FAEEDA" : "#E1F5EE",
                    border: `0.5px solid ${h.type === "skip" ? "#FAC775" : "#9FE1CB"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, color: h.type === "skip" ? "#633806" : "#085041"
                  }}>
                    {h.type === "skip" ? "↷" : "✓"}
                  </div>
                  <Avatar name={h.userName} photo={h.userPhoto} index={uIdx >= 0 ? uIdx : i} size={28} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "#111" }}>
                      {h.userName} — {h.type === "skip" ? "דילג על התור" : "ביצע תורנות"}
                    </div>
                    <div style={{ fontSize: 12, color: "#888" }}>
                      {h.createdAt?.toDate?.().toLocaleString("he-IL") || ""}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
