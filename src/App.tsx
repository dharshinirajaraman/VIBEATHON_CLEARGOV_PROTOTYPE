import { useState, useEffect, useRef } from "react";
import { SCHEMES, CATEGORIES, type Scheme, type SchemeCategory } from "./data/schemes";
import { t, LANGUAGES, type Lang } from "./data/i18n";
import {
  loginUser, registerUser, emailExists,
  saveSession, loadSession, clearSession,
  getApplicationsByUser, getApplications,
  saveApplication, updateApplication, updateUser, getAvailableSchemes, saveCustomScheme,
  getSavedSchemeIds, toggleSavedScheme,
  type StoredUser, type Application, type UploadedDoc,
} from "./lib/storage";
import { verifyDocuments } from "./lib/verification";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function pwStrength(pw: string): { score: number; label: string; color: string } {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (pw.length >= 12) s++;
  const [label, color] =
    s <= 1 ? ["Weak",   "#ef4444"] :
    s <= 2 ? ["Fair",   "#f59e0b"] :
    s <= 3 ? ["Good",   "#3b82f6"] :
             ["Strong", "#22c55e"];
  return { score: s, label, color };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function schemeTitle(lang: Lang, title: string): string {
  const labels: Record<string, Partial<Record<Lang, string>>> = {
    "Academic Excellence Scholarship": { ta: "கல்விச் சிறப்பு உதவித்தொகை", hi: "शैक्षणिक उत्कृष्टता छात्रवृत्ति", te: "విద్యా ప్రతిభ స్కాలర్‌షిప్" },
    "Digital Learning Initiative": { ta: "டிஜிட்டல் கற்றல் திட்டம்", hi: "डिजिटल लर्निंग पहल", te: "డిజిటల్ లెర్నింగ్ కార్యక్రమం" },
    "Student Achievement Scheme": { ta: "மாணவர் சாதனைத் திட்டம்", hi: "छात्र उपलब्धि योजना", te: "విద్యార్థి సాధన పథకం" },
    "Pradhan Mantri Awas Yojana (Urban)": { ta: "பிரதம மந்திரி ஆவாஸ் யோஜனா (நகர்ப்புறம்)", hi: "प्रधानमंत्री आवास योजना (शहरी)", te: "ప్రధాన మంత్రి ఆవాస్ యోజన (పట్టణ)" },
    "Pradhan Mantri Gramin Awaas Yojana": { ta: "பிரதம மந்திரி கிராமின் ஆவாஸ் யோஜனா", hi: "प्रधानमंत्री ग्रामीण आवास योजना", te: "ప్రధాన మంత్రి గ్రామీణ్ ఆవాస్ యోజన" },
    "Affordable Rental Housing Complexes": { ta: "மலிவு வாடகை வீட்டு வளாகங்கள்", hi: "किफायती किराये के आवास परिसर", te: "అందుబాటు అద్దె గృహ సముదాయాలు" },
    "Pradhan Mantri Kaushal Vikas Yojana": { ta: "பிரதம மந்திரி திறன் மேம்பாட்டு யோஜனா", hi: "प्रधानमंत्री कौशल विकास योजना", te: "ప్రధాన మంత్రి కౌశల్ వికాస్ యోజన" },
    "Startup India Seed Fund Scheme": { ta: "ஸ்டார்ட்அப் இந்தியா விதை நிதித் திட்டம்", hi: "स्टार्टअप इंडिया सीड फंड योजना", te: "స్టార్టప్ ఇండియా సీడ్ ఫండ్ పథకం" },
    "Ayushman Bharat PM-JAY": { ta: "ஆயுஷ்மான் பாரத் PM-JAY", hi: "आयुष्मान भारत PM-JAY", te: "ఆయుష్మాన్ భారత్ PM-JAY" },
    "Beti Bachao Beti Padhao": { ta: "பெண் குழந்தையை காப்போம், படிக்க வைப்போம்", hi: "बेटी बचाओ बेटी पढ़ाओ", te: "బేటీ బచావో బేటీ పడావో" },
    "PM Kisan Samman Nidhi": { ta: "பிரதம மந்திரி கிசான் சம்மான் நிதி", hi: "प्रधानमंत्री किसान सम्मान निधि", te: "ప్రధాన మంత్రి కిసాన్ సమ్మాన్ నిధి" },
    "Indira Gandhi National Old Age Pension": { ta: "இந்திரா காந்தி தேசிய முதியோர் ஓய்வூதியம்", hi: "इंदिरा गांधी राष्ट्रीय वृद्धावस्था पेंशन", te: "ఇందిరా గాంధీ జాతీయ వృద్ధాప్య పింఛను" },
  };
  return labels[title]?.[lang] ?? title;
}

// ─────────────────────────────────────────────
// AnimNum
// ─────────────────────────────────────────────
function AnimNum({ target, duration = 1200 }: { target: number; duration?: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let cur = 0;
    const step = Math.ceil(target / (duration / 16));
    const iv = setInterval(() => {
      cur = Math.min(cur + step, target);
      setVal(cur);
      if (cur >= target) clearInterval(iv);
    }, 16);
    return () => clearInterval(iv);
  }, [target, duration]);
  return <>{val.toLocaleString("en-IN")}</>;
}

// ─────────────────────────────────────────────
// Status config
// ─────────────────────────────────────────────
const STATUS_CFG: Record<string, { bg: string; text: string; dot: string; tkey: string }> = {
  pending_ai:       { bg: "#fef3c7", text: "#92400e", dot: "#f59e0b", tkey: "myapp_status_pending" },
  ai_pass:          { bg: "#d1fae5", text: "#065f46", dot: "#10b981", tkey: "myapp_status_ai_pass" },
  ai_flagged:       { bg: "#fee2e2", text: "#991b1b", dot: "#ef4444", tkey: "myapp_status_ai_flag" },
  admin_reviewing:  { bg: "#dbeafe", text: "#1e40af", dot: "#3b82f6", tkey: "myapp_status_admin_reviewing" },
  approved:         { bg: "#d1fae5", text: "#065f46", dot: "#10b981", tkey: "myapp_status_approved" },
  rejected:         { bg: "#fee2e2", text: "#991b1b", dot: "#ef4444", tkey: "myapp_status_rejected" },
  more_info:        { bg: "#fef3c7", text: "#92400e", dot: "#f59e0b", tkey: "myapp_status_more_info" },
};

