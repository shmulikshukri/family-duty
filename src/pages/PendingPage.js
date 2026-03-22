import React from "react";
import { useAuth } from "../contexts/AuthContext";

export default function PendingPage() {
  const { user, logout } = useAuth();
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", direction: "rtl", padding: "1rem",
      background: "#f8faf9"
    }}>
      <div style={{
        background: "white", borderRadius: 16, padding: "2rem",
        border: "0.5px solid #e0e0e0", maxWidth: 360, width: "100%", textAlign: "center"
      }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
        <h2 style={{ fontSize: 18, fontWeight: 500, marginBottom: 8 }}>ממתין לאישור</h2>
        <p style={{ fontSize: 14, color: "#666", lineHeight: 1.6, marginBottom: 20 }}>
          החשבון שלך ({user?.email}) נרשם בהצלחה.<br />
          המנהל צריך לאשר אותך ולהוסיף אותך לרשימת התורנויות.
        </p>
        <button onClick={logout} style={{
          fontSize: 13, padding: "8px 16px", borderRadius: 8,
          border: "0.5px solid #ddd", background: "white", cursor: "pointer", color: "#666"
        }}>
          התנתק
        </button>
      </div>
    </div>
  );
}
