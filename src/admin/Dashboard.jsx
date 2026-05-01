import { useState, useEffect } from "react";
import * as db from "../db";

export default function Dashboard({ schoolId, schoolName }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.getSchoolStats(schoolId).then((s) => {
      setStats(s);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [schoolId]);

  const cards = stats ? [
    { label: "Active Kids", value: stats.totalKids, icon: "👧", color: "#4A9E6F" },
    { label: "Total Trees", value: stats.totalTrees, icon: "🌳", color: "#2D6A4F" },
    { label: "Trees In Care", value: stats.treesInCare, icon: "🌿", color: "#B5A642" },
    { label: "Trees Available", value: stats.treesAvailable, icon: "🌱", color: "#52D273" },
    { label: "Chain Messages", value: stats.chainEntries, icon: "🔗", color: "#7A8CAA" },
  ] : [];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1A3C2A", margin: "0 0 4px" }}>Dashboard</h1>
        <p style={{ color: "#888", fontSize: 14, margin: 0 }}>{schoolName} Overview</p>
      </div>

      {loading ? (
        <div style={{ color: "#888", fontSize: 14, padding: 32, textAlign: "center" }}>Loading stats...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
          {cards.map((c) => (
            <div key={c.label} style={{ background: "white", borderRadius: 14, padding: "20px 18px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", borderLeft: `4px solid ${c.color}` }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{c.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#1A3C2A" }}>{c.value}</div>
              <div style={{ fontSize: 13, color: "#888", fontWeight: 600, marginTop: 4 }}>{c.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
