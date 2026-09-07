import React, { useState } from "react";
const API = {
  login: "/api/auth/login",
  google: "/api/auth/google",
  register: "/api/auth/register",
  forgotPassword: "/api/auth/forgot-password",
};
const Icon = ({ children, size = 20, strokeWidth = 1.8 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);
const MailIcon = () => (
  <Icon><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></Icon>
);
const LockIcon = () => (
  <Icon><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></Icon>
);
const EyeIcon = ({ off = false }) => (
  <Icon size={19}>
    {off ? (
      <><path d="M3 3l18 18" /><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5 0 8.7 4 10 8-0.4 1.2-1 2.3-1.8 3.3" /><path d="M6.2 6.2C4.6 7.3 3.5 9 2 12c.8 2.1 2 3.8 3.7 5.1A10.8 10.8 0 0 0 12 20c1.5 0 2.8-.3 4-.8" /></>
    ) : (
      <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>
    )}
  </Icon>
);
const UserIcon = () => (
  <Icon><circle cx="12" cy="8" r="3.5" /><path d="M4.5 20c.7-3.2 3.2-5 7.5-5s6.8 1.8 7.5 5" /></Icon>
);
const PhoneIcon = () => (
  <Icon><path d="M6.6 3.5 9 3l2 4-2 1.8a13.5 13.5 0 0 0 6.2 6.2L17 13l4 2-.5 2.4c-.3 1.5-1.7 2.6-3.2 2.4C9.9 19 5 14.1 4.2 6.7 4 5.2 5.1 3.8 6.6 3.5Z" /></Icon>
);
const IdIcon = () => (
  <Icon><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8" cy="12" r="2" /><path d="M12 10h6M12 14h4" /></Icon>
);
const ArrowIcon = () => (
  <Icon size={18}><path d="M5 12h13" /><path d="m13 7 5 5-5 5" /></Icon>
);
const CheckIcon = () => (
  <Icon size={18}><path d="m5 12 4 4L19 6" /></Icon>
);
const FileIcon = () => (
  <Icon size={21}><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v5h5M9 13h6M9 17h5" /></Icon>
);
const ShieldIcon = () => (
  <Icon size={21}><path d="M12 3 20 6v5c0 5-3.2 8.5-8 10-4.8-1.5-8-5-8-10V6z" /><path d="m9 12 2 2 4-4" /></Icon>
);
const ChartIcon = () => (
  <Icon size={21}><path d="M4 19V9M10 19V5M16 19v-7M22 19H2" /></Icon>
);
const AwardIcon = () => (
  <Icon size={21}><circle cx="12" cy="8" r="5" /><path d="m9 12-1 8 4-2 4 2-1-8" /></Icon>
);
const MoonIcon = () => (
  <Icon size={18}><path d="M20.5 14.8A8.5 8.5 0 0 1 9.2 3.5 8.5 8.5 0 1 0 20.5 14.8Z" /></Icon>
);
const SunIcon = () => (
  <Icon size={18}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></Icon>
);
const HomeIcon = () => (
  <Icon size={17}><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-6h6v6" /></Icon>
);
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path
    fill="#4285F4"
    d="M21.35 12.27c0-.72-.06-1.25-.2-1.8H12v3.42h5.37a4.59 4.59 0 0 1-1.99 3.01v2.5h3.22c1.89-1.74 2.75-4.3 2.75-7.13Z"
  /><path
      fill="#34A853"
      d="M12 21.75c2.7 0 4.97-.89 6.63-2.35l-3.22-2.5c-.89.6-2.03 1-3.41 1-2.62 0-4.84-1.77-5.63-4.15H3.05v2.58A10 10 0 0 0 12 21.75Z"
    /><path
      fill="#FBBC05"
      d="M6.37 13.75a6.01 6.01 0 0 1 0-3.5V7.67H3.05a10 10 0 0 0 0 8.66l3.32-2.58Z"
    /><path
      fill="#EA4335"
      d="M12 6.1c1.48 0 2.8.51 3.84 1.51l2.88-2.88C16.97 3.17 14.7 2.25 12 2.25a10 10 0 0 0-8.95 5.42l3.32 2.58C7.16 7.87 9.38 6.1 12 6.1Z"
    /></svg>
);
function Field({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  icon,
  required = true,
  autoComplete,
  showPassword,
  onTogglePassword,
}) {
  const isPassword = type === "password";
  return (
    <label className="cv-field"><span className="cv-label">{label}</span><span className="cv-input-wrap"><span className="cv-input-icon">{icon}</span><input
      type={isPassword && showPassword ? "text" : type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      autoComplete={autoComplete}
    />
      {isPassword && (
        <button
          type="button"
          className="cv-eye"
          onClick={onTogglePassword}
          aria-label={showPassword ? "Hide password" : "Show password"}
        ><EyeIcon off={!showPassword} /></button>
      )}
    </span></label>
  );
}
export default function Login() {
  const [activeTab, setActiveTab] = useState("signin");
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("cv_dark_mode") === "true";
  });
  const [login, setLogin] = useState({
    email: "",
    password: "",
  });
  const [register, setRegister] = useState({
    name: "",
    email: "",
    idNo: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [forgotEmail, setForgotEmail] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const clearMessages = () => {
    setMessage("");
    setError("");
  };
  const switchTab = (tab) => {
    clearMessages();
    setActiveTab(tab);
  };
  const toggleDarkMode = () => {
    setDarkMode((current) => {
      const next = !current;
      localStorage.setItem("cv_dark_mode", String(next));
      return next;
    });
  };
  const handleBackHome = () => {
    window.location.href = "/";
  };
  const handleGoogle = () => {
    clearMessages();
    window.location.href = API.google;
  };
  const handleLogin = async (e) => {
    e.preventDefault();
    clearMessages();
    if (!login.email.trim() || !login.password) {
      setError("Enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      if (remember) {
        localStorage.setItem("cv_remember_email", login.email.trim());
      } else {
        localStorage.removeItem("cv_remember_email");
      }
      const response = await fetch(API.login, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: login.email.trim(),
          password: login.password,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Invalid email or password."
        );
      }
      const role = data.user?.role || data.role;
      if (role === "STUDENT") {
        window.location.href = "/student";
      } else if (role === "STAFF") {
        window.location.href = "/staff";
      } else if (role === "ADMIN") {
        window.location.href = "/admin";
      } else if (data.redirect) {
        window.location.href = data.redirect;
      } else {
        window.location.href = "/student";
      }
    } catch (err) {
      setError(err.message || "Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const handleRegister = async (e) => {
    e.preventDefault();
    clearMessages();
    const name = register.name.trim();
    const email = register.email.trim();
    const idNo = register.idNo.trim();
    const phone = register.phone.trim();
    if (!name || !email || !idNo || !phone || !register.password) {
      setError("Please complete all registration fields.");
      return;
    }
    if (register.password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }
    if (register.password !== register.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(API.register, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          email,
          idNo,
          phone,
          password: register.password,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Unable to create your account."
        );
      }
      setMessage(
        data.message ||
        "Account created successfully. Sign in with your email and password."
      );
      setLogin({
        email,
        password: "",
      });
      setRegister({
        name: "",
        email: "",
        idNo: "",
        phone: "",
        password: "",
        confirmPassword: "",
      });
      setActiveTab("signin");
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const handleForgot = async (e) => {
    e.preventDefault();
    clearMessages();
    if (!forgotEmail.trim()) {
      setError("Enter your college email.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(API.forgotPassword, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Unable to process the request."
        );
      }
      setMessage(
        data.message ||
        "If an account exists for this email, password reset instructions have been sent."
      );
    } catch (err) {
      setError(
        err.message ||
        "Password reset is currently unavailable. Please contact the registrar."
      );
    } finally {
      setLoading(false);
    }
  };
  const savedEmail =
    typeof window !== "undefined"
      ? localStorage.getItem("cv_remember_email") || ""
      : "";
  React.useEffect(() => {
    if (savedEmail && !login.email) {
      setLogin((current) => ({ ...current, email: savedEmail }));
      setRemember(true);
    }
  }, []);
  return (
    
    <><style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Libre+Baskerville:wght@400;700&display=swap');:root{--cv-green:#0c8b64;--cv-dark:#13231f;--cv-text:#25312e;--cv-muted:#68716e;--cv-border:rgba(42,53,49,.16);--cv-white:#ffffff;}*{box-sizing:border-box;}html,body,#root{width:100%;height:100%;margin:0;}body{font-family:"DM Sans",Arial,sans-serif;overflow:hidden;background:#17352c;}button,input{font:inherit;}button{-webkit-tap-highlight-color:transparent;}.cv-login-page{position:fixed;inset:0;width:100%;height:100dvh;min-height:600px;overflow:hidden;color:white;background:linear-gradient(90deg,rgba(5,33,24,.28) 0%,rgba(5,33,24,.10) 45%,rgba(5,33,24,.02) 72%),linear-gradient(180deg,rgba(0,20,15,.04),rgba(0,20,15,.12)),url("/rgukt-bg.jpg") center center / cover no-repeat;}.cv-login-page.dark{background:linear-gradient(90deg,rgba(0,10,8,.58) 0%,rgba(0,10,8,.42) 48%,rgba(0,10,8,.35) 100%),linear-gradient(180deg,rgba(0,0,0,.25),rgba(0,0,0,.35)),url("/rgukt-bg.jpg") center center / cover no-repeat;}.cv-page-overlay{position:absolute;inset:0;pointer-events:none;background:linear-gradient( 90deg,rgba(3,27,21,.12) 0%,rgba(3,27,21,.02) 50%,rgba(3,27,21,.04) 100% );}.cv-brand{position:absolute;z-index:3;top:29px;left:5.2%;display:flex;align-items:center;gap:12px;}.cv-brand-mark{width:35px;height:35px;border-radius:6px;display:grid;place-items:center;background:#15211e;color:white;box-shadow:0 2px 8px rgba(0,0,0,.16);}.cv-brand-name{margin:0;font-family:"Libre Baskerville",Georgia,serif;font-size:20px;line-height:1;font-weight:700;letter-spacing:-.3px;}.cv-brand-sub{margin-top:5px;font-size:8.5px;letter-spacing:1.65px;text-transform:uppercase;font-weight:600;opacity:.82;}.cv-university{position:absolute;z-index:3;right:5.1%;top:28px;text-align:right;}.cv-university-name{font-size:13px;font-weight:700;letter-spacing:.25px;}.cv-university-tag{margin-top:7px;font-size:8px;letter-spacing:1.25px;opacity:.72;}.cv-hero{position:absolute;z-index:2;left:5.3%;top:50%;transform:translateY(-50%);width:min(47vw,560px);max-height:calc(100dvh - 180px);}.cv-eyebrow{display:flex;align-items:center;gap:12px;margin-bottom:17px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;}.cv-eyebrow::after{content:"";display:block;width:29px;height:1px;background:rgba(255,255,255,.75);}.cv-hero h1{margin:0;max-width:510px;font-family:"Libre Baskerville",Georgia,serif;font-weight:400;font-size:clamp(39px,4vw,55px);line-height:1.14;letter-spacing:-2px;text-shadow:0 2px 12px rgba(0,0,0,.12);}.cv-hero h1 span{color:#00a96f;}.cv-description{width:min(470px,100%);margin:23px 0 25px;font-size:16px;line-height:1.55;color:rgba(255,255,255,.94);text-shadow:0 1px 7px rgba(0,0,0,.15);}.cv-benefits{display:grid;gap:13px;}.cv-benefit{display:flex;align-items:center;gap:13px;}.cv-benefit-icon{width:42px;height:42px;flex:0 0 42px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.65);border-radius:7px;background:rgba(10,39,31,.10);}.cv-benefit-title{font-size:14px;font-weight:700;line-height:1.2;}.cv-benefit-text{margin-top:3px;font-size:12px;line-height:1.2;opacity:.9;}.cv-quote{margin-top:25px;font-family:"Libre Baskerville",Georgia,serif;font-style:italic;font-size:12px;line-height:1.45;opacity:.82;}.cv-auth-card{position:absolute;z-index:5;top:50%;right:3.7%;transform:translateY(-50%);width:min(460px,39vw);max-height:calc(100dvh - 90px);overflow:hidden;padding:27px 44px 30px;border-radius:17px;color:var(--cv-text);background:rgba(255,255,255,.94);border:1px solid rgba(255,255,255,.65);box-shadow:0 22px 55px rgba(4,31,24,.22);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);}.cv-auth-actions{display:flex;justify-content:flex-end;align-items:center;gap:8px;margin:-9px -9px 17px 0;}.cv-icon-button{width:34px;height:34px;display:grid;place-items:center;border:1px solid #d7dcd9;border-radius:7px;background:rgba(255,255,255,.62);color:#34403b;cursor:pointer;transition:background .18s,border-color .18s,color .18s,transform .18s;}.cv-icon-button:hover{background:#fff;border-color:#bcc5c1;}.cv-icon-button:active{transform:translateY(1px);}.cv-home-button{width:auto;padding:0 11px;display:flex;gap:7px;font-size:12px;font-weight:600;}.cv-auth-card.dark{color:#e9efec;background:rgba(20,29,26,.95);border-color:rgba(255,255,255,.12);box-shadow:0 22px 55px rgba(0,0,0,.42);}.cv-auth-card.dark .cv-icon-button{border-color:rgba(255,255,255,.15);background:rgba(255,255,255,.06);color:#e8efec;}.cv-auth-card.dark .cv-icon-button:hover{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.24);}.cv-auth-card.dark .cv-tabs{border-bottom-color:rgba(255,255,255,.13);}.cv-auth-card.dark .cv-tab{color:#9da8a4;}.cv-auth-card.dark .cv-tab.active{color:#f2f6f4;}.cv-auth-card.dark .cv-tab.active::after{background:#16a875;}.cv-auth-card.dark .cv-welcome,.cv-auth-card.dark .cv-auth-subtitle,.cv-auth-card.dark .cv-label,.cv-auth-card.dark .cv-forgot-description,.cv-auth-card.dark .cv-small-note{color:#aab4b0;}.cv-auth-card.dark .cv-auth-title{color:#f2f6f4;}.cv-auth-card.dark .cv-google{border-color:rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:#e8efec;}.cv-auth-card.dark .cv-google:hover{background:rgba(255,255,255,.11);}.cv-auth-card.dark .cv-divider{color:#9ca7a3;}.cv-auth-card.dark .cv-divider::before,.cv-auth-card.dark .cv-divider::after{background:rgba(255,255,255,.13);}.cv-auth-card.dark .cv-input-wrap input{color:#edf3f0;background:rgba(255,255,255,.055);border-color:rgba(255,255,255,.18);}.cv-auth-card.dark .cv-input-wrap input::placeholder{color:#89938f;}.cv-auth-card.dark .cv-input-wrap input:focus{background:rgba(255,255,255,.08);border-color:#19a978;box-shadow:0 0 0 3px rgba(25,169,120,.14);}.cv-auth-card.dark .cv-input-icon,.cv-auth-card.dark .cv-eye{color:#aab4b0;}.cv-auth-card.dark .cv-remember{color:#c4cdca;}.cv-auth-card.dark .cv-message.error{color:#ffb7b0;background:rgba(150,40,30,.18);border-color:rgba(255,130,120,.25);}.cv-auth-card.dark .cv-message.success{color:#9ce3c6;background:rgba(20,130,90,.16);border-color:rgba(90,210,160,.25);}.cv-auth-card.dark .cv-back-signin{color:#27b985;}.cv-tabs{display:grid;grid-template-columns:repeat(3,1fr);border-bottom:1px solid rgba(55,68,63,.13);margin-bottom:25px;}.cv-tab{position:relative;min-height:34px;padding:0 4px 13px;border:0;background:transparent;color:#7a827f;font-size:13px;font-weight:500;cursor:pointer;}.cv-tab.active{color:#202a27;font-weight:700;}.cv-tab.active::after{content:"";position:absolute;bottom:-1px;left:10%;right:10%;height:2px;background:#18211e;}.cv-welcome{margin-bottom:5px;color:#68736f;font-size:9px;font-weight:700;letter-spacing:1.45px;}.cv-auth-title{margin:0;color:#18211e;font-family:"Libre Baskerville",Georgia,serif;font-size:27px;line-height:1.32;font-weight:700;letter-spacing:-.75px;}.cv-auth-subtitle{margin:9px 0 17px;color:#737c79;font-size:13px;line-height:1.45;}.cv-google{width:100%;height:42px;display:flex;align-items:center;justify-content:center;gap:11px;border:1px solid #d5d9d7;border-radius:5px;background:rgba(255,255,255,.76);color:#2d3633;font-size:14px;font-weight:600;cursor:pointer;transition:background .18s,box-shadow .18s,transform .18s;}.cv-google:hover{background:#fff;box-shadow:0 5px 14px rgba(0,0,0,.07);}.cv-google:active{transform:translateY(1px);}.cv-divider{display:flex;align-items:center;gap:12px;margin:17px 0 16px;color:#707975;font-size:9px;font-weight:600;}.cv-divider::before,.cv-divider::after{content:"";flex:1;height:1px;background:#dfe2e0;}.cv-form{display:grid;gap:12px;}.cv-field{display:block;}.cv-label{display:block;margin-bottom:7px;color:#66706c;font-size:13px;font-weight:500;}.cv-input-wrap{position:relative;display:flex;align-items:center;}.cv-input-icon{position:absolute;left:13px;color:#737d79;pointer-events:none;}.cv-input-wrap input{width:100%;height:44px;padding:0 42px 0 41px;border:1px solid #cfcfca;border-radius:7px;outline:none;color:#28312e;background:rgba(255,255,255,.74);font-size:13px;transition:border-color .18s,box-shadow .18s,background .18s;}.cv-input-wrap input::placeholder{color:#999e9b;}.cv-input-wrap input:focus{border-color:#13885f;box-shadow:0 0 0 3px rgba(19,136,95,.10);background:#fff;}.cv-eye{position:absolute;right:12px;top:50%;transform:translateY(-50%);display:grid;place-items:center;padding:4px;border:0;background:transparent;color:#68736f;cursor:pointer;}.cv-form-options{display:flex;align-items:center;justify-content:space-between;margin-top:-1px;font-size:12px;}.cv-remember{display:flex;align-items:center;gap:8px;color:#38413e;cursor:pointer;}.cv-remember input{width:14px;height:14px;accent-color:#0b9162;cursor:pointer;}.cv-link{color:#087e57;font-weight:600;text-decoration:none;cursor:pointer;}.cv-link:hover{text-decoration:underline;}.cv-submit{width:100%;height:42px;display:flex;align-items:center;justify-content:center;gap:8px;margin-top:5px;border:0;border-radius:6px;background:#17211e;color:white;font-size:14px;font-weight:700;cursor:pointer;transition:background .18s,transform .18s,opacity .18s;}.cv-submit:hover{background:#0c8b64;}.cv-submit:active{transform:translateY(1px);}.cv-submit:disabled,.cv-google:disabled{cursor:not-allowed;opacity:.58;}.cv-message{margin:0 0 13px;padding:10px 12px;border-radius:6px;font-size:12px;line-height:1.35;}.cv-message.error{color:#a3271f;background:#fff0ef;border:1px solid #f2c5c1;}.cv-message.success{color:#08704f;background:#ecfaf4;border:1px solid #bce6d4;}.cv-register-grid{display:grid;grid-template-columns:1fr 1fr;gap:11px 12px;}.cv-register-grid .full{grid-column:1 / -1;}.cv-small-note{margin:-1px 0 1px;color:#7a8380;font-size:10px;line-height:1.4;}.cv-forgot{padding-top:4px;}.cv-forgot-description{margin:10px 0 19px;color:#707a76;font-size:13px;line-height:1.55;}.cv-back-signin{display:block;margin:15px auto 0;padding:4px;border:0;background:transparent;color:#087e57;font-size:12px;font-weight:600;cursor:pointer;}.cv-mobile-brand{display:none;}@media (max-width:1050px){.cv-auth-card{right:2.5%;width:min(430px,42vw);padding-left:32px;padding-right:32px;}.cv-hero{left:4%;width:49vw;}.cv-hero h1{font-size:42px;}}@media (max-width:800px){body{overflow:auto;}.cv-login-page{position:relative;min-height:100dvh;height:auto;overflow:visible;padding:78px 18px 28px;background-position:center center;}.cv-brand{top:20px;left:18px;}.cv-university{display:none;}.cv-hero{position:relative;top:auto;left:auto;transform:none;width:100%;max-height:none;margin:15px auto 28px;max-width:620px;}.cv-hero h1{font-size:39px;}.cv-description{font-size:14px;}.cv-auth-card{position:relative;top:auto;right:auto;transform:none;width:100%;max-width:560px;max-height:none;margin:0 auto;padding:24px;}}@media (max-width:500px){.cv-hero{display:none;}.cv-login-page{display:flex;align-items:center;justify-content:center;min-height:100dvh;padding:65px 12px 18px;}.cv-auth-card{margin:0;border-radius:14px;padding:22px 19px 24px;}.cv-auth-actions{margin-right:0;}.cv-auth-title{font-size:25px;}.cv-register-grid{grid-template-columns:1fr;}.cv-register-grid .full{grid-column:auto;}}`}</style><main className={`cv-login-page ${darkMode ? "dark" : ""}`}><div className="cv-page-overlay" /><div className="cv-brand"><div className="cv-brand-mark"><CheckIcon /></div><div><div className="cv-brand-name">ClearVault</div><div className="cv-brand-sub">Registrar E-Clearance</div></div></div><div className="cv-university"><div className="cv-university-name">RGUKT RK Valley</div><div className="cv-university-tag">
      Knowledge · Innovation · Society
    </div></div><section className="cv-hero" aria-label="ClearVault introduction"><div className="cv-eyebrow">One university. One clearance.</div><h1>
      Digital clearance,
      <br /><span>made simple.</span></h1><p className="cv-description">
          ClearVault brings students and university authorities together on
          one secure, transparent digital clearance platform.
        </p><div className="cv-benefits"><div className="cv-benefit"><div className="cv-benefit-icon"><FileIcon /></div><div><div className="cv-benefit-title">
          One digital clearance process
        </div><div className="cv-benefit-text">
            Apply once, reach all departments
          </div></div></div><div className="cv-benefit"><div className="cv-benefit-icon"><ShieldIcon /></div><div><div className="cv-benefit-title">
            Secure departmental verification
          </div><div className="cv-benefit-text">
              Authenticated and traceable
            </div></div></div><div className="cv-benefit"><div className="cv-benefit-icon"><ChartIcon /></div><div><div className="cv-benefit-title">
              Real-time clearance tracking
            </div><div className="cv-benefit-text">
                Stay updated at every step
              </div></div></div><div className="cv-benefit"><div className="cv-benefit-icon"><AwardIcon /></div><div><div className="cv-benefit-title">
                Verified digital certificates
              </div><div className="cv-benefit-text">
                  No physical visits required
                </div></div></div></div><div className="cv-quote">
          “A smoother tomorrow,
          <br />
          for every RGUKTian.”
        </div></section>
        <div className="cv-auth-actions">
            <button
          type="button"
          className="cv-icon-button cv-home-button"
          onClick={handleBackHome}
          aria-label="Back to home"
          title="Back to home"
        ><HomeIcon /><span>Home</span></button><button
          type="button"
          className="cv-icon-button"
          onClick={toggleDarkMode}
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
            {darkMode ? <SunIcon /> : <MoonIcon />}
          </button>
          </div>
        <section className={`cv-auth-card ${darkMode ? "dark" : ""}`}>
          
          <div className="cv-tabs"><button
            type="button"
            className={`cv-tab ${activeTab === "signin" ? "active" : ""}`}
            onClick={() => switchTab("signin")}
          >
            Sign In
          </button><button
            type="button"
            className={`cv-tab ${activeTab === "register" ? "active" : ""}`}
            onClick={() => switchTab("register")}
          >
            Register
          </button><button
            type="button"
            className={`cv-tab ${activeTab === "forgot" ? "active" : ""}`}
            onClick={() => switchTab("forgot")}
          >
            Forgot Password
          </button></div>
        {message && (
          <div className="cv-message success" role="status">
            {message}
          </div>
        )}
        {error && (
          <div className="cv-message error" role="alert">
            {error}
          </div>
        )}
        {activeTab === "signin" && (
          <><div className="cv-welcome">WELCOME TO CLEARVAULT</div><h2 className="cv-auth-title">Sign in to continue</h2><p className="cv-auth-subtitle">
            Use your RGUKT account to access your clearance dashboard.
          </p><button
            type="button"
            className="cv-google"
            onClick={handleGoogle}
            disabled={loading}
          ><GoogleIcon />
              Continue with Google
            </button><div className="cv-divider">OR</div><form className="cv-form" onSubmit={handleLogin}><Field
              label="Email"
              type="email"
              value={login.email}
              onChange={(value) =>
                setLogin((current) => ({ ...current, email: value }))
              }
              placeholder="you@rguktrkv.ac.in"
              icon={<MailIcon />}
              autoComplete="email"
            /><Field
                label="Password"
                type="password"
                value={login.password}
                onChange={(value) =>
                  setLogin((current) => ({ ...current, password: value }))
                }
                placeholder="Enter your password"
                icon={<LockIcon />}
                autoComplete="current-password"
                showPassword={showLoginPassword}
                onTogglePassword={() =>
                  setShowLoginPassword((current) => !current)
                }
              /><div className="cv-form-options"><label className="cv-remember"><input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
                Remember me
              </label><button
                type="button"
                className="cv-link"
                onClick={() => switchTab("forgot")}
              >
                  Forgot password?
                </button></div><button className="cv-submit" type="submit" disabled={loading}>
                {loading ? "Signing in…" : "Sign in"}
                {!loading && <ArrowIcon />}
              </button></form></>
        )}
        {activeTab === "register" && (
          <><div className="cv-welcome">WELCOME TO CLEARVAULT</div><h2 className="cv-auth-title">Create your account</h2><p className="cv-auth-subtitle">
            Register with your college details to access the clearance
            portal.
          </p><form className="cv-form" onSubmit={handleRegister}><div className="cv-register-grid"><div className="full"><Field
            label="Full name"
            value={register.name}
            onChange={(value) =>
              setRegister((current) => ({
                ...current,
                name: value,
              }))
            }
            placeholder="Enter your full name"
            icon={<UserIcon />}
            autoComplete="name"
          /></div><Field
              label="College email"
              type="email"
              value={register.email}
              onChange={(value) =>
                setRegister((current) => ({
                  ...current,
                  email: value,
                }))
              }
              placeholder="you@rguktrkv.ac.in"
              icon={<MailIcon />}
              autoComplete="email"
            /><Field
              label="ID number"
              value={register.idNo}
              onChange={(value) =>
                setRegister((current) => ({
                  ...current,
                  idNo: value,
                }))
              }
              placeholder="O220854"
              icon={<IdIcon />}
              autoComplete="off"
            /><Field
              label="Phone number"
              type="tel"
              value={register.phone}
              onChange={(value) =>
                setRegister((current) => ({
                  ...current,
                  phone: value,
                }))
              }
              placeholder="10-digit mobile number"
              icon={<PhoneIcon />}
              autoComplete="tel"
            /><Field
              label="Password"
              type="password"
              value={register.password}
              onChange={(value) =>
                setRegister((current) => ({
                  ...current,
                  password: value,
                }))
              }
              placeholder="Create a password"
              icon={<LockIcon />}
              autoComplete="new-password"
              showPassword={showRegisterPassword}
              onTogglePassword={() =>
                setShowRegisterPassword((current) => !current)
              }
            /><Field
              label="Confirm password"
              type="password"
              value={register.confirmPassword}
              onChange={(value) =>
                setRegister((current) => ({
                  ...current,
                  confirmPassword: value,
                }))
              }
              placeholder="Repeat your password"
              icon={<LockIcon />}
              autoComplete="new-password"
              showPassword={showConfirmPassword}
              onTogglePassword={() =>
                setShowConfirmPassword((current) => !current)
              }
            /></div><p className="cv-small-note">
                Use your official RGUKT college email and correct student ID.
              </p><button
                className="cv-submit"
                type="submit"
                disabled={loading}
              >
                {loading ? "Creating account…" : "Create account"}
                {!loading && <ArrowIcon />}
              </button></form></>
        )}
        {activeTab === "forgot" && (
          <div className="cv-forgot"><div className="cv-welcome">ACCOUNT RECOVERY</div><h2 className="cv-auth-title">Forgot your password?</h2><p className="cv-forgot-description">
            Enter the college email associated with your ClearVault
            account. If the account exists, password reset instructions
            will be sent to that address.
          </p><form className="cv-form" onSubmit={handleForgot}><Field
            label="College email"
            type="email"
            value={forgotEmail}
            onChange={setForgotEmail}
            placeholder="you@rguktrkv.ac.in"
            icon={<MailIcon />}
            autoComplete="email"
          /><button
            className="cv-submit"
            type="submit"
            disabled={loading}
          >
                {loading ? "Sending…" : "Send reset instructions"}
                {!loading && <ArrowIcon />}
              </button></form><button
                type="button"
                className="cv-back-signin"
                onClick={() => switchTab("signin")}
              >
              ← Back to sign in
            </button></div>
        )}
      </section></main></>
  );
}