import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useDuty } from "../hooks/useDuty";

const COLORS = [
  { bg: "#9FE1CB", text: "#085041" },
  { bg: "#B5D4F4", text: "#0C447C" },
  { bg: "#FAC775", text: "#633806" },
  { bg: "#F4C0D1", text: "#72243E" },
  { bg: "#CECBF6", text: "#3C3489" },
];

function Avatar({ name, photo, index, size = 34 }) {
  const c = COLORS[index % COLORS.length];
  if (photo) return <img src={photo} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: c.bg, color: c.text, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.36, fontWeight: 500, flexShrink: 0 }}>
      {name?.[0] || "?"}
    </div>
  );
}

export default function AdminScreen() {
  const { logout } = useAuth();
  const { users, settings, history, loading, markDone, grantSkip, revokeSkip, setUserRole, setNextDutyDate, setTurn } = useDuty();
  const [tab, setTab] = useState("users");
  const [dutyDate, setDutyDate] = useState("");
  const [toast, setToast] = useState("");

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2800);
  }

  // Show all users regardless of loading state
  const allUsers = users || [];
  const pendingUsers = allUsers.filter(u => u.role === "pending");
  const activeUsers = allUsers.filter(u => u.role === "member" || u.role === "admin");

  async function handleApprove(uid, name) {
    await setUserRole(uid, "member", activeUsers.length + 1);
    showToast("✓ " + name + " אושר!");
  }

  async function handleSetDate() {
    if (!dutyDate) { showToast("בחר תאריך"); return; }
    await setNextDutyDate(dutyDate);
    showToast("📅 תאריך נשמר");
    setDutyDate("");
  }

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "1rem", direction: "rtl", fontFamily: "system-ui, sans-serif", position: "relative" }}>

      {toast && (
        <div style={{
          position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
          background: "#085041", color: "white", padding: "8px 20px",
          borderRadius: 99, fontSize: 13, fontWeight: 500, zIndex: 100, whiteSpace: "nowrap"
        }}>{toast}</div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 500 }}>ניהול תורנות</div>
          <div style={{ fontSize: 13, color: "#666" }}>לוח בקרה מנהל</div>
        </div>
        <button onClick={logout} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 8, border: "0.5px solid #ddd", background: "white", color: "#666", cursor: "pointer" }}>יציאה</button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: "1.5rem", background: "#f2f2f0", borderRadius: 12, padding: 4 }}>
        {[["users", "משתמשים"], ["schedule", "לוח זמנים"], ["history", "היסטוריה"]].map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: "8px", fontSize: 13, borderRadius: 8,
            border: tab === t ? "0.5px solid #ddd" : "none",
            background: tab === t ? "white" : "transparent",
            color: tab === t ? "#111" : "#666",
            fontWeight: tab === t ? 500 : 400, cursor: "pointer", fontFamily: "inherit"
          }}>{label}</button>
        ))}
      </div>

      {tab === "users" && (
        <>
          {/* Debug info */}
          <div style={{ fontSize: 11, color: "#aaa", marginBottom: 8 }}>
            סה"כ משתמשים: {allUsers.length} | ממתינים: {pendingUsers.length} | פעילים: {activeUsers.length}
          </div>

          {/* Pending */}
          {pendingUsers.length > 0 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 500, color: "#BA7517", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>
                ממתינים לאישור ({pendingUsers.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: "1.25rem" }}>
                {pendingUsers.map((u, i) => (
                  <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#FAEEDA", border: "0.5px solid #FAC775", borderRadius: 8 }}>
                    <Avatar name={u.name} photo={u.photo} index={i} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{u.name}</div>
                      <div style={{ fontSize: 12, color: "#888" }}>{u.email}</div>
                    </div>
                    <button onClick={() => handleApprove(u.id, u.name)}
                      style={{ fontSize: 12, padding: "4px 12px", borderRadius: 8, border: "0.5px solid #9FE1CB", background: "#E1F5EE", color: "#085041", cursor: "pointer" }}>
                      אשר
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {pendingUsers.length === 0 && activeUsers.length === 0 && (
            <div style={{ textAlign: "center", color: "#aaa", fontSize: 13, padding: "2rem" }}>
              אין משתמשים עדיין
            </div>
          )}

          {/* Active */}
          {activeUsers.length > 0 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 500, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>
                חברי משפחה פעילים
              </div>
              <div style={{ background: "#f5f5f3", borderRadius: 12, padding: "0.75rem" }}>
                {activeUsers.map((u, i) => {
                  const isCurrent = u.id === settings?.currentTurnUid;
                  return (
                    <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: i < activeUsers.length - 1 ? "0.5px solid #e0e0e0" : "none" }}>
                      <Avatar name={u.name} photo={u.photo} index={i} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, color: "#111" }}>{u.name}{isCurrent ? " ← עכשיו" : ""}</div>
                        <div style={{ fontSize: 12, color: "#888" }}>{u.email}</div>
                      </div>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
                        {u.canSkip ? (
                          <>
                            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: "#CECBF6", color: "#3C3489", fontWeight: 500 }}>דילוג</span>
                            <button onClick={() => { revokeSkip(u.id); showToast("בוטל"); }}
                              style={{ fontSize: 12, padding: "3px 8px", borderRadius: 8, border: "0.5px solid #F09595", background: "#FCEBEB", color: "#A32D2D", cursor: "pointer" }}>בטל</button>
                          </>
                        ) : (
                          <button onClick={() => { grantSkip(u.id); showToast("ניתן דילוג ל" + u.name); }}
                            style={{ fontSize: 12, padding: "3px 8px", borderRadius: 8, border: "0.5px solid #FAC775", background: "#FAEEDA", color: "#633806", cursor: "pointer" }}>תן דילוג</button>
                        )}
                        <button onClick={() => { markDone(u.id); showToast("בוצע עבור " + u.name); }}
                          style={{ fontSize: 12, padding: "3px 8px", borderRadius: 8, border: "0.5px solid #9FE1CB", background: "#E1F5EE", color: "#085041", cursor: "pointer" }}>בוצע</button>
                        <button onClick={() => { setTurn(u.id); showToast("תור הועבר ל" + u.name); }}
                          style={{ fontSize: 12, padding: "3px 8px", borderRadius: 8, border: "0.5px solid #ddd", background: "white", color: "#555", cursor: "pointer" }}>קבע תור</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {tab === "schedule" && (
        <div style={{ background: "#f5f5f3", borderRadius: 12, padding: "1rem" }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>קבע תאריך לתורנות הבאה</div>
          <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>
            תורנות נוכחית: <strong>{activeUsers.find(u => u.id === settings?.currentTurnUid)?.name || "—"}</strong>
          </div>
          {settings?.nextDutyDate && (
            <div style={{ fontSize: 13, color: "#0F6E56", marginBottom: 12, background: "#E1F5EE", padding: "8px 12px", borderRadius: 8 }}>
              📅 {new Date(settings.nextDutyDate).toLocaleString("he-IL")}
            </div>
          )}
          <label style={{ fontSize: 13, color: "#666" }}>
            תאריך ושעה
            <input type="datetime-local" value={dutyDate} onChange={e => setDutyDate(e.target.value)}
              style={{ display: "block", width: "100%", marginTop: 4, padding: "8px 10px", borderRadius: 8, border: "0.5px solid #ddd", background: "white", fontSize: 14, fontFamily: "inherit" }} />
          </label>
          <button onClick={handleSetDate} style={{ marginTop: 12, width: "100%", padding: "11px", borderRadius: 8, background: "#1D9E75", color: "white", border: "none", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
            שמור ושלח התראה
          </button>
        </div>
      )}

      {tab === "history" && (
        <>
          <div style={{ fontSize: 11, fontWeight: 500, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>פעילות אחרונה</div>
          {history.length === 0 && <div style={{ textAlign: "center", color: "#aaa", fontSize: 13, padding: "2rem" }}>אין היסטוריה עדיין</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {history.map((h, i) => {
              const uIdx = activeUsers.findIndex(x => x.id === h.userId);
              return (
                <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "white", border: "0.5px solid #e0e0e0", borderRadius: 8 }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, background: h.type === "skip" ? "#FAEEDA" : "#E1F5EE", border: `0.5px solid ${h.type === "skip" ? "#FAC775" : "#9FE1CB"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: h.type === "skip" ? "#633806" : "#085041" }}>
                    {h.type === "skip" ? "↷" : "✓"}
                  </div>
                  <Avatar name={h.userName} photo={h.userPhoto} index={uIdx >= 0 ? uIdx : i} size={28} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "#111" }}>{h.userName} — {h.type === "skip" ? "דילג" : "ביצע תורנות"}</div>
                    <div style={{ fontSize: 12, color: "#888" }}>{h.createdAt?.toDate?.().toLocaleString("he-IL") || ""}</div>
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
