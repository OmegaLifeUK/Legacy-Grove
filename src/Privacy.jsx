import { useNavigate } from "react-router-dom";
import logoImg from "/logo.png";

export default function Privacy() {
  const navigate = useNavigate();

  const S = {
    page: { fontFamily: "'Segoe UI', 'Nunito', system-ui, sans-serif", maxWidth: 600, margin: "0 auto", minHeight: "100vh", background: "#F4F8F2", padding: "0 0 40px" },
    header: { background: "linear-gradient(180deg, #1A4A2E 0%, #2D7A4A 100%)", padding: "32px 24px", textAlign: "center", color: "white" },
    card: { background: "white", borderRadius: 16, margin: "16px 16px", padding: "20px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" },
    h2: { fontSize: 18, fontWeight: 800, color: "#1A3C2A", margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 },
    li: { fontSize: 15, color: "#444", lineHeight: 1.7, marginBottom: 4 },
    back: { background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 10, padding: "8px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 16 },
  };

  return (
    <div style={S.page}>
      <div style={S.header}>
        <img src={logoImg} alt="Legacy Grove" style={{ width: 64, height: 64, marginBottom: 10 }} />
        <h1 style={{ fontSize: 24, fontWeight: 900, margin: "0 0 4px" }}>How We Look After Your Information</h1>
        <p style={{ fontSize: 14, opacity: 0.7, margin: 0 }}>Legacy Grove · Privacy Notice</p>
        <button onClick={() => navigate(-1)} style={S.back}>← Go Back</button>
      </div>

      <div style={S.card}>
        <h2 style={S.h2}>What we save</h2>
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li style={S.li}>Your <strong>name</strong> and <strong>username</strong> (so you can log in)</li>
          <li style={S.li}>Your <strong>password</strong> (we scramble it so nobody can read it — not even us!)</li>
          <li style={S.li}>The things you do in the game (watering, feeding, caring for your tree)</li>
          <li style={S.li}>The kind messages you write when you pass on your tree</li>
        </ul>
      </div>

      <div style={S.card}>
        <h2 style={S.h2}>What we NEVER do</h2>
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li style={S.li}>We <strong>never share</strong> your information with anyone outside your school</li>
          <li style={S.li}>We <strong>never show ads</strong></li>
          <li style={S.li}>We <strong>never track</strong> where you are</li>
          <li style={S.li}>We <strong>never send</strong> you emails</li>
          <li style={S.li}>We <strong>never use</strong> cookies or tracking</li>
        </ul>
      </div>

      <div style={S.card}>
        <h2 style={S.h2}>Who can see your information</h2>
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li style={S.li}><strong>You</strong> can see your own tree and messages</li>
          <li style={S.li}>Your <strong>teacher</strong> can see everyone's trees and messages</li>
          <li style={S.li}><strong>Nobody else</strong> can see anything</li>
        </ul>
      </div>

      <div style={S.card}>
        <h2 style={S.h2}>Want your information deleted?</h2>
        <p style={S.li}>Ask your teacher — they can remove everything about you from Legacy Grove. When your data is deleted, the kind messages you left on trees will still be there, but your name will be replaced with "A former keeper" so nobody knows it was you.</p>
      </div>

      <div style={S.card}>
        <h2 style={S.h2}>Questions?</h2>
        <p style={S.li}>Ask your teacher or a grown-up you trust. They can help you understand how your information is used.</p>
      </div>

      <div style={{ ...S.card, background: "#E8F5E9", borderLeft: "4px solid #2D6A4F" }}>
        <h2 style={{ ...S.h2, fontSize: 15 }}>For teachers and parents</h2>
        <p style={{ fontSize: 13, color: "#555", lineHeight: 1.6, margin: 0 }}>
          Legacy Grove processes minimal data under the school's lawful basis as an educational tool. No data is shared with third parties. No analytics, profiling, or marketing is performed. The school/teacher acts as data controller; Legacy Grove is the data processor. Teachers can export or delete any child's data from the admin dashboard.
        </p>
      </div>
    </div>
  );
}
