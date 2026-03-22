import React from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import PendingPage from "./pages/PendingPage";
import HomeScreen from "./pages/HomeScreen";
import AdminScreen from "./pages/AdminScreen";

function AppRouter() {
  const { user, profile, loading } = useAuth();

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#888", direction: "rtl" }}>
      טוען...
    </div>
  );

  if (!user) return <LoginPage />;
  if (!profile || profile.role === "pending") return <PendingPage />;
  if (profile.role === "admin") return <AdminScreen />;
  return <HomeScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
