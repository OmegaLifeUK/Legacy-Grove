import { useState, useEffect, useCallback } from "react";
import * as db from "../db";

export default function KidsManager({ schoolId }) {
  const [kids, setKids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: "", username: "", password: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteInfo, setDeleteInfo] = useState(null);
  const [inactiveKids, setInactiveKids] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    db.listKids(schoolId).then((k) => {
      setKids(k);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [schoolId]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setForm({ name: "", username: "", password: "" });
    setError("");
    setModal("add");
  };

  const openEdit = (kid) => {
    setSelected(kid);
    setForm({ name: kid.name, username: kid.username, password: "" });
    setError("");
    setModal("edit");
  };

  const openResetPw = (kid) => {
    setSelected(kid);
    setForm({ name: "", username: "", password: "" });
    setError("");
    setModal("resetpw");
  };

  const handleAdd = async () => {
    if (!form.name.trim()) { setError("Name is required"); return; }
    if (!form.username.trim()) { setError("Username is required"); return; }
    if (form.username.trim().includes(" ")) { setError("Username cannot contain spaces"); return; }
    if (form.password.length < 4) { setError("Password must be at least 4 characters"); return; }
    setSaving(true);
    setError("");
    try {
      await db.createKid(schoolId, form.name.trim(), form.username.trim(), form.password);
      setModal(null);
      load();
    } catch (err) {
      if (err?.message?.includes("duplicate") || err?.code === "23505") {
        setError("Username already taken");
      } else {
        setError("Failed to create kid");
      }
    }
    setSaving(false);
  };

  const handleEdit = async () => {
    if (!form.name.trim()) { setError("Name is required"); return; }
    if (!form.username.trim()) { setError("Username is required"); return; }
    if (form.username.trim().includes(" ")) { setError("Username cannot contain spaces"); return; }
    setSaving(true);
    setError("");
    try {
      await db.updateKid(selected.id, { name: form.name.trim(), username: form.username.trim() });
      setModal(null);
      load();
    } catch (err) {
      if (err?.message?.includes("duplicate") || err?.code === "23505") {
        setError("Username already taken");
      } else {
        setError("Failed to update kid");
      }
    }
    setSaving(false);
  };

  const handleResetPw = async () => {
    if (form.password.length < 4) { setError("Password must be at least 4 characters"); return; }
    setSaving(true);
    setError("");
    try {
      await db.resetKidPassword(selected.id, form.password);
      setModal(null);
    } catch {
      setError("Failed to reset password");
    }
    setSaving(false);
  };

  const handleToggle = async (kid) => {
    if (!confirm(`${kid.is_active ? "Deactivate" : "Activate"} ${kid.name}?`)) return;
    try {
      await db.toggleKidActive(kid.id, !kid.is_active);
      load();
    } catch { /* ignore */ }
  };

  const handleExport = async (kid) => {
    try {
      const data = await db.exportKidData(kid.id);
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `${kid.username}_data_export_${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to export data");
    }
  };

  const openDeleteAll = async (kid) => {
    setSelected(kid);
    setError("");
    setDeleteInfo(null);
    setModal("deleteall");
    try {
      const counts = await db.getKidDataCounts(kid.id);
      setDeleteInfo(counts);
    } catch {
      setDeleteInfo({ sessions: 0, chainMessages: 0, actions: 0 });
    }
  };

  const handleDeleteAll = async () => {
    setSaving(true);
    setError("");
    try {
      await db.deleteKidDataFull(selected.id);
      setModal(null);
      setDeleteInfo(null);
      load();
    } catch {
      setError("Failed to delete data");
    }
    setSaving(false);
  };

  const handleCleanup = async () => {
    setModal("cleanup");
    setInactiveKids(null);
    setError("");
    try {
      const inactive = await db.getInactiveKids(schoolId, 365);
      setInactiveKids(inactive);
    } catch {
      setInactiveKids([]);
      setError("Failed to load inactive accounts");
    }
  };

  const handleBulkDelete = async () => {
    if (!inactiveKids || inactiveKids.length === 0) return;
    if (!confirm(`Delete all ${inactiveKids.length} inactive accounts? This cannot be undone.`)) return;
    setSaving(true);
    setError("");
    try {
      for (const kid of inactiveKids) {
        await db.deleteKidDataFull(kid.id);
      }
      setModal(null);
      setInactiveKids(null);
      load();
    } catch {
      setError("Some deletions failed");
    }
    setSaving(false);
  };

  const S = {
    btn: (bg = "#1A3C2A") => ({ background: bg, color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }),
    smallBtn: (bg = "#E8F5E9", color = "#2D6A4F") => ({ background: bg, color, border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }),
    input: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #E0E8DC", fontSize: 14, boxSizing: "border-box", outline: "none" },
  };

  const Modal = ({ title, onSubmit, submitLabel, submitColor, children }) => (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => { setModal(null); setDeleteInfo(null); setInactiveKids(null); }}>
      <div style={{ background: "white", borderRadius: 16, padding: "24px", width: "100%", maxWidth: 480, maxHeight: "80vh", overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 800, color: "#1A3C2A" }}>{title}</h3>
        {error && <div style={{ background: "#FDE8E0", color: "#C24D2C", borderRadius: 8, padding: "8px 12px", fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{error}</div>}
        {children}
        <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "flex-end" }}>
          <button onClick={() => { setModal(null); setDeleteInfo(null); setInactiveKids(null); }} style={S.smallBtn("#F0F0F0", "#666")}>Cancel</button>
          {onSubmit && <button onClick={onSubmit} disabled={saving} style={{ ...S.btn(submitColor || "#1A3C2A"), opacity: saving ? 0.6 : 1 }}>{saving ? "Working..." : submitLabel}</button>}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1A3C2A", margin: "0 0 4px" }}>Kids</h1>
          <p style={{ color: "#888", fontSize: 14, margin: 0 }}>{kids.length} students</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleCleanup} style={S.btn("#6B7280")}>Clean Up Old Data</button>
          <button onClick={openAdd} style={S.btn()}>+ Add Kid</button>
        </div>
      </div>

      {loading ? (
        <div style={{ color: "#888", fontSize: 14, padding: 32, textAlign: "center" }}>Loading...</div>
      ) : kids.length === 0 ? (
        <div style={{ background: "white", borderRadius: 14, padding: 40, textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👧</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#333", marginBottom: 4 }}>No kids yet</div>
          <div style={{ color: "#888", fontSize: 14 }}>Click "Add Kid" to create student accounts.</div>
        </div>
      ) : (
        <div style={{ background: "white", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#F8FAFB", borderBottom: "1px solid #E8ECE8" }}>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "#666", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Name</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "#666", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Username</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "#666", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Status</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "#666", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Tree</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "#666", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Last Login</th>
                <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: "#666", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {kids.map((kid) => (
                <tr key={kid.id} style={{ borderBottom: "1px solid #F0F2F0", opacity: kid.is_active ? 1 : 0.5 }}>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: "#333" }}>{kid.name}</td>
                  <td style={{ padding: "12px 16px", color: "#666" }}>{kid.username}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ background: kid.is_active ? "#E8F5E9" : "#F5E8E8", color: kid.is_active ? "#2D6A4F" : "#C24D2C", borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>
                      {kid.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#666" }}>{kid.trees?.species || "—"}</td>
                  <td style={{ padding: "12px 16px", color: "#888", fontSize: 13 }}>
                    {kid.last_login ? new Date(kid.last_login).toLocaleDateString() : "Never"}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 4, justifyContent: "flex-end", flexWrap: "wrap" }}>
                      <button onClick={() => openEdit(kid)} style={S.smallBtn()}>Edit</button>
                      <button onClick={() => openResetPw(kid)} style={S.smallBtn()}>Reset PW</button>
                      <button onClick={() => handleExport(kid)} style={S.smallBtn("#E3F2FD", "#1565C0")}>Export Data</button>
                      <button onClick={() => handleToggle(kid)} style={S.smallBtn(kid.is_active ? "#FFF3E0" : "#E8F5E9", kid.is_active ? "#E65100" : "#2D6A4F")}>
                        {kid.is_active ? "Deactivate" : "Activate"}
                      </button>
                      <button onClick={() => openDeleteAll(kid)} style={S.smallBtn("#FDE8E0", "#C24D2C")}>Delete All Data</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal === "add" && (
        <Modal title="Add Kid" onSubmit={handleAdd} submitLabel="Create">
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 600, fontSize: 13, color: "#333", display: "block", marginBottom: 4 }}>Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Diana Evans" style={S.input} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 600, fontSize: 13, color: "#333", display: "block", marginBottom: 4 }}>Username</label>
            <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="e.g. diana" style={S.input} />
          </div>
          <div>
            <label style={{ fontWeight: 600, fontSize: 13, color: "#333", display: "block", marginBottom: 4 }}>Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 4 characters" style={S.input} />
          </div>
        </Modal>
      )}

      {modal === "edit" && (
        <Modal title={`Edit ${selected?.name}`} onSubmit={handleEdit} submitLabel="Save">
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 600, fontSize: 13, color: "#333", display: "block", marginBottom: 4 }}>Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={S.input} />
          </div>
          <div>
            <label style={{ fontWeight: 600, fontSize: 13, color: "#333", display: "block", marginBottom: 4 }}>Username</label>
            <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} style={S.input} />
          </div>
        </Modal>
      )}

      {modal === "resetpw" && (
        <Modal title={`Reset Password — ${selected?.name}`} onSubmit={handleResetPw} submitLabel="Reset Password">
          <div>
            <label style={{ fontWeight: 600, fontSize: 13, color: "#333", display: "block", marginBottom: 4 }}>New Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 4 characters" style={S.input} />
          </div>
        </Modal>
      )}

      {modal === "deleteall" && selected && (
        <Modal title={`Delete All Data — ${selected.name}`} onSubmit={handleDeleteAll} submitLabel="Delete Everything" submitColor="#C24D2C">
          <div style={{ background: "#FFF3E0", borderRadius: 10, padding: "14px 16px", marginBottom: 16, borderLeft: "4px solid #E65100" }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#E65100", marginBottom: 6 }}>This will permanently delete {selected.name}'s account and all their data.</div>
            <div style={{ fontSize: 13, color: "#8D6E3F" }}>This cannot be undone.</div>
          </div>
          {deleteInfo ? (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#333", marginBottom: 8 }}>Data to be deleted:</div>
              <ul style={{ fontSize: 13, color: "#555", lineHeight: 1.8, margin: 0, paddingLeft: 20 }}>
                <li>Account (name, username, login history)</li>
                <li>{deleteInfo.sessions} care session{deleteInfo.sessions !== 1 ? "s" : ""}</li>
                <li>{deleteInfo.chainMessages} care chain message{deleteInfo.chainMessages !== 1 ? "s" : ""}</li>
                <li>{deleteInfo.actions} action log entr{deleteInfo.actions !== 1 ? "ies" : "y"}</li>
              </ul>
            </div>
          ) : (
            <div style={{ color: "#888", fontSize: 13, marginBottom: 16 }}>Loading data counts...</div>
          )}
          <div style={{ background: "#F0F7FF", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#1565C0" }}>
            Care chain messages will be anonymized (name replaced with "A former keeper") rather than deleted, to preserve the tree's story for other children.
          </div>
        </Modal>
      )}

      {modal === "cleanup" && (
        <Modal
          title="Clean Up Old Data"
          onSubmit={inactiveKids && inactiveKids.length > 0 ? handleBulkDelete : null}
          submitLabel={inactiveKids ? `Delete ${inactiveKids.length} Account${inactiveKids.length !== 1 ? "s" : ""}` : ""}
          submitColor="#C24D2C"
        >
          <p style={{ fontSize: 13, color: "#666", marginBottom: 16, marginTop: 0 }}>
            Find and remove accounts that have been inactive for 365+ days. Care chain messages will be anonymized.
          </p>
          {inactiveKids === null ? (
            <div style={{ color: "#888", fontSize: 13, textAlign: "center", padding: 16 }}>Scanning for inactive accounts...</div>
          ) : inactiveKids.length === 0 ? (
            <div style={{ background: "#E8F5E9", borderRadius: 10, padding: "16px", textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#2D6A4F" }}>All accounts are active</div>
              <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>No accounts inactive for 365+ days.</div>
            </div>
          ) : (
            <div style={{ background: "white", border: "1px solid #E8ECE8", borderRadius: 10, overflow: "hidden" }}>
              {inactiveKids.map((kid) => (
                <div key={kid.id} style={{ padding: "10px 14px", borderBottom: "1px solid #F0F2F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#333" }}>{kid.name}</div>
                    <div style={{ fontSize: 11, color: "#888" }}>@{kid.username} · Last login: {kid.last_login ? new Date(kid.last_login).toLocaleDateString() : "Never"}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
