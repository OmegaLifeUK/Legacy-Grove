import { useState, useEffect } from "react";
import { Routes, Route, NavLink, useNavigate } from "react-router-dom";
import * as db from "../db";
import AdminLogin from "./AdminLogin";
import Dashboard from "./Dashboard";
import KidsManager from "./KidsManager";
import TreesManager from "./TreesManager";
import logoImg from "/logo.png";

export default function AdminApp() {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const adminId = localStorage.getItem("lg_admin_id");
    if (!adminId) { setLoading(false); return; }
    db.getAdmin(adminId).then((a) => {
      if (a) setAdmin(a);
      else {
        localStorage.removeItem("lg_admin_id");
        localStorage.removeItem("lg_admin_school_id");
      }
      setLoading(false);
    }).catch(() => {
      localStorage.removeItem("lg_admin_id");
      localStorage.removeItem("lg_admin_school_id");
      setLoading(false);
    });
  }, []);

  const handleLogin = (adminData) => {
    localStorage.setItem("lg_admin_id", adminData.id);
    localStorage.setItem("lg_admin_school_id", adminData.school_id);
    setAdmin(adminData);
    navigate("/admin");
  };

  const handleLogout = () => {
    localStorage.removeItem("lg_admin_id");
    localStorage.removeItem("lg_admin_school_id");
    setAdmin(null);
    navigate("/admin");
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFB", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#888", fontSize: 14 }}>Loading...</div>
      </div>
    );
  }

  if (!admin) return <AdminLogin onLogin={handleLogin} />;

  const schoolName = admin.schools?.name || "School";
  const schoolId = admin.school_id;

  const navItems = [
    { to: "/admin", label: "Dashboard", icon: "📊", end: true },
    { to: "/admin/kids", label: "Kids", icon: "👧" },
    { to: "/admin/trees", label: "Trees", icon: "🌳" },
  ];

  const linkStyle = (isActive) => ({
    display: "flex", alignItems: "center", gap: 10,
    padding: "10px 16px", borderRadius: 10,
    textDecoration: "none", fontSize: 14, fontWeight: 600,
    color: isActive ? "white" : "rgba(255,255,255,0.6)",
    background: isActive ? "rgba(255,255,255,0.15)" : "transparent",
    transition: "all 0.15s",
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Segoe UI', 'Nunito', system-ui, sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #F8FAFB; }
        input:focus { border-color: #2D6A4F !important; box-shadow: 0 0 0 3px rgba(45,106,79,0.15) !important; }
      `}</style>

      {/* Sidebar */}
      <aside style={{ width: 220, background: "#1A3C2A", color: "white", padding: "24px 12px", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 4px", marginBottom: 32 }}>
          <img src={logoImg} alt="Legacy Grove" style={{ width: 36, height: 36, borderRadius: 6 }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: -0.3 }}>Legacy Grove</div>
            <div style={{ fontSize: 10, opacity: 0.5, fontWeight: 600 }}>ADMIN</div>
          </div>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} style={({ isActive }) => linkStyle(isActive)}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 10, background: "rgba(255,255,255,0.08)", border: "none", color: "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%", textAlign: "left" }}>
          <span style={{ fontSize: 18 }}>🚪</span>
          <span>Log Out</span>
        </button>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <header style={{ background: "white", borderBottom: "1px solid #E8ECE8", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#1A3C2A" }}>{schoolName}</div>
            <div style={{ fontSize: 12, color: "#888" }}>Code: {admin.schools?.code || "—"}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #2D6A4F, #1A3C2A)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 12 }}>
              {(admin.display_name || "A").charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#333" }}>{admin.display_name}</span>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, padding: 24, overflowY: "auto" }}>
          <Routes>
            <Route index element={<Dashboard schoolId={schoolId} schoolName={schoolName} />} />
            <Route path="kids" element={<KidsManager schoolId={schoolId} />} />
            <Route path="trees" element={<TreesManager schoolId={schoolId} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
