import { useState, useEffect, useCallback } from "react";
import * as db from "../db";

const SPECIES = {
  apple: { name: "Apple", emoji: "🍎" },
  rowan: { name: "Rowan", emoji: "🌸" },
  hazel: { name: "Hazel", emoji: "🌰" },
  fieldmaple: { name: "Field Maple", emoji: "🍁" },
  holly: { name: "Holly", emoji: "🎄" },
  silverbirch: { name: "Silver Birch", emoji: "🌲" },
  hornbeam: { name: "Hornbeam", emoji: "🌳" },
  crabapple: { name: "Crab Apple", emoji: "🍏" },
  amelanchier: { name: "Amelanchier", emoji: "🫐" },
  lombardy: { name: "Lombardy Poplar", emoji: "🏛️" },
};

function computeState(tree) {
  const stats = [tree.h2o, tree.light, tree.soil, tree.bio, tree.clean];
  const minStat = Math.min(...stats);
  const countBelow30 = stats.filter((v) => v < 30).length;
  if (stats.every((v) => v <= 2)) return "Dead";
  if (tree.fungal) return "Fungal";
  if (tree.infested) return "Infested";
  if (tree.clean < 25) return "Polluted";
  if (minStat < 20 || countBelow30 >= 2) return "Withering";
  if (minStat < 40) return "Stressed";
  if (stats.every((v) => v >= 80)) return "Thriving";
  if (stats.every((v) => v >= 60)) return "Healthy";
  return "Okay";
}

const STATE_COLORS = {
  Thriving: "#2D9E5C", Healthy: "#4A9E6F", Okay: "#B5A642",
  Stressed: "#D4783A", Withering: "#C24D2C", Dead: "#5A5A5A",
  Dormant: "#5B9FBF", Infested: "#8B6914", Fungal: "#7A5C8A", Polluted: "#6B7A8D",
};