// ─────────────────────────────────────────────
// Aurora background
// ─────────────────────────────────────────────
function AuroraBg() {
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      <div style={{
        position: "absolute", width: "700px", height: "700px", borderRadius: "50%",
        top: "-200px", left: "-150px",
        background: "radial-gradient(circle, rgba(99,102,241,.28) 0%, transparent 70%)",
        animation: "auroraFloat1 14s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", width: "600px", height: "600px", borderRadius: "50%",
        bottom: "-100px", right: "-100px",
        background: "radial-gradient(circle, rgba(139,92,246,.24) 0%, transparent 70%)",
        animation: "auroraFloat2 18s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", width: "400px", height: "400px", borderRadius: "50%",
        top: "40%", left: "40%",
        background: "radial-gradient(circle, rgba(59,130,246,.15) 0%, transparent 70%)",
        animation: "auroraFloat3 22s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "linear-gradient(rgba(79,70,229,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(79,70,229,.04) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }} />
    </div>
  );
}

// ─────────────────────────────────────────────
// StatusBadge
// ─────────────────────────────────────────────
function StatusBadge({ status, lang }: { status: string; lang: Lang }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.pending_ai;
  return (
    <span className="pill" style={{ background: cfg.bg, color: cfg.text }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
      {t(lang, cfg.tkey)}
    </span>
  );
}

// ─────────────────────────────────────────────
// Auth Page
// ─────────────────────────────────────────────
function AuthPage({ onAuth, lang, setLang }: {
  onAuth: (u: StoredUser) => void;
  lang: Lang;
  setLang: (l: Lang) => void;
}) {
  const [view, setView] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const strength = pwStrength(pw);

  function validate(): string {
    if (view === "register" && name.trim().split(" ").filter(Boolean).length < 2)
      return t(lang, "auth_name_err");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return t(lang, "auth_email_err");
    if (view === "register" && emailExists(email)) return t(lang, "auth_email_exists");
    if (pw.length < 8) return t(lang, "auth_pw_err");
    if (view === "register" && pw !== pw2) return t(lang, "auth_pw2_err");
    return "";
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const v = validate();
    if (v) { setErr(v); return; }
    setLoading(true);
    setTimeout(() => {
      if (view === "register") {
        const user = registerUser(name.trim(), email.trim(), pw);
        if (!user) { setErr(t(lang, "auth_email_exists")); setLoading(false); return; }
        setSuccess(t(lang, "auth_success"));
        setTimeout(() => { saveSession(user); onAuth(user); }, 1000);
      } else {
        const user = loginUser(email.trim(), pw);
        if (!user) { setErr(t(lang, "auth_login_err")); setLoading(false); return; }
        saveSession(user);
        onAuth(user);
      }
    }, 600);
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", backgroundImage: "linear-gradient(135deg,rgba(30,27,75,.94),rgba(67,56,202,.86)),url(https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1800&h=1200&fit=crop&auto=format)", backgroundSize: "cover", backgroundPosition: "center", position: "relative" }}>
      <AuroraBg />
      {/* Left decorative panel */}
      <div style={{ display: "none", flex: 1, flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "48px", position: "relative", zIndex: 1 }}
        className="lg:flex lg:flex-col">
        <div className="login-image-collage">
          <img className="login-image-main" src="https://images.unsplash.com/photo-1556761175-b413da4baf72?w=900&h=560&fit=crop&auto=format" alt="People collaborating on community services" />
          <img className="login-image-small login-image-small-one" src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&h=500&fit=crop&auto=format" alt="Digital public access" />
          <img className="login-image-small login-image-small-two" src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=500&h=500&fit=crop&auto=format" alt="Team support" />
        </div>
        <div style={{ animation: "floatCard1 5s ease-in-out infinite", marginBottom: "2rem" }}>
          <div style={{ padding: 24, background: "rgba(255,255,255,.1)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,.2)", borderRadius: 18, maxWidth: 280 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".1em", color: "rgba(255,255,255,.6)", marginBottom: 8 }}>ACTIVE SCHEMES</div>
            <div style={{ fontSize: 36, fontWeight: 700, color: "#fff" }}>{SCHEMES.filter(s => s.status === "open").length}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.7)", marginTop: 4 }}>Open for application</div>
          </div>
        </div>
        <div style={{ animation: "floatCard2 6s ease-in-out infinite" }}>
          <div style={{ padding: 24, background: "rgba(255,255,255,.08)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 18, maxWidth: 280 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".1em", color: "rgba(255,255,255,.6)", marginBottom: 8 }}>TOTAL APPLIED</div>
            <div style={{ fontSize: 36, fontWeight: 700, color: "#c7d2fe" }}>
              {SCHEMES.reduce((a, s) => a + s.appliedCount, 0).toLocaleString("en-IN")}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.7)", marginTop: 4 }}>Citizens served</div>
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: 40 }}>
          <div className="font-display" style={{ fontSize: 32, fontWeight: 700, color: "#fff", letterSpacing: "-.01em", lineHeight: 1.2 }}>
            ClearGov
          </div>
          <div style={{ color: "rgba(255,255,255,.65)", fontSize: 14, marginTop: 8 }}>
            Government Welfare Schemes — Digital Access Platform
          </div>
        </div>
      </div>

      {/* Right: form */}
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", width: "100%", maxWidth: 480, padding: "24px 32px", position: "relative", zIndex: 1, margin: "0 auto" }}>
        {/* Language */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, alignSelf: "flex-end" }}>
          {(Object.keys(LANGUAGES) as Lang[]).map((l) => (
            <button key={l} onClick={() => setLang(l)}
              style={{
                padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: "pointer",
                background: lang === l ? "rgba(255,255,255,.25)" : "rgba(255,255,255,.08)",
                color: lang === l ? "#fff" : "rgba(255,255,255,.55)",
                border: "1px solid rgba(255,255,255,.2)",
              }}>
              {LANGUAGES[l].native}
            </button>
          ))}
        </div>

        <div className="card" style={{ padding: 32, width: "100%", background: "rgba(255,255,255,.97)", borderRadius: 22, animation: "cardEntrance .6s cubic-bezier(.22,.68,0,1.1) both" }}>
          <img className="auth-card-image" src="https://images.unsplash.com/photo-1556761175-4b46a572b786?w=900&h=360&fit=crop&auto=format" alt="ClearGov service team" loading="eager" />
          <div className="font-display" style={{ fontSize: 26, fontWeight: 700, color: "#1e1b4b", textAlign: "center", marginBottom: 4 }}>
            {view === "login" ? t(lang, "auth_login_title") : t(lang, "auth_reg_title")}
          </div>
          <div style={{ fontSize: 13, color: "#64748b", textAlign: "center", marginBottom: 24 }}>
            {view === "login" ? t(lang, "auth_login_sub") : t(lang, "auth_reg_sub")}
          </div>

          {success && (
            <div style={{ background: "#d1fae5", color: "#065f46", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13 }}>
              {success}
            </div>
          )}
          {err && (
            <div style={{ background: "#fee2e2", color: "#991b1b", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13 }}>
              {err}
            </div>
          )}

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {view === "register" && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>{t(lang, "auth_name")}</label>
                <input className="input-field" value={name} onChange={e => setName(e.target.value)} placeholder="First and last name" />
              </div>
            )}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>{t(lang, "auth_email")}</label>
              <input className="input-field" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>{t(lang, "auth_password")}</label>
              <input className="input-field" type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Minimum 8 characters" />
              {view === "register" && pw && (
                <div style={{ display: "flex", gap: 4, marginTop: 8, alignItems: "center" }}>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} style={{ flex: 1, height: 4, borderRadius: 99, background: i <= strength.score ? strength.color : "#e2e8f0", transition: "background .3s" }} />
                  ))}
                  <span style={{ fontSize: 11, color: strength.color, marginLeft: 6, fontWeight: 600 }}>{strength.label}</span>
                </div>
              )}
            </div>
            {view === "register" && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>{t(lang, "auth_confirm_pw")}</label>
                <input className="input-field" type="password" value={pw2} onChange={e => setPw2(e.target.value)} placeholder="Re-enter password" />
              </div>
            )}
            <button type="submit" disabled={loading}
              className="grad-btn"
              style={{ border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? .7 : 1, padding: "13px", borderRadius: 12, color: "#fff", fontWeight: 600, fontSize: 14, marginTop: 4 }}>
              {loading ? t(lang, "auth_loading") : view === "login" ? t(lang, "auth_signin_btn") : t(lang, "auth_register_btn")}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#64748b" }}>
            {view === "login" ? t(lang, "auth_no_account") : t(lang, "auth_have_account")}
            {" "}
            <button onClick={() => { setView(view === "login" ? "register" : "login"); setErr(""); }}
              style={{ color: "#4f46e5", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
              {view === "login" ? t(lang, "auth_create_link") : t(lang, "auth_signin_link")}
            </button>
          </div>

          <div style={{ textAlign: "center", marginTop: 24, paddingTop: 20, borderTop: "1px solid #f1f5f9", fontSize: 11, color: "#94a3b8" }}>
            Ministry of Electronics &amp; Information Technology &bull; Government of India
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// NavBar
// ─────────────────────────────────────────────
function NavBar({ user, lang, setLang, view, setView, onLogout }: {
  user: StoredUser; lang: Lang; setLang: (l: Lang) => void;
  view: string; setView: (v: string) => void; onLogout: () => void;
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const navItems = user.role === "admin"
    ? [{ key: "admin_dash", label: t(lang, "nav_admin") }]
    : [
        { key: "home",    label: t(lang, "nav_home") },
        { key: "schemes", label: t(lang, "nav_schemes") },
        { key: "opportunity", label: "Opportunity Map" },
        { key: "saved",   label: "Saved Schemes" },
        { key: "myapps",  label: t(lang, "nav_myapps") },
        { key: "profile", label: t(lang, "nav_profile") },
      ];

  return (
    <nav style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", height: 60, gap: 24 }}>
        <div className="font-display text-gradient-indigo" style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-.01em", flexShrink: 0 }}>
          ClearGov
        </div>
        <div style={{ display: "flex", gap: 4, flex: 1 }}>
          {navItems.map(item => (
            <button key={item.key} onClick={() => setView(item.key)}
              style={{
                padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500, border: "none", cursor: "pointer",
                background: view === item.key ? "#eef2ff" : "transparent",
                color: view === item.key ? "#4f46e5" : "#64748b",
              }}>
              {item.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {(Object.keys(LANGUAGES) as Lang[]).map((l) => (
            <button key={l} onClick={() => setLang(l)}
              style={{
                padding: "3px 8px", borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: "pointer",
                background: lang === l ? "#eef2ff" : "transparent",
                color: lang === l ? "#4f46e5" : "#94a3b8",
                border: `1px solid ${lang === l ? "#c7d2fe" : "transparent"}`,
              }}>
              {LANGUAGES[l].native}
            </button>
          ))}
          <div style={{ position: "relative" }}>
            <button onClick={() => setProfileOpen(!profileOpen)}
              style={{
                width: 36, height: 36, borderRadius: "50%", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer",
                background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
              {user.profilePhoto ? <img src={user.profilePhoto} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} /> : initials(user.name)}
            </button>
            {profileOpen && (
              <div className="card" style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", minWidth: 200, borderRadius: 12, padding: 8, zIndex: 200 }}>
                <div style={{ padding: "8px 12px" }}>
                  <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 13 }}>{user.name}</div>
                  <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 2 }}>{user.email}</div>
                </div>
                <div style={{ borderTop: "1px solid #f1f5f9", margin: "4px 0" }} />
                <button onClick={() => { setProfileOpen(false); onLogout(); }}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, fontSize: 13, color: "#ef4444", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                  {t(lang, "nav_logout")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function ProfileView({ user, lang, onSave }: { user: StoredUser; lang: Lang; onSave: (user: StoredUser) => void }) {
  const [form, setForm] = useState({ name: user.name, age: user.age ?? "", gender: user.gender ?? "", profilePhoto: user.profilePhoto ?? "" });
  const [saved, setSaved] = useState(false);

  function photoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm(current => ({ ...current, profilePhoto: reader.result as string }));
    reader.readAsDataURL(file);
  }

  function save() {
    const next = updateUser(user.id, form);
    if (next) { onSave(next); setSaved(true); setTimeout(() => setSaved(false), 1800); }
  }

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "32px 24px" }}>
      <div className="card anim-fadeUp" style={{ padding: 28 }}>
        <div style={{ display: "flex", gap: 18, alignItems: "center", marginBottom: 26 }}>
          <label style={{ width: 92, height: 92, borderRadius: "50%", overflow: "hidden", cursor: "pointer", background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, flexShrink: 0 }}>
            {form.profilePhoto ? <img src={form.profilePhoto} alt="Profile preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials(form.name)}
            <input type="file" accept="image/jpeg,image/png" onChange={photoChange} style={{ display: "none" }} />
          </label>
          <div>
            <h2 style={{ margin: 0, fontSize: 24, color: "#1e293b" }}>{t(lang, "nav_profile")}</h2>
            <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>{user.email}</div>
            <div style={{ color: "#4f46e5", fontSize: 12, fontWeight: 600, marginTop: 6 }}>Click your photo to upload a new one</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div><label className="field-label">Full name</label><input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="field-label">Age</label><input className="input-field" type="number" min="1" max="120" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} placeholder="Your age" /></div>
          <div><label className="field-label">Gender</label><select className="input-field" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}><option value="">Select gender</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other / prefer not to say</option></select></div>
          <div><label className="field-label">Email</label><input className="input-field" value={user.email} disabled /></div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12, marginTop: 24 }}>
          {saved && <span style={{ color: "#059669", fontSize: 13, fontWeight: 600 }}>Profile saved</span>}
          <button onClick={save} className="grad-btn" style={{ border: "none", borderRadius: 11, padding: "11px 24px", color: "#fff", fontWeight: 600, cursor: "pointer" }}>Save profile</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SchemeCard
// ─────────────────────────────────────────────
function SchemeCard({ scheme, lang, onApply, applied, saved, onToggleSaved }: {
  scheme: Scheme; lang: Lang; onApply: (s: Scheme) => void; applied: boolean; saved?: boolean; onToggleSaved?: (id: string) => void;
}) {
  const pct = Math.round((scheme.appliedCount / scheme.totalSlots) * 100);
  const isOpen = scheme.status === "open";
  const full = scheme.appliedCount >= scheme.totalSlots;

  return (
    <div className="card card-hover anim-fadeUp" style={{ overflow: "hidden" }}>
      <div style={{ height: 140, overflow: "hidden", position: "relative" }}>
        <img src={scheme.image} alt={scheme.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,.55))" }} />
        <div style={{ position: "absolute", top: 10, left: 10 }}>
          <span className="pill" style={{
            background: isOpen ? "rgba(16,185,129,.9)" : scheme.status === "upcoming" ? "rgba(245,158,11,.9)" : "rgba(100,116,139,.9)",
            color: "#fff", backdropFilter: "blur(4px)",
          }}>
            {t(lang, `status_${scheme.status}`)}
          </span>
        </div>
        <div style={{ position: "absolute", bottom: 8, right: 10, fontSize: 11, color: "rgba(255,255,255,.85)", fontWeight: 600 }}>
          {scheme.ministry}
        </div>
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, letterSpacing: ".06em", marginBottom: 4 }}>
          {CATEGORIES[scheme.category].icon} {CATEGORIES[scheme.category].label}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}><div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", lineHeight: 1.3, marginBottom: 6 }}>{schemeTitle(lang, scheme.title)}</div>{onToggleSaved && <button title={saved ? "Remove saved scheme" : "Save scheme"} onClick={() => onToggleSaved(scheme.id)} style={{ border: "none", background: "none", color: saved ? "#f59e0b" : "#94a3b8", fontSize: 20, cursor: "pointer", lineHeight: 1 }}>★</button>}</div>
        <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5, marginBottom: 10, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {scheme.description}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4, fontSize: 11, color: "#94a3b8" }}>
          <span>{t(lang, "dash_applied")}: {scheme.appliedCount.toLocaleString("en-IN")}</span>
          <span>{t(lang, "dash_slots")}: {scheme.totalSlots.toLocaleString("en-IN")}</span>
        </div>
        <div className="progress-track" style={{ height: 5, marginBottom: 10 }}>
          <div className="progress-fill" style={{ width: `${Math.min(pct, 100)}%`, background: full ? "#ef4444" : "#4f46e5" }} />
        </div>
        {scheme.benefitAmount && (
          <div style={{ fontSize: 12, color: "#4f46e5", fontWeight: 600, marginBottom: 8 }}>Benefit: {scheme.benefitAmount}</div>
        )}
        {applied ? (
          <span className="pill" style={{ background: "#d1fae5", color: "#065f46", padding: "8px 0", display: "block", textAlign: "center", width: "100%" }}>
            {t(lang, "dash_applied_badge")}
          </span>
        ) : (
          <button onClick={() => onApply(scheme)} disabled={!isOpen || full}
            className="grad-btn"
            style={{ width: "100%", padding: "8px 0", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#fff", border: "none", cursor: !isOpen || full ? "not-allowed" : "pointer", opacity: !isOpen || full ? .55 : 1 }}>
            {full ? t(lang, "dash_slots_full") : t(lang, "dash_apply_now")}
          </button>
        )}
        <div style={{ fontSize: 11, color: "#94a3b8", textAlign: "right", marginTop: 6 }}>
          {t(lang, "dash_deadline")}: {scheme.deadline}
        </div>
      </div>
    </div>
  );
}

