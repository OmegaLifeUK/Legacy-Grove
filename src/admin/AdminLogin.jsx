import { useState } from "react";
import * as db from "../db";
import logoImg from "/logo.png";

export default function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const admin = await db.authenticateAdmin(email, password);
      setPassword("");
      if (!admin) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }
      onLogin(admin);
    } catch {
      setError("Something went wrong. Try again.");
      setPassword("");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #1A3C2A 0%, #2D5A3F 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <form onSubmit={handleSubmit} style={{ background: "white", borderRadius: 20, padding: "40px 32px", width: "100%", maxWidth: 400, boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src={logoImg} alt="Legacy Grove" style={{ width: 64, height: 64, marginBottom: 12 }} />
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1A3C2A", margin: "0 0 4px" }}>Legacy Grove</h1>
          <p style={{ color: "#888", fontSize: 14, margin: 0 }}>Teacher Dashboard</p>
        </div>

        {error && (
          <div style={{ background: "#FDE8E0", color: "#C24D2C", borderRadius: 10, padding: "10px 14px", fontSize: 14, fontWeight: 600, marginBottom: 16, textAlign: "center" }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontWeight: 600, fontSize: 13, color: "#333", display: "block", marginBottom: 6 }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teacher@school.com"
            autoComplete="email"
            style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid #E0E8DC", fontSize: 15, boxSizing: "border-box", outline: "none" }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontWeight: 600, fontSize: 13, color: "#333", display: "block", marginBottom: 6 }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid #E0E8DC", fontSize: 15, boxSizing: "border-box", outline: "none" }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ width: "100%", padding: "14px", background: "#1A3C2A", color: "white", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}
        >
          {loading ? "Logging in..." : "Log In"}
        </button>
      </form>
    </div>
  );
}