export default function TreesManager({ schoolId }) {
  const [trees, setTrees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    db.listTrees(schoolId).then((t) => {
      setTrees(t);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [schoolId]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (species) => {
    try {
      await db.createTreeForSchool(schoolId, species);
      setShowCreate(false);
      load();
    } catch { /* ignore */ }
  };

  const handleViewDetail = async (tree) => {
    setDetailLoading(true);
    setDetail(null);
    try {
      const d = await db.getTreeDetails(tree.id);
      setDetail(d);
    } catch { /* ignore */ }
    setDetailLoading(false);
  };

  const handleDelete = async (treeId) => {
    if (!confirm("Delete this tree? This cannot be undone.")) return;
    try {
      await db.deleteTree(treeId);
      setDetail(null);
      load();
    } catch { /* ignore */ }
  };

  const S = {
    btn: (bg = "#1A3C2A") => ({ background: bg, color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }),
    smallBtn: (bg = "#E8F5E9", color = "#2D6A4F") => ({ background: bg, color, border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }),
  };

  if (detail) {
    const t = detail.tree;
    const sp = SPECIES[t.species] || { name: t.species, emoji: "🌳" };
    const treeState = computeState(t);
    const stColor = STATE_COLORS[treeState] || "#888";
    const statItems = [
      { label: "Water", emoji: "💧", value: t.h2o },
      { label: "Light", emoji: "☀️", value: t.light },
      { label: "Soil", emoji: "🌱", value: t.soil },
      { label: "Bio", emoji: "🦋", value: t.bio },
      { label: "Clean", emoji: "✨", value: t.clean },
    ];

    return (
      <div>
        <button onClick={() => setDetail(null)} style={{ background: "none", border: "none", color: "#2D6A4F", fontSize: 14, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 16, display: "flex", alignItems: "center", gap: 4 }}>
          ← Back to Trees
        </button>
        <div style={{ background: "white", borderRadius: 14, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "#1A3C2A" }}>
                {sp.emoji} {sp.name}
              </h2>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ background: t.status === "assigned" ? "#FFF3E0" : t.status === "available" ? "#E8F5E9" : "#F5E8E8", color: t.status === "assigned" ? "#E65100" : t.status === "available" ? "#2D6A4F" : "#C24D2C", borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>
                  {t.status}
                </span>
                <span style={{ background: stColor + "22", color: stColor, borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>
                  {treeState}
                </span>
              </div>
            </div>
            <button onClick={() => handleDelete(t.id)} style={S.smallBtn("#FDE8E0", "#C24D2C")}>Delete Tree</button>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#666", marginBottom: 8 }}>Current Keeper</div>
            <div style={{ fontSize: 15, color: "#333" }}>{t.keeper ? `${t.keeper.name} (${t.keeper.username})` : "None — available in pool"}</div>
          </div>

          <div style={{ fontWeight: 700, fontSize: 13, color: "#666", marginBottom: 8 }}>Stats</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 20 }}>
            {statItems.map((s) => (
              <div key={s.label} style={{ background: "#F8FAFB", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 18 }}>{s.emoji}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: s.value < 30 ? "#C24D2C" : s.value < 60 ? "#B5A642" : "#2D6A4F" }}>{s.value}</div>
                <div style={{ fontSize: 10, color: "#888", fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {t.ring_history && t.ring_history.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#666", marginBottom: 8 }}>Ring History</div>
              <div style={{ display: "flex", gap: 4 }}>
                {t.ring_history.map((color, i) => (
                  <div key={i} style={{ width: 20, height: 20, borderRadius: "50%", background: color === "gold" ? "#FFD700" : "#7ECC5F", border: `2px solid ${color === "gold" ? "#FFC000" : "#5C9E47"}` }} title={`Day ${i + 1}: ${color}`} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ background: "white", borderRadius: 14, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: 16 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "#1A3C2A" }}>🔗 Care Chain ({detail.chain.length})</h3>
          {detail.chain.length === 0 ? (
            <div style={{ color: "#888", fontSize: 14 }}>No keepers yet</div>
          ) : (
            detail.chain.map((c, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #4A9E6F, #1A3C2A)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 11, flexShrink: 0 }}>
                  {c.initials || (c.name || "?").slice(0, 2).toUpperCase()}
                </div>
                <div style={{ background: "#F8FAFB", borderRadius: 10, padding: "8px 12px", flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#2D6A4F" }}>{c.name || c.initials}</div>
                  <div style={{ color: "#555", fontSize: 13 }}>{c.note}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ background: "white", borderRadius: 14, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "#1A3C2A" }}>Session History ({detail.sessions.length})</h3>
          {detail.sessions.length === 0 ? (
            <div style={{ color: "#888", fontSize: 14 }}>No sessions yet</div>
          ) : (
            detail.sessions.map((s, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < detail.sessions.length - 1 ? "1px solid #F0F2F0" : "none" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#333" }}>{s.kid?.name || "Unknown"}</div>
                  <div style={{ fontSize: 12, color: "#888" }}>{new Date(s.started_at).toLocaleDateString()} — {s.status}</div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {(s.badges_earned || []).map((b, j) => (
                    <span key={j} style={{ fontSize: 16 }} title={b}>{b === "water_wise" ? "💧" : b === "shade_hero" ? "⛱️" : b === "storm_shield" ? "🌪️" : b === "pollinator_pal" ? "🐝" : b === "litter_lifter" ? "♻️" : b === "compost_captain" ? "🌱" : b === "kindness_courier" ? "💌" : "🏆"}</span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1A3C2A", margin: "0 0 4px" }}>Trees</h1>
          <p style={{ color: "#888", fontSize: 14, margin: 0 }}>{trees.length} trees in pool</p>
        </div>
        <button onClick={() => setShowCreate(true)} style={S.btn()}>+ Create Tree</button>
      </div>

      {loading ? (
        <div style={{ color: "#888", fontSize: 14, padding: 32, textAlign: "center" }}>Loading...</div>
      ) : trees.length === 0 ? (
        <div style={{ background: "white", borderRadius: 14, padding: 40, textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🌳</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#333", marginBottom: 4 }}>No trees yet</div>
          <div style={{ color: "#888", fontSize: 14 }}>Click "Create Tree" to add trees to the pool.</div>
        </div>
      ) : (
        <div style={{ background: "white", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#F8FAFB", borderBottom: "1px solid #E8ECE8" }}>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "#666", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Species</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "#666", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Status</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "#666", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Keeper</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "#666", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Health</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "#666", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Day</th>
                <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: "#666", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {trees.map((tree) => {
                const sp = SPECIES[tree.species] || { name: tree.species, emoji: "🌳" };
                const treeState = computeState(tree);
                const stColor = STATE_COLORS[treeState] || "#888";
                const currentDay = tree.assigned_at
                  ? Math.floor((Date.now() - new Date(tree.assigned_at).getTime()) / 86400000) + 1
                  : "—";
                return (
                  <tr key={tree.id} style={{ borderBottom: "1px solid #F0F2F0", cursor: "pointer" }} onClick={() => handleViewDetail(tree)}>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "#333" }}>{sp.emoji} {sp.name}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ background: tree.status === "assigned" ? "#FFF3E0" : tree.status === "available" ? "#E8F5E9" : "#F5E8E8", color: tree.status === "assigned" ? "#E65100" : tree.status === "available" ? "#2D6A4F" : "#C24D2C", borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>
                        {tree.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#666" }}>{tree.keeper?.name || "—"}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ color: stColor, fontWeight: 600 }}>{treeState}</span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#666" }}>{currentDay}</td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => handleViewDetail(tree)} style={S.smallBtn()}>View</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowCreate(false)}>
          <div style={{ background: "white", borderRadius: 16, padding: 24, width: "100%", maxWidth: 480, boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 800, color: "#1A3C2A" }}>Create Tree</h3>
            <p style={{ color: "#888", fontSize: 13, margin: "0 0 16px" }}>Pick a species. The tree will be added to the pool for auto-assignment.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
              {Object.entries(SPECIES).map(([key, sp]) => (
                <button key={key} onClick={() => handleCreate(key)} style={{ background: "#F8FAFB", border: "1.5px solid #E0E8DC", borderRadius: 12, padding: "12px 4px", cursor: "pointer", textAlign: "center", transition: "all 0.15s" }}>
                  <div style={{ fontSize: 24 }}>{sp.emoji}</div>
                  <div style={{ fontSize: 10, color: "#333", fontWeight: 700, marginTop: 4 }}>{sp.name}</div>
                </button>
              ))}
            </div>
            <div style={{ textAlign: "right", marginTop: 16 }}>
              <button onClick={() => setShowCreate(false)} style={S.smallBtn("#F0F0F0", "#666")}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {detailLoading && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "white", borderRadius: 14, padding: "24px 32px", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
            <div style={{ color: "#888", fontSize: 14 }}>Loading tree details...</div>
          </div>
        </div>
      )}
    </div>
  );
}