function OpportunityPanel({ lang, large = false }: { lang: Lang; large?: boolean }) {
  const [location, setLocation] = useState("Locating your nearest centre...");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [searchText, setSearchText] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState("");
  useEffect(() => {
    if (!navigator.geolocation) { setLocation("Location access is unavailable"); return; }
    const watchId = navigator.geolocation.watchPosition(
      position => { const next = { lat: position.coords.latitude, lng: position.coords.longitude }; setCoords(next); setMapCenter(current => current ?? next); setLocation("Live location enabled"); },
      () => setLocation("Enable location to see nearby support centres"),
      { enableHighAccuracy: true, timeout: 8000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);
  async function searchNearby() {
    const query = searchText.trim();
    if (!query) return;
    if (!coords) { setSearchMessage("Allow location access before searching nearby places."); return; }
    setSearching(true);
    setSearchMessage("");
    try {
      const viewbox = `${coords.lng - 0.2},${coords.lat + 0.2},${coords.lng + 0.2},${coords.lat - 0.2}`;
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&bounded=1&viewbox=${viewbox}&q=${encodeURIComponent(query)}`, { headers: { Accept: "application/json" } });
      const results = await response.json() as Array<{ lat: string; lon: string; display_name: string }>;
      if (!results[0]) { setSearchMessage("No nearby place found. Try a centre, district, hospital, or office name."); return; }
      setMapCenter({ lat: Number(results[0].lat), lng: Number(results[0].lon) });
      setSearchMessage(results[0].display_name);
    } catch {
      setSearchMessage("Search is temporarily unavailable. Please try again.");
    } finally { setSearching(false); }
  }
  const featured = getAvailableSchemes().find(s => s.status === "open") ?? SCHEMES[0];
  return (
    <div className={`opportunity-grid ${large ? "opportunity-grid-large" : ""}`} style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 32px", display: "grid", gridTemplateColumns: "1.1fr .9fr", gap: 20 }}>
      <div className="card glass-panel anim-fadeUp" style={{ padding: 22, overflow: "hidden", position: "relative" }}>
        <div style={{ fontSize: 11, color: "#4f46e5", fontWeight: 800, letterSpacing: ".1em", marginBottom: 8 }}>OPPORTUNITY OF THE DAY</div>
        <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
          <img src={featured.image} alt="" style={{ width: 116, height: 92, objectFit: "cover", borderRadius: 14 }} />
          <div><h3 style={{ margin: "0 0 5px", fontSize: 18, color: "#1e293b" }}>{featured.title}</h3><div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{featured.description}</div><div style={{ color: "#4f46e5", fontWeight: 700, fontSize: 12, marginTop: 8 }}>{t(lang, "dash_deadline")}: {featured.deadline}</div></div>
        </div>
        <div className="font-display" style={{ color: "#475569", fontSize: 18, marginTop: 18 }}>&quot;A better tomorrow begins with one informed application today.&quot;</div>
      </div>
      <div className="card glass-panel anim-fadeUp d2" style={{ padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}><div><div style={{ fontSize: 11, color: "#4f46e5", fontWeight: 800, letterSpacing: ".1em" }}>OPPORTUNITY MAP</div><div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>{location}</div></div><div style={{ display: "flex", alignItems: "center", gap: 8 }}><span className="dot-pulse" style={{ background: coords ? "#10b981" : "#f59e0b" }} />{coords && <a href={`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "#4f46e5", fontWeight: 700 }}>Open in Maps</a>}</div></div>
        <div className="map-search-row"><input className="input-field" placeholder="Search nearby centres, hospitals, offices..." value={searchText} onChange={e => setSearchText(e.target.value)} onKeyDown={e => e.key === "Enter" && searchNearby()} disabled={!coords || searching} /><button onClick={searchNearby} className="grad-btn map-search-button" disabled={!coords || searching}>{searching ? "..." : "Search"}</button></div>
        {searchMessage && <div className="map-search-message">{searchMessage}</div>}
        <div className={`opportunity-map ${large ? "opportunity-map-large" : ""}`}>{mapCenter ? <iframe title="Live opportunity map" src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapCenter.lng - .08}%2C${mapCenter.lat - .06}%2C${mapCenter.lng + .08}%2C${mapCenter.lat + .06}&layer=mapnik&marker=${mapCenter.lat}%2C${mapCenter.lng}`} style={{ width: "100%", height: "100%", border: 0 }} /> : <><div className="map-road map-road-one" /><div className="map-road map-road-two" /><div className="map-pin" style={{ left: "45%", top: "58%" }}>⌖</div><div className="map-label">Enable location for live map</div></>}</div>
      </div>
    </div>
  );
}

function OpportunityMapView({ lang }: { lang: Lang }) {
  return <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}><div className="map-page-heading"><div><div style={{ color: "#4f46e5", fontSize: 11, fontWeight: 800, letterSpacing: ".12em" }}>CLEARGOV LIVE SERVICES</div><h1 className="font-display" style={{ margin: "6px 0", color: "#1e293b", fontSize: 30 }}>Opportunity map</h1><p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>Find nearby support and follow your live location while you move.</p></div><img src="https://images.unsplash.com/photo-1524666041070-9d87656c25bb?w=500&h=260&fit=crop&auto=format" alt="Map and navigation" /></div><div style={{ marginTop: 24 }}><OpportunityPanel lang={lang} large /></div></div>;
}

// ─────────────────────────────────────────────
// HomeView
// ─────────────────────────────────────────────
function HomeView({ user, lang, onNavigate, userApps }: {
  user: StoredUser; lang: Lang; onNavigate: (v: string, d?: unknown) => void; userApps: Application[];
}) {
  const [findText, setFindText] = useState("");
  const [findResults, setFindResults] = useState<Scheme[] | null>(null);
  const catalog = getAvailableSchemes();
  const [savedIds, setSavedIds] = useState(() => getSavedSchemeIds(user.id));
  const openCount = catalog.filter(s => s.status === "open").length;
  const deadlineSchemes = catalog.filter(s => s.status === "open").slice(0, 3);
  function toggleSaved(id: string) { setSavedIds(toggleSavedScheme(user.id, id)); }

  function findScheme() {
    const q = findText.toLowerCase();
    if (!q) return;
    setFindResults(catalog.filter(s =>
      s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) ||
      s.eligibility.some(e => e.toLowerCase().includes(q)) ||
      CATEGORIES[s.category].label.toLowerCase().includes(q) || s.category.includes(q)
    ));
  }

  return (
    <div>
      {/* Hero */}
      <div className="grad-hero" style={{ padding: "48px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div className="anim-fadeDown" style={{ fontSize: 13, fontWeight: 600, color: "#c7d2fe", letterSpacing: ".1em", marginBottom: 12 }}>
            WELCOME TO CLEARGOV
          </div>
          <h1 className="font-display anim-fadeUp text-gradient-hero" style={{ fontSize: "clamp(28px,5vw,44px)", fontWeight: 700, lineHeight: 1.2, margin: "0 0 16px" }}>
            {t(lang, "dash_welcome")} {user.name.split(" ")[0]}
          </h1>
          <p className="anim-fadeUp d2" style={{ color: "rgba(255,255,255,.75)", fontSize: 15, marginBottom: 32 }}>
            {t(lang, "dash_subtitle")}
          </p>
          {/* Stats */}
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginBottom: 32 }} className="anim-fadeUp d3">
            {[
              { label: t(lang, "dash_total_schemes"), val: catalog.length },
              { label: t(lang, "dash_open_schemes"),  val: openCount },
              { label: t(lang, "dash_my_apps"),       val: userApps.length },
              { label: t(lang, "dash_approved"),      val: userApps.filter(a => a.status === "approved").length },
            ].map((s, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,.12)", backdropFilter: "blur(10px)", borderRadius: 14, padding: "16px 24px", minWidth: 110, border: "1px solid rgba(255,255,255,.2)" }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#fff" }}><AnimNum target={s.val} /></div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.65)", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
          {/* Find my scheme */}
          <div className="card anim-fadeUp d4" style={{ maxWidth: 560, margin: "0 auto", padding: 20, background: "rgba(255,255,255,.95)" }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 4 }}>{t(lang, "dash_find_scheme")}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>{t(lang, "dash_find_sub")}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="input-field" style={{ flex: 1 }}
                placeholder={t(lang, "dash_find_placeholder")}
                value={findText} onChange={e => setFindText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && findScheme()} />
              <button onClick={findScheme} className="grad-btn"
                style={{ padding: "10px 18px", borderRadius: 12, color: "#fff", fontWeight: 600, fontSize: 13, border: "none", cursor: "pointer", flexShrink: 0 }}>
                Find
              </button>
            </div>
            {findResults !== null && (
              <div style={{ marginTop: 12 }}>
                {findResults.length === 0
                  ? <div style={{ fontSize: 13, color: "#64748b" }}>{t(lang, "dash_no_results")}</div>
                  : findResults.slice(0, 3).map(s => (
                      <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: 10, marginBottom: 8, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                        <span style={{ fontSize: 18 }}>{CATEGORIES[s.category].icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{s.title}</div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>{CATEGORIES[s.category].label}</div>
                        </div>
                        <button onClick={() => onNavigate("apply", s)}
                          style={{ fontSize: 12, color: "#4f46e5", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
                          Apply
                        </button>
                      </div>
                    ))
                }
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category strip */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "14px 24px", overflowX: "auto" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", gap: 10 }}>
          {(Object.entries(CATEGORIES) as [SchemeCategory, { label: string; icon: string; description: string }][]).map(([k, v]) => (
            <button key={k} onClick={() => onNavigate("schemes", { category: k })}
              style={{ padding: "9px 16px", flexShrink: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, border: "1px solid #e2e8f0", borderRadius: 10, background: "#fff", color: "#374151", fontSize: 13, fontWeight: 500 }}>
              <span style={{ fontSize: 18 }}>{v.icon}</span>{v.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "22px 24px 0" }}>
        <div className="glass-panel" style={{ padding: "12px 16px", borderRadius: 12, display: "flex", gap: 12, alignItems: "center", color: "#475569", fontSize: 13 }}><span style={{ fontSize: 18 }}>📣</span><strong style={{ color: "#1e293b" }}>Announcements</strong><span>New application windows are open. Check deadlines before you apply.</span><span style={{ marginLeft: "auto", color: "#4f46e5", fontWeight: 700, whiteSpace: "nowrap" }}>3 updates</span></div>
        <div className="deadline-alerts"><span className="deadline-alert-title">⏰ Deadline alerts</span>{deadlineSchemes.map(s => <span key={s.id} className="deadline-alert"><strong>{schemeTitle(lang, s.title)}</strong><small>{t(lang, "dash_deadline")}: {s.deadline}</small></span>)}</div>
      </div>
      <div className="dashboard-image-strip">
        {[
          ["https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=700&h=360&fit=crop&auto=format", "Education & scholarships"],
          ["https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=700&h=360&fit=crop&auto=format", "Housing support"],
          ["https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=700&h=360&fit=crop&auto=format", "Health & care"],
        ].map(([image, label], index) => <div className={`dashboard-image-card d${index + 1}`} key={label}><img src={image} alt={label} /><span>{label}</span></div>)}
      </div>
      <OpportunityPanel lang={lang} />

      {/* Featured schemes */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1e293b", margin: 0 }}>Featured Schemes</h2>
          <button onClick={() => onNavigate("schemes")} style={{ fontSize: 13, color: "#4f46e5", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
            View all
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
          {catalog.filter(s => s.status === "open").slice(0, 6).map((s, i) => (
            <div key={s.id} className={`d${Math.min(i + 1, 8)}`}>
              <SchemeCard scheme={s} lang={lang} onApply={sc => onNavigate("apply", sc)}
                applied={userApps.some(a => a.schemeId === s.id)} saved={savedIds.includes(s.id)} onToggleSaved={toggleSaved} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SchemesView
// ─────────────────────────────────────────────
function SchemesView({ lang, onApply, userApps, initialCategory, userId, savedOnly = false }: {
  lang: Lang; onApply: (s: Scheme) => void; userApps: Application[]; initialCategory?: SchemeCategory; userId: string; savedOnly?: boolean;
}) {
  const catalog = getAvailableSchemes();
  const [savedIds, setSavedIds] = useState(() => getSavedSchemeIds(userId));
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<SchemeCategory | "all">(initialCategory ?? "all");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "upcoming" | "closed">("all");

  const filtered = catalog.filter(s => {
    if (savedOnly && !savedIds.includes(s.id)) return false;
    if (category !== "all" && s.category !== category) return false;
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.ministry.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 24px" }}>
      <div className="card" style={{ padding: 16, marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <input className="input-field" style={{ flex: 1, minWidth: 200 }}
            placeholder={t(lang, "nav_search_placeholder")}
            value={search} onChange={e => setSearch(e.target.value)} />
          <select className="input-field" style={{ width: "auto", minWidth: 160 }}
            value={category} onChange={e => setCategory(e.target.value as SchemeCategory | "all")}>
            <option value="all">{t(lang, "dash_all")}</option>
            {(Object.entries(CATEGORIES) as [SchemeCategory, { label: string; icon: string; description: string }][]).map(([k, v]) => (
              <option key={k} value={k}>{v.icon} {v.label}</option>
            ))}
          </select>
          <select className="input-field" style={{ width: "auto", minWidth: 130 }}
            value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}>
            <option value="all">{t(lang, "dash_all")}</option>
            <option value="open">{t(lang, "dash_open")}</option>
            <option value="upcoming">{t(lang, "dash_upcoming")}</option>
            <option value="closed">{t(lang, "dash_closed")}</option>
          </select>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        <button onClick={() => setCategory("all")}
          className="pill" style={{ background: category === "all" ? "#4f46e5" : "#f1f5f9", color: category === "all" ? "#fff" : "#374151", border: "none", cursor: "pointer" }}>
          All ({catalog.length})
        </button>
        {(Object.entries(CATEGORIES) as [SchemeCategory, { label: string; icon: string; description: string }][]).map(([k, v]) => (
          <button key={k} onClick={() => setCategory(k)}
            className="pill" style={{ background: category === k ? "#4f46e5" : "#f1f5f9", color: category === k ? "#fff" : "#374151", border: "none", cursor: "pointer" }}>
            {v.icon} {v.label} ({catalog.filter(s => s.category === k).length})
          </button>
        ))}
      </div>

      <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 16 }}>Showing {filtered.length} scheme{filtered.length !== 1 ? "s" : ""}</div>

      {filtered.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: "center", color: "#94a3b8" }}>{t(lang, "dash_no_results")}</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
          {filtered.map((s, i) => (
            <div key={s.id} className={`d${Math.min(i + 1, 8)}`}>
              <SchemeCard scheme={s} lang={lang} onApply={onApply} applied={userApps.some(a => a.schemeId === s.id)} saved={savedIds.includes(s.id)} onToggleSaved={id => setSavedIds(toggleSavedScheme(userId, id))} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// ApplyView (3-step form)
// ─────────────────────────────────────────────
const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal","Delhi","Jammu and Kashmir","Ladakh",
  "Andaman and Nicobar Islands","Chandigarh","Puducherry",
];

function ApplyView({ scheme, user, lang, onDone, onBack }: {
  scheme: Scheme; user: StoredUser; lang: Lang; onDone: () => void; onBack: () => void;
}) {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<Application | null>(null);
  const [aiChecking, setAiChecking] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadError, setUploadError] = useState("");
  const [form, setForm] = useState({
    fullName: user.name, age: user.age ?? "", dob: "", gender: user.gender ?? "", mobile: "", altMobile: "",
    email: user.email, fatherName: "", motherName: "", address: "",
    state: "", district: "", pincode: "", aadhar: "", pan: "",
    annualIncome: "", category: "", declAgree: false,
  });
  const [uploads, setUploads] = useState<Record<string, UploadedDoc>>({});

  function setF(k: string, v: string | boolean) { setForm(f => ({ ...f, [k]: v })); }

  function validateStep0(): boolean {
    const errs: Record<string, string> = {};
    if (!form.fullName.trim()) errs.fullName = "Required";
    if (!form.dob) errs.dob = "Required";
    if (!form.gender) errs.gender = "Required";
    if (!/^\d{10}$/.test(form.mobile)) errs.mobile = "Enter valid 10-digit number";
    if (!form.email) errs.email = "Required";
    if (!form.fatherName.trim()) errs.fatherName = "Required";
    if (!form.address.trim()) errs.address = "Required";
    if (!form.state) errs.state = "Required";
    if (!form.district.trim()) errs.district = "Required";
    if (!/^\d{6}$/.test(form.pincode)) errs.pincode = "Enter valid 6-digit PIN";
    if (!/^\d{12}$/.test(form.aadhar)) errs.aadhar = "Enter valid 12-digit Aadhaar";
    if (!form.annualIncome) errs.annualIncome = "Required";
    if (!form.category) errs.category = "Required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleFile(docId: string, docLabel: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setUploads(u => ({
        ...u,
        [docId]: { docId, label: docLabel, fileName: file.name, fileType: file.type, fileSizeKB: Math.round(file.size / 1024), dataUrl: reader.result as string, uploadedAt: new Date().toISOString() },
      }));
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    const missing = scheme.documents.filter(doc => doc.required && !uploads[doc.id]);
    if (missing.length > 0) {
      setStep(1);
      setUploadError(`Upload all required documents: ${missing.map(doc => doc.label).join(", ")}`);
      return;
    }
    if (!form.declAgree) { setErrors({ declAgree: "You must agree to the declaration." }); return; }
    setSubmitting(true);
    setAiChecking(true);
    await new Promise(r => setTimeout(r, 2000));
    const uploadedArr = Object.values(uploads);
    const { pass, issues } = verifyDocuments(uploadedArr, scheme.documents);
    const app = saveApplication({
      userId: user.id, userName: user.name, userEmail: user.email,
      schemeId: scheme.id, schemeName: scheme.title, schemeCategory: scheme.category,
      status: pass ? "ai_pass" : "ai_flagged",
      ...form, profilePhoto: user.profilePhoto,
      documents: uploadedArr,
      aiIssues: issues,
      adminNote: "", adminAction: "", adminActedAt: "",
    });
    setAiChecking(false);
    setSubmitting(false);
    setSubmitted(app);
  }

  if (submitted) {
    return (
      <div style={{ maxWidth: 640, margin: "40px auto", padding: "0 24px" }}>
        <div className="card anim-scaleIn" style={{ padding: 32, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{submitted.status === "ai_pass" ? "✅" : "⚠️"}</div>
          <div style={{ fontWeight: 700, fontSize: 20, color: "#1e293b", marginBottom: 8 }}>{t(lang, "app_submitted_title")}</div>
          <div style={{ color: "#64748b", fontSize: 14, marginBottom: 20 }}>{t(lang, "app_submitted_sub")}</div>
          <div className="neuro-inset" style={{ padding: 16, marginBottom: 20, display: "inline-block", minWidth: 220 }}>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>{t(lang, "app_ref")}</div>
            <div className="font-mono" style={{ fontSize: 20, fontWeight: 700, color: "#4f46e5" }}>{submitted.refNo}</div>
          </div>
          <div style={{ marginBottom: 20 }}><StatusBadge status={submitted.status} lang={lang} /></div>
          {submitted.aiIssues.length > 0 && (
            <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 12, padding: 16, marginBottom: 20, textAlign: "left" }}>
              <div style={{ fontWeight: 700, color: "#c2410c", fontSize: 13, marginBottom: 8 }}>AI Document Screening Found Issues:</div>
              {submitted.aiIssues.map((iss, i) => (
                <div key={i} style={{ fontSize: 12, color: "#9a3412", marginBottom: 6, paddingLeft: 12, borderLeft: "3px solid #fb923c" }}>
                  <strong>{iss.docLabel}:</strong> {iss.message}
                </div>
              ))}
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>
                Your application has been submitted. The admin will review these flags.
              </div>
            </div>
          )}
          <button onClick={onDone} className="grad-btn" style={{ padding: "12px 32px", borderRadius: 12, color: "#fff", fontWeight: 600, border: "none", cursor: "pointer" }}>
            View My Applications
          </button>
        </div>
      </div>
    );
  }

  const steps = [t(lang, "app_sec_personal"), t(lang, "app_sec_docs"), t(lang, "app_sec_declaration")];

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "28px 24px" }}>
      <button onClick={onBack} style={{ fontSize: 13, color: "#4f46e5", fontWeight: 600, background: "none", border: "none", cursor: "pointer", marginBottom: 16 }}>
        ← {t(lang, "back")}
      </button>
      <div className="card" style={{ padding: "16px 20px", marginBottom: 20, display: "flex", gap: 16, alignItems: "center" }}>
        <img src={scheme.image} alt="" style={{ width: 80, height: 60, objectFit: "cover", borderRadius: 10, flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, letterSpacing: ".06em" }}>
            {CATEGORIES[scheme.category].icon} {CATEGORIES[scheme.category].label} &bull; {scheme.schemeCode}
          </div>
          <div style={{ fontWeight: 700, fontSize: 17, color: "#1e293b" }}>{schemeTitle(lang, scheme.title)}</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>{scheme.ministry}</div>
        </div>
      </div>
      <div className="font-display" style={{ fontSize: 22, fontWeight: 700, color: "#1e1b4b", textAlign: "center", marginBottom: 4 }}>{t(lang, "app_title")}</div>
      <div style={{ fontSize: 13, color: "#64748b", textAlign: "center", marginBottom: 24 }}>{t(lang, "app_subtitle")}</div>

      {/* Steps */}
      <div style={{ display: "flex", marginBottom: 28 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center", position: "relative" }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%", margin: "0 auto 6px",
              background: i <= step ? "#4f46e5" : "#e2e8f0",
              color: i <= step ? "#fff" : "#94a3b8",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: 13, position: "relative", zIndex: 1,
            }}>{i + 1}</div>
            {i < steps.length - 1 && (
              <div style={{ position: "absolute", top: 16, left: "50%", width: "100%", height: 2, background: i < step ? "#4f46e5" : "#e2e8f0", zIndex: 0 }} />
            )}
            <div style={{ fontSize: 11, color: i === step ? "#4f46e5" : "#94a3b8", fontWeight: i === step ? 600 : 400 }}>{s}</div>
          </div>
        ))}
      </div>

      <div className="card anim-fadeIn" style={{ padding: 24 }}>
        {step === 0 && (
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#1e293b", marginBottom: 20 }}>{t(lang, "app_sec_personal")}</div>
            <div className="profile-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                { k: "fullName", label: t(lang, "app_name"), type: "text" },
                { k: "age", label: "Age", type: "number", placeholder: "Years" },
                { k: "dob", label: t(lang, "app_dob"), type: "date" },
                { k: "mobile", label: t(lang, "app_mobile"), type: "tel", placeholder: "10-digit number" },
                { k: "altMobile", label: t(lang, "app_alt_mobile"), type: "tel" },
                { k: "email", label: t(lang, "app_email"), type: "email" },
                { k: "fatherName", label: t(lang, "app_father"), type: "text" },
                { k: "motherName", label: t(lang, "app_mother"), type: "text" },
                { k: "aadhar", label: t(lang, "app_aadhar"), type: "text", placeholder: "12-digit Aadhaar" },
                { k: "pan", label: t(lang, "app_pan"), type: "text", placeholder: "ABCDE1234F" },
                { k: "annualIncome", label: t(lang, "app_income"), type: "number" },
              ].map(f => (
                <div key={f.k}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>{f.label}</label>
                  <input className="input-field" type={f.type} placeholder={f.placeholder ?? ""}
                    value={(form as unknown as Record<string, string>)[f.k]}
                    onChange={e => setF(f.k, e.target.value)} />
                  {errors[f.k] && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>{errors[f.k]}</div>}
                </div>
              ))}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>{t(lang, "app_gender")}</label>
                <select className="input-field" value={form.gender} onChange={e => setF("gender", e.target.value)}>
                  <option value="">Select…</option>
                  <option value="male">{t(lang, "app_gender_m")}</option>
                  <option value="female">{t(lang, "app_gender_f")}</option>
                  <option value="other">{t(lang, "app_gender_o")}</option>
                </select>
                {errors.gender && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>{errors.gender}</div>}
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>{t(lang, "app_category")}</label>
                <select className="input-field" value={form.category} onChange={e => setF("category", e.target.value)}>
                  <option value="">Select…</option>
                  {["gen","obc","sc","st","ews"].map(c => (
                    <option key={c} value={c}>{t(lang, `app_cat_${c}`)}</option>
                  ))}
                </select>
                {errors.category && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>{errors.category}</div>}
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>{t(lang, "app_address")}</label>
              <textarea className="input-field" rows={3} value={form.address} onChange={e => setF("address", e.target.value)} />
              {errors.address && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>{errors.address}</div>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginTop: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>{t(lang, "app_state")}</label>
                <select className="input-field" value={form.state} onChange={e => setF("state", e.target.value)}>
                  <option value="">Select…</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.state && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>{errors.state}</div>}
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>{t(lang, "app_district")}</label>
                <input className="input-field" value={form.district} onChange={e => setF("district", e.target.value)} />
                {errors.district && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>{errors.district}</div>}
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>{t(lang, "app_pincode")}</label>
                <input className="input-field" maxLength={6} value={form.pincode} onChange={e => setF("pincode", e.target.value)} />
                {errors.pincode && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>{errors.pincode}</div>}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={() => { if (validateStep0()) setStep(1); }}
                className="grad-btn" style={{ padding: "11px 28px", borderRadius: 12, color: "#fff", fontWeight: 600, border: "none", cursor: "pointer" }}>
                {t(lang, "app_next")} →
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#1e293b", marginBottom: 6 }}>{t(lang, "app_upload_title")}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 20 }}>{t(lang, "app_upload_hint")}</div>
            {uploadError && <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", color: "#9a3412", padding: "10px 12px", borderRadius: 10, fontSize: 12, marginBottom: 14 }}>{uploadError}</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {scheme.documents.map(doc => {
                const up = uploads[doc.id];
                return (
                  <div key={doc.id} style={{ padding: 16, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "#1e293b" }}>
                          {doc.label}{doc.required && <span style={{ color: "#ef4444", marginLeft: 4 }}>*</span>}
                        </div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{doc.description} · Max {doc.maxSizeMB} MB</div>
                        {up && (
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                            <span style={{ fontSize: 11, color: "#10b981", fontWeight: 600 }}>Uploaded: {up.fileName}</span>
                            <span style={{ fontSize: 11, color: "#94a3b8" }}>({(up.fileSizeKB / 1024).toFixed(2)} MB)</span>
                            <button onClick={() => setUploads(u => { const n = { ...u }; delete n[doc.id]; return n; })}
                              style={{ fontSize: 11, color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>
                              {t(lang, "app_upload_remove")}
                            </button>
                          </div>
                        )}
                      </div>
                      <label style={{ cursor: "pointer" }}>
                        <input type="file" accept={doc.acceptedTypes?.join(",")} style={{ display: "none" }}
                          onChange={e => handleFile(doc.id, doc.label, e)} />
                        <span style={{
                          display: "inline-block", padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                          background: up ? "#d1fae5" : "#eef2ff", color: up ? "#065f46" : "#4f46e5",
                          border: `1px solid ${up ? "#a7f3d0" : "#c7d2fe"}`,
                        }}>
                          {up ? "Replace" : t(lang, "app_upload_browse")}
                        </span>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
              <button onClick={() => setStep(0)} style={{ fontSize: 13, color: "#4f46e5", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
                ← {t(lang, "app_prev")}
              </button>
              <button onClick={() => {
                const missing = scheme.documents.filter(doc => doc.required && !uploads[doc.id]);
                if (missing.length) { setUploadError(`Upload all required documents: ${missing.map(doc => doc.label).join(", ")}`); return; }
                setUploadError(""); setStep(2);
              }} className="grad-btn" style={{ padding: "11px 28px", borderRadius: 12, color: "#fff", fontWeight: 600, border: "none", cursor: "pointer" }}>
                {t(lang, "app_next")} →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#1e293b", marginBottom: 16 }}>{t(lang, "app_sec_declaration")}</div>
            <div className="neuro-inset" style={{ padding: 16, marginBottom: 20, fontSize: 13, color: "#374151", lineHeight: 1.8 }}>
              {t(lang, "app_decl_text")}
            </div>
            <label style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer", marginBottom: 16 }}>
              <input type="checkbox" checked={form.declAgree} onChange={e => setF("declAgree", e.target.checked)}
                style={{ width: 18, height: 18, marginTop: 2, flexShrink: 0, accentColor: "#4f46e5" }} />
              <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{t(lang, "app_decl_agree")}</span>
            </label>
            {errors.declAgree && <div style={{ fontSize: 12, color: "#ef4444", marginBottom: 12 }}>{errors.declAgree}</div>}
            {aiChecking && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, marginBottom: 16, background: "#eef2ff", borderRadius: 12, border: "1px solid #c7d2fe" }}>
                <div className="anim-spin" style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid #4f46e5", borderTopColor: "transparent" }} />
                <span style={{ fontSize: 13, color: "#4f46e5", fontWeight: 500 }}>{t(lang, "app_ai_checking")}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button onClick={() => setStep(1)} style={{ fontSize: 13, color: "#4f46e5", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
                ← {t(lang, "app_prev")}
              </button>
              <button onClick={handleSubmit} disabled={submitting}
                className="grad-btn" style={{ padding: "11px 32px", borderRadius: 12, color: "#fff", fontWeight: 600, fontSize: 14, border: "none", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? .7 : 1 }}>
                {submitting ? t(lang, "app_submitting") : t(lang, "app_submit")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MyAppsView
// ─────────────────────────────────────────────
function MyAppsView({ user, lang, onNavigate }: {
  user: StoredUser; lang: Lang; onNavigate: (v: string, d?: unknown) => void;
}) {
  const apps = getApplicationsByUser(user.id).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 24px" }}>
      <h2 style={{ fontWeight: 700, fontSize: 22, color: "#1e293b", marginBottom: 24 }}>{t(lang, "myapp_title")}</h2>
      {apps.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <div style={{ fontWeight: 600, color: "#374151", marginBottom: 8 }}>{t(lang, "myapp_empty")}</div>
          <button onClick={() => onNavigate("schemes")} className="grad-btn"
            style={{ padding: "10px 24px", borderRadius: 12, color: "#fff", fontWeight: 600, border: "none", cursor: "pointer", marginTop: 16 }}>
            {t(lang, "myapp_browse")}
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {apps.map(app => (
            <div key={app.id} className="card card-hover anim-fadeUp" style={{ padding: 20 }}>
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }}>{schemeTitle(lang, app.schemeName)}</span>
                    <span className="pill" style={{ background: "#f1f5f9", color: "#64748b", fontSize: 11 }}>
                      {CATEGORIES[app.schemeCategory as SchemeCategory]?.icon} {CATEGORIES[app.schemeCategory as SchemeCategory]?.label}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, color: "#94a3b8" }}>
                    <span className="font-mono">Tracking ID: {app.refNo}</span>
                    <span>{t(lang, "myapp_submitted_on")}: {formatDate(app.submittedAt)}</span>
                  </div>
                  {app.aiIssues.length > 0 && (
                    <div style={{ marginTop: 8, fontSize: 12, color: "#c2410c" }}>
                      {t(lang, "myapp_issues")} {app.aiIssues.map(i => i.docLabel).join(", ")}
                    </div>
                  )}
                  {app.adminNote && (
                    <div style={{ marginTop: 8, fontSize: 12, color: "#374151", background: "#f8fafc", padding: "6px 12px", borderRadius: 8, borderLeft: "3px solid #4f46e5" }}>
                      Admin: {app.adminNote}
                    </div>
                  )}
                  {app.status === "rejected" && app.rejectionReason && <div style={{ marginTop: 8, fontSize: 12, color: "#991b1b", background: "#fef2f2", padding: "8px 12px", borderRadius: 8 }}><strong>Why it was rejected:</strong> {app.rejectionReason}</div>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}><StatusBadge status={app.status} lang={lang} /><button onClick={() => setSelectedApp(app)} style={{ border: "none", background: "#eef2ff", color: "#4f46e5", borderRadius: 8, padding: "6px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Track</button></div>
              </div>
            </div>
          ))}
        </div>
      )}
      {selectedApp && <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={e => e.target === e.currentTarget && setSelectedApp(null)}><div className="card anim-scaleIn" style={{ width: "100%", maxWidth: 620, maxHeight: "88vh", overflowY: "auto", padding: 26 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}><div><div style={{ fontWeight: 700, fontSize: 20, color: "#1e293b" }}>{schemeTitle(lang, selectedApp.schemeName)}</div><div className="font-mono" style={{ color: "#4f46e5", fontSize: 12, marginTop: 4 }}>Tracking ID: {selectedApp.refNo}</div></div><button onClick={() => setSelectedApp(null)} style={{ border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer" }}>×</button></div><div className="timeline">{(selectedApp.timeline ?? [{ id: "fallback", status: selectedApp.status, label: "Current status", at: selectedApp.updatedAt }]).map((event, index) => <div className="timeline-item" key={event.id}><div className={`timeline-dot ${index === (selectedApp.timeline?.length ?? 1) - 1 ? "active" : ""}`} /><div><div style={{ fontWeight: 700, color: "#1e293b", fontSize: 13 }}>{event.label}</div><div style={{ color: "#94a3b8", fontSize: 11 }}>{formatDate(event.at)} {event.note && `· ${event.note}`}</div></div></div>)}</div>{selectedApp.aiIssues.length > 0 && <div style={{ marginTop: 18, padding: 14, background: "#fff7ed", borderRadius: 10, color: "#9a3412", fontSize: 12 }}><strong>Document mistakes detected:</strong>{selectedApp.aiIssues.map(issue => <div key={issue.docId + issue.code} style={{ marginTop: 6 }}>• {issue.docLabel}: {issue.message}</div>)}</div>}{selectedApp.manualReviewReason && <div style={{ marginTop: 12, padding: 14, background: "#eff6ff", borderRadius: 10, color: "#1e40af", fontSize: 12 }}><strong>Manual review reason:</strong> {selectedApp.manualReviewReason}</div>}{selectedApp.rejectionReason && <div style={{ marginTop: 12, padding: 14, background: "#fef2f2", borderRadius: 10, color: "#991b1b", fontSize: 12 }}><strong>Rejection reason and mistakes:</strong> {selectedApp.rejectionReason}</div>}</div></div>}
    </div>
  );
}

// ─────────────────────────────────────────────
// AdminDashboard
// ─────────────────────────────────────────────
function AdminDashboard({ lang }: { lang: Lang }) {
  const [allApps, setAllApps] = useState<Application[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Application | null>(null);
  const [actionModal, setActionModal] = useState<"approve" | "reject" | "info" | "review" | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [actionDone, setActionDone] = useState(false);
  const [showSchemeForm, setShowSchemeForm] = useState(false);
  const [schemeDraft, setSchemeDraft] = useState({ title: "", description: "", benefitAmount: "", deadline: "", ministry: "" });

  useEffect(() => { setAllApps(getApplications()); }, []);
  function refresh() { setAllApps(getApplications()); }

  const today = new Date().toDateString();
  const stats = {
    total: allApps.length,
    pending: allApps.filter(a => ["pending_ai","ai_pass","admin_reviewing"].includes(a.status)).length,
    approvedToday: allApps.filter(a => a.status === "approved" && new Date(a.updatedAt).toDateString() === today).length,
    flagged: allApps.filter(a => a.status === "ai_flagged").length,
  };

  const filtered = allApps.filter(a => {
    if (filter === "pending" && !["pending_ai","ai_pass","admin_reviewing"].includes(a.status)) return false;
    if (filter === "flagged" && a.status !== "ai_flagged") return false;
    if (filter === "approved" && a.status !== "approved") return false;
    if (search) {
      const q = search.toLowerCase();
      return a.userName.toLowerCase().includes(q) || a.refNo.toLowerCase().includes(q) || a.schemeName.toLowerCase().includes(q);
    }
    return true;
  });

  function doAction(action: "approve" | "reject" | "info" | "review") {
    if (!selected || !actionNote.trim()) return;
    const statusMap: Record<string, Application["status"]> = { approve: "approved", reject: "rejected", info: "more_info", review: "admin_reviewing" };
    updateApplication(selected.id, { status: statusMap[action], adminNote: actionNote, rejectionReason: action === "reject" ? actionNote : selected.rejectionReason, manualReviewReason: action === "review" ? actionNote : selected.manualReviewReason, adminAction: action, adminActedAt: new Date().toISOString() });
    refresh();
    setActionDone(true);
    setTimeout(() => { setActionModal(null); setActionNote(""); setActionDone(false); setSelected(null); }, 1500);
  }

  function addScheme() {
    if (!schemeDraft.title.trim() || !schemeDraft.description.trim()) return;
    saveCustomScheme({
      category: "business", shortTitle: schemeDraft.title, title: schemeDraft.title,
      description: schemeDraft.description, longDescription: schemeDraft.description,
      eligibility: ["See official scheme guidelines"], benefits: schemeDraft.benefitAmount || "As per scheme guidelines",
      benefitAmount: schemeDraft.benefitAmount, deadline: schemeDraft.deadline || "Ongoing",
      totalSlots: 1000, appliedCount: 0, status: "open", processingDays: 30,
      documents: [], image: "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800&h=400&fit=crop&auto=format",
      launchDate: new Date().toISOString().slice(0, 10), ministry: schemeDraft.ministry || "Government of India",
    });
    setSchemeDraft({ title: "", description: "", benefitAmount: "", deadline: "", ministry: "" });
    setShowSchemeForm(false);
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontWeight: 700, fontSize: 22, color: "#1e293b", margin: 0, marginBottom: 4 }}>{t(lang, "admin_title")}</h2>
          <div style={{ fontSize: 13, color: "#64748b" }}>{t(lang, "admin_sub")}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}><button onClick={() => setShowSchemeForm(!showSchemeForm)} style={{ padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#fff", background: "#4f46e5", border: "none", cursor: "pointer" }}>＋ Add scheme</button><button onClick={refresh} style={{ padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#4f46e5", background: "#eef2ff", border: "1px solid #c7d2fe", cursor: "pointer" }}>Refresh</button></div>
      </div>

      <div className="admin-visual-banner anim-fadeUp"><img src="https://images.unsplash.com/photo-1556761175-4b46a572b786?w=1000&h=360&fit=crop&auto=format" alt="Team reviewing public programmes" /><div><span>OPERATIONS OVERVIEW</span><strong>Make every application count.</strong><p>Review documents, monitor scheme demand, and keep citizen support moving.</p></div></div>

      {showSchemeForm && <div className="card glass-panel anim-fadeDown" style={{ padding: 20, marginBottom: 22 }}><div style={{ fontWeight: 700, color: "#1e293b", marginBottom: 14 }}>Publish a scheme for citizens</div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}><input className="input-field" placeholder="Scheme name *" value={schemeDraft.title} onChange={e => setSchemeDraft({ ...schemeDraft, title: e.target.value })} /><input className="input-field" placeholder="Ministry / department" value={schemeDraft.ministry} onChange={e => setSchemeDraft({ ...schemeDraft, ministry: e.target.value })} /><input className="input-field" placeholder="Benefit amount" value={schemeDraft.benefitAmount} onChange={e => setSchemeDraft({ ...schemeDraft, benefitAmount: e.target.value })} /><input className="input-field" placeholder="Deadline" value={schemeDraft.deadline} onChange={e => setSchemeDraft({ ...schemeDraft, deadline: e.target.value })} /></div><textarea className="input-field" rows={2} style={{ marginTop: 12 }} placeholder="Short description *" value={schemeDraft.description} onChange={e => setSchemeDraft({ ...schemeDraft, description: e.target.value })} /><div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}><button onClick={() => setShowSchemeForm(false)} style={{ padding: "8px 16px", borderRadius: 9, border: "none", background: "#f1f5f9", color: "#64748b", cursor: "pointer" }}>Cancel</button><button onClick={addScheme} className="grad-btn" style={{ padding: "8px 16px", borderRadius: 9, border: "none", color: "#fff", fontWeight: 600, cursor: "pointer" }}>Publish scheme</button></div></div>}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: t(lang, "admin_total"),        val: stats.total,         color: "#4f46e5" },
          { label: t(lang, "admin_pending"),       val: stats.pending,       color: "#f59e0b" },
          { label: t(lang, "admin_approved_stat"), val: stats.approvedToday, color: "#10b981" },
          { label: t(lang, "admin_flagged"),       val: stats.flagged,       color: "#ef4444" },
        ].map((s, i) => (
          <div key={i} className={`card anim-fadeUp d${i + 1}`} style={{ padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", letterSpacing: ".08em", marginBottom: 8 }}>{s.label.toUpperCase()}</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: s.color }}><AnimNum target={s.val} /></div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 28 }}><div style={{ fontWeight: 700, color: "#1e293b", marginBottom: 14 }}>Admin analysis</div><div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>{[{ label: "AI pass rate", value: allApps.length ? `${Math.round(allApps.filter(a => a.aiIssues.length === 0).length / allApps.length * 100)}%` : "0%", color: "#059669" }, { label: "Manual review", value: `${allApps.filter(a => a.status === "admin_reviewing").length}`, color: "#2563eb" }, { label: "Rejection rate", value: allApps.length ? `${Math.round(allApps.filter(a => a.status === "rejected").length / allApps.length * 100)}%` : "0%", color: "#dc2626" }, { label: "Documents flagged", value: `${allApps.reduce((sum, app) => sum + app.aiIssues.length, 0)}`, color: "#d97706" }].map(item => <div key={item.label} style={{ padding: 14, background: "#f8fafc", borderRadius: 10 }}><div style={{ fontSize: 11, color: "#64748b" }}>{item.label}</div><strong style={{ color: item.color, fontSize: 22 }}>{item.value}</strong></div>)}</div></div>

      {/* Applications table */}
      <div className="card" style={{ overflow: "hidden", marginBottom: 28 }}>
        <div style={{ display: "flex", gap: 12, padding: 16, borderBottom: "1px solid #f1f5f9", flexWrap: "wrap" }}>
          <input className="input-field" style={{ flex: 1, minWidth: 200 }} placeholder={t(lang, "admin_search")}
            value={search} onChange={e => setSearch(e.target.value)} />
          {["all","pending","flagged","approved"].map(f => (
            <button key={f} onClick={() => setFilter(f)} className="pill"
              style={{ background: filter === f ? "#4f46e5" : "#f1f5f9", color: filter === f ? "#fff" : "#374151", border: "none", cursor: "pointer" }}>
              {t(lang, `admin_filter_${f}`)}
            </button>
          ))}
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead><tr>
              {["admin_col_ref","admin_col_name","admin_col_scheme","admin_col_submitted","admin_col_ai","admin_col_status","admin_col_action"].map(k => (
                <th key={k}>{t(lang, k)}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: "center", color: "#94a3b8", padding: 32 }}>No applications found</td></tr>
              ) : filtered.map(app => (
                <tr key={app.id}>
                  <td className="font-mono" style={{ fontSize: 12 }}>{app.refNo}</td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{app.userName}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{app.userEmail}</div>
                  </td>
                  <td style={{ fontSize: 12, maxWidth: 180 }}>
                    <div style={{ fontWeight: 500 }}>{app.schemeName}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{CATEGORIES[app.schemeCategory as SchemeCategory]?.label}</div>
                  </td>
                  <td style={{ fontSize: 12, whiteSpace: "nowrap" }}>{formatDate(app.submittedAt)}</td>
                  <td>
                    {app.aiIssues.length === 0
                      ? <span className="pill" style={{ background: "#d1fae5", color: "#065f46" }}>Pass</span>
                      : <span className="pill" style={{ background: "#fee2e2", color: "#991b1b" }}>{app.aiIssues.length} issue{app.aiIssues.length > 1 ? "s" : ""}</span>
                    }
                  </td>
                  <td><StatusBadge status={app.status} lang={lang} /></td>
                  <td>
                    <button onClick={() => { setSelected(app); setActionModal(null); }}
                      style={{ padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#4f46e5", background: "#eef2ff", border: "none", cursor: "pointer" }}>
                      {t(lang, "admin_review")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scheme stats */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", fontWeight: 700, fontSize: 15, color: "#1e293b" }}>
          {t(lang, "admin_scheme_stats")}
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead><tr>
              <th>Scheme</th><th>Category</th>
              <th>{t(lang, "admin_applied_count")}</th><th>Total Slots</th>
              <th>{t(lang, "admin_slot_usage")}</th><th>{t(lang, "admin_scheme_status")}</th>
            </tr></thead>
            <tbody>
              {getAvailableSchemes().map(s => {
                const pct = Math.round((s.appliedCount / s.totalSlots) * 100);
                return (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600, fontSize: 13, maxWidth: 220 }}>{s.title}</td>
                    <td style={{ fontSize: 12 }}>{CATEGORIES[s.category].icon} {CATEGORIES[s.category].label}</td>
                    <td style={{ fontWeight: 700, color: "#4f46e5" }}>{s.appliedCount.toLocaleString("en-IN")}</td>
                    <td style={{ color: "#64748b" }}>{s.totalSlots.toLocaleString("en-IN")}</td>
                    <td style={{ minWidth: 140 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div className="progress-track" style={{ flex: 1, height: 6 }}>
                          <div className="progress-fill" style={{ width: `${Math.min(pct, 100)}%`, background: pct > 85 ? "#ef4444" : "#4f46e5" }} />
                        </div>
                        <span style={{ fontSize: 11, color: "#64748b", whiteSpace: "nowrap" }}>{pct}%</span>
                      </div>
                    </td>
                    <td>
                      <span className="pill" style={{
                        background: s.status === "open" ? "#d1fae5" : s.status === "upcoming" ? "#fef3c7" : "#f1f5f9",
                        color: s.status === "open" ? "#065f46" : s.status === "upcoming" ? "#92400e" : "#64748b",
                      }}>
                        {t(lang, `status_${s.status}`)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review modal */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) { setSelected(null); setActionModal(null); } }}>
          <div className="card anim-scaleIn" style={{ width: "100%", maxWidth: 680, maxHeight: "90vh", overflowY: "auto", borderRadius: 20, padding: 28 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 18, color: "#1e293b" }}>{selected.userName}</div>
                <div className="font-mono" style={{ fontSize: 13, color: "#94a3b8" }}>{selected.refNo}</div>
              </div>
              {selected.profilePhoto && <img src={selected.profilePhoto} alt="Applicant profile" style={{ width: 54, height: 54, borderRadius: "50%", objectFit: "cover", border: "3px solid #eef2ff" }} />}
              <button onClick={() => { setSelected(null); setActionModal(null); }}
                style={{ width: 32, height: 32, borderRadius: "50%", background: "#f1f5f9", border: "none", cursor: "pointer", fontSize: 18 }}>×</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 13, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, marginBottom: 16 }}>
              {[["Scheme", selected.schemeName],["Email", selected.userEmail],["Mobile", selected.mobile],["DOB", selected.dob],["Gender", selected.gender],["Category", selected.category],["Income", `₹${Number(selected.annualIncome).toLocaleString("en-IN")}`],["Aadhaar", selected.aadhar],["State", selected.state],["District", selected.district]].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{k}</div>
                  <div style={{ color: "#1e293b", fontWeight: 500 }}>{v}</div>
                </div>
              ))}
            </div>

            {selected.aiIssues.length > 0 && (
              <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 12, padding: 14, marginBottom: 14 }}>
                <div style={{ fontWeight: 700, color: "#c2410c", fontSize: 13, marginBottom: 8 }}>{t(lang, "admin_ai_issues")}</div>
                {selected.aiIssues.map((iss, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#9a3412", marginBottom: 6, paddingLeft: 10, borderLeft: "3px solid #fb923c" }}>
                    <strong>[{iss.code}]</strong> {iss.docLabel}: {iss.message}
                  </div>
                ))}
              </div>
            )}

            <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b", marginBottom: 10 }}>Uploaded Documents</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {selected.documents.length === 0
                ? <div style={{ fontSize: 13, color: "#94a3b8" }}>No documents uploaded.</div>
                : selected.documents.map(doc => (
                    <div key={doc.docId} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{doc.label}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>{doc.fileName} ({(doc.fileSizeKB / 1024).toFixed(2)} MB)</div>
                      </div>
                      <a href={doc.dataUrl} download={doc.fileName}
                        style={{ padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#4f46e5", background: "#eef2ff", textDecoration: "none" }}>
                        {t(lang, "admin_doc_download")}
                      </a>
                    </div>
                  ))
              }
            </div>

            {selected.adminNote && (
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, marginBottom: 4 }}>{t(lang, "admin_admin_notes")}</div>
                <div style={{ fontSize: 13, color: "#374151" }}>{selected.adminNote}</div>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 13, color: "#64748b" }}>Current status:</span>
              <StatusBadge status={selected.status} lang={lang} />
            </div>

            {!["approved","rejected"].includes(selected.status) && (
              <>
                {!actionModal ? (
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {[
                      { k: "approve", label: t(lang, "admin_approve"), bg: "#d1fae5", color: "#065f46", border: "#a7f3d0" },
                      { k: "reject",  label: t(lang, "admin_reject"),  bg: "#fee2e2", color: "#991b1b", border: "#fca5a5" },
                      { k: "info",    label: t(lang, "admin_info"),    bg: "#fef3c7", color: "#92400e", border: "#fde68a" },
                      { k: "review",  label: "Require manual review",    bg: "#dbeafe", color: "#1e40af", border: "#bfdbfe" },
                    ].map(btn => (
                      <button key={btn.k} onClick={() => setActionModal(btn.k as "approve" | "reject" | "info" | "review")}
                        style={{ padding: "9px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, background: btn.bg, color: btn.color, border: `1px solid ${btn.border}`, cursor: "pointer" }}>
                        {btn.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
                    {actionDone ? (
                      <div style={{ color: "#10b981", fontWeight: 600, textAlign: "center", padding: "12px 0" }}>{t(lang, "admin_action_done")}</div>
                    ) : (
                      <>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                          {actionModal === "approve" ? t(lang, "admin_approve_note") : actionModal === "reject" ? t(lang, "admin_reject_reason") : actionModal === "review" ? "Why is manual review required? *" : t(lang, "admin_info_reason")}
                        </label>
                        <textarea className="input-field" rows={3} value={actionNote} onChange={e => setActionNote(e.target.value)} placeholder="Enter note…" />
                        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                          <button onClick={() => doAction(actionModal!)}
                            style={{ padding: "8px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, background: "#4f46e5", color: "#fff", border: "none", cursor: "pointer" }}>
                            {actionModal === "approve" ? t(lang, "admin_confirm_approve") : actionModal === "reject" ? t(lang, "admin_confirm_reject") : actionModal === "review" ? "Send to manual review" : t(lang, "admin_confirm_info")}
                          </button>
                          <button onClick={() => { setActionModal(null); setActionNote(""); }}
                            style={{ padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#64748b", background: "#f1f5f9", border: "none", cursor: "pointer" }}>
                            {t(lang, "cancel")}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Chatbot
// ─────────────────────────────────────────────
interface ChatMsg { from: "user" | "bot"; text: string; }

interface VoiceRecognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}
type VoiceRecognitionConstructor = new () => VoiceRecognition;

function chatRespond(query: string, lang: Lang): string {
  const q = query.toLowerCase();
  const matchedScheme = SCHEMES.find(s =>
    s.title.toLowerCase().includes(q) || (s.shortTitle ?? "").toLowerCase().includes(q)
  );
  if (matchedScheme) {
    return `${matchedScheme.title}\n\n${matchedScheme.description}\n\nMinistry: ${matchedScheme.ministry}\nBenefit: ${matchedScheme.benefitAmount ?? "As per scheme"}\nSlots: ${matchedScheme.totalSlots.toLocaleString("en-IN")} (${matchedScheme.appliedCount.toLocaleString("en-IN")} applied)\nDeadline: ${matchedScheme.deadline}\nStatus: ${matchedScheme.status}\n\nEligibility:\n${matchedScheme.eligibility.map(e => `• ${e}`).join("\n")}`;
  }
  if (q.includes("how") && q.includes("apply")) return "To apply:\n1. Sign in to your ClearGov account\n2. Find the scheme you need\n3. Click Apply Now\n4. Fill personal details\n5. Upload required documents\n6. Submit — AI will screen your documents first\n\nTrack status in My Applications.";
  if (q.includes("document") || q.includes("upload")) return "Required documents vary by scheme. Common ones:\n• Aadhaar Card (mandatory)\n• Photo\n• Income Certificate\n• Bank Passbook\n• Category Certificate\n\nEach scheme's form shows the exact list. Accepted formats: PDF, JPG, PNG.";
  if (q.includes("ai") || q.includes("verif") || q.includes("screen")) return "AI pre-screening checks:\n• File type and size validity\n• Document completeness\n• Filename matching (e.g., 'name mismatch' if the file name doesn't suggest the correct document)\n\nIssues are flagged with specific reasons. Application still goes to admin review.";
  if (q.includes("status") || q.includes("track")) return "Track in My Applications section. Status flow:\nPending AI → AI Verified / AI Flagged → Admin Review → Approved / Rejected";
  if (q.includes("education") || q.includes("scholar") || q.includes("student")) {
    return `Education schemes:\n${SCHEMES.filter(s => s.category === "education").map(s => `• ${s.title} (${s.status})`).join("\n")}`;
  }
  const cats: Record<string, SchemeCategory> = { housing: "housing", health: "healthcare", women: "women", senior: "senior", agri: "agriculture", farm: "agriculture", employ: "employment", job: "employment", work: "employment", business: "business" };
  for (const [kw, cat] of Object.entries(cats)) {
    if (q.includes(kw)) {
      const list = SCHEMES.filter(s => s.category === cat);
      return list.length ? `${CATEGORIES[cat].label} schemes:\n${list.map(s => `• ${s.title} (${s.status})`).join("\n")}` : `No ${CATEGORIES[cat].label} schemes listed currently.`;
    }
  }
  if (q.includes("how many") || q.includes("total")) {
    return `ClearGov has ${SCHEMES.length} schemes total.\nOpen: ${SCHEMES.filter(s => s.status === "open").length}\nTotal applications: ${SCHEMES.reduce((a, s) => a + s.appliedCount, 0).toLocaleString("en-IN")}`;
  }
  if (q.includes("hello") || q.includes("hi") || q.includes("namaste")) return t(lang, "chat_greeting");
  return `I can help with:\n• Scheme details and eligibility\n• Application process\n• Document requirements\n• Status tracking\n\nTry: "What education schemes are available?" or "How do I apply?"`;
}

function Chatbot({ lang }: { lang: Lang }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<ChatMsg[]>([{ from: "bot", text: t(lang, "chat_greeting") }]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<VoiceRecognition | null>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  function send(text?: string) {
    const q = (text ?? input).trim();
    if (!q) return;
    setInput("");
    setMsgs(m => [...m, { from: "user", text: q }, { from: "bot", text: chatRespond(q, lang) }]);
  }

  function toggleVoice() {
    const speechWindow = window as typeof window & { SpeechRecognition?: VoiceRecognitionConstructor; webkitSpeechRecognition?: VoiceRecognitionConstructor };
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition) { setMsgs(m => [...m, { from: "bot", text: "Voice recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge." }]); return; }
    if (listening) { recognitionRef.current?.stop(); setListening(false); return; }
    const recognition = new Recognition();
    recognition.lang = ({ en: "en-IN", ta: "ta-IN", hi: "hi-IN", te: "te-IN" } as Record<Lang, string>)[lang];
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = event => {
      const transcript = event.results[0]?.[0]?.transcript?.trim() ?? "";
      if (!transcript) return;
      setInput(current => `${current} ${transcript}`.trim());
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => {
      setListening(false);
      setMsgs(m => [...m, { from: "bot", text: "I could not hear that. Check microphone permission, then try speaking again." }]);
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      setListening(false);
      setMsgs(m => [...m, { from: "bot", text: "I could not start the microphone. Please allow microphone access and try again." }]);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(!open)}
        style={{ position: "fixed", bottom: 24, right: 24, zIndex: 999, width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff", fontSize: 20, border: "none", cursor: "pointer", boxShadow: "0 4px 20px rgba(79,70,229,.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {open ? "×" : "💬"}
      </button>
      {open && (
        <div className="card anim-scaleIn" style={{ position: "fixed", bottom: 90, right: 24, width: 360, height: 520, display: "flex", flexDirection: "column", zIndex: 998, borderRadius: 20, overflow: "hidden" }}>
          <div className="grad-hero" style={{ padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 700, color: "#fff", fontSize: 15 }}>{t(lang, "chat_title")}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.7)" }}>Always online</div>
            </div>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", animation: "pulse 2s ease-in-out infinite" }} />
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.from === "user" ? "flex-end" : "flex-start" }}>
                <div style={{ maxWidth: "82%", padding: "9px 13px", borderRadius: m.from === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: m.from === "user" ? "#4f46e5" : "#f8fafc", color: m.from === "user" ? "#fff" : "#1e293b", fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap", border: m.from === "bot" ? "1px solid #e2e8f0" : "none" }}>
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          {msgs.length <= 2 && (
            <div style={{ padding: "6px 14px", display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[t(lang, "chat_quick_1"), t(lang, "chat_quick_2"), t(lang, "chat_quick_3")].map((q, i) => (
                <button key={i} onClick={() => send(q)}
                  style={{ padding: "5px 10px", borderRadius: 99, fontSize: 11, fontWeight: 500, background: "#eef2ff", color: "#4f46e5", border: "1px solid #c7d2fe", cursor: "pointer" }}>
                  {q}
                </button>
              ))}
            </div>
          )}
          <div style={{ padding: "10px 14px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 8 }}>
            <input className="input-field" style={{ flex: 1, padding: "8px 12px", fontSize: 13 }}
              placeholder={t(lang, "chat_placeholder")}
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()} />
            <button onClick={toggleVoice} title={listening ? "Stop voice recognition" : "Speak to ClearGov Assistant"} className={listening ? "voice-button listening" : "voice-button"}>
              {listening ? "●" : "🎙"}
            </button>
            <button onClick={() => send()}
              style={{ padding: "8px 14px", borderRadius: 10, background: "#4f46e5", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
              {t(lang, "chat_send")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────
// App root
// ─────────────────────────────────────────────
type AppView = "home" | "schemes" | "opportunity" | "saved" | "apply" | "myapps" | "profile" | "admin_dash";

export default function App() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [lang, setLang] = useState<Lang>("en");
  const [view, setView] = useState<AppView>("home");
  const [applyScheme, setApplyScheme] = useState<Scheme | null>(null);
  const [schemesInitCat, setSchemesInitCat] = useState<SchemeCategory | undefined>(undefined);
  const [userApps, setUserApps] = useState<Application[]>([]);

  useEffect(() => {
    const s = loadSession();
    if (s) { setUser(s); setView(s.role === "admin" ? "admin_dash" : "home"); }
  }, []);

  useEffect(() => {
    if (user) setUserApps(getApplicationsByUser(user.id));
  }, [user, view]);

  function handleAuth(u: StoredUser) {
    setUser(u);
    setView(u.role === "admin" ? "admin_dash" : "home");
  }

  function handleLogout() {
    clearSession();
    setUser(null);
    setView("home");
  }

  function navigate(v: string, data?: unknown) {
    if (v === "apply" && data) { setApplyScheme(data as Scheme); setView("apply"); }
    else if (v === "schemes" && data && typeof data === "object" && data !== null && "category" in (data as Record<string, unknown>)) {
      setSchemesInitCat((data as { category: SchemeCategory }).category);
      setView("schemes");
    } else {
      setView(v as AppView);
    }
  }

  if (!user) return <AuthPage onAuth={handleAuth} lang={lang} setLang={setLang} />;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <NavBar user={user} lang={lang} setLang={setLang} view={view} setView={navigate} onLogout={handleLogout} />
      {user.role === "admin" ? (
        <AdminDashboard lang={lang} />
      ) : (
        <>
          {view === "home"    && <HomeView user={user} lang={lang} onNavigate={navigate} userApps={userApps} />}
          {view === "schemes" && <SchemesView lang={lang} onApply={s => navigate("apply", s)} userApps={userApps} userId={user.id} initialCategory={schemesInitCat} />}
          {view === "opportunity" && <OpportunityMapView lang={lang} />}
          {view === "saved" && <SchemesView lang={lang} onApply={s => navigate("apply", s)} userApps={userApps} userId={user.id} savedOnly />}
          {view === "apply"   && applyScheme && (
            <ApplyView scheme={applyScheme} user={user} lang={lang}
              onDone={() => { setUserApps(getApplicationsByUser(user.id)); setView("myapps"); }}
              onBack={() => setView("schemes")} />
          )}
          {view === "myapps"  && <MyAppsView user={user} lang={lang} onNavigate={navigate} />}
          {view === "profile" && <ProfileView user={user} lang={lang} onSave={setUser} />}
        </>
      )}
      <Chatbot lang={lang} />
    </div>
  );
}
