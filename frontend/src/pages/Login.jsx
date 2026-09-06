import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api.js";
import Icon from "../icons.jsx";
import Logo from "../components/Logo.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";

const QUICK = [
  ["Student", "ananya@campus.edu", "student123"],
  ["Library", "library@campus.edu", "staff123"],
  ["Accounts", "accounts@campus.edu", "staff123"],
  ["Admin", "admin@campus.edu", "admin123"],
];

/** Official Google "G" mark (brand-safe multicolor) */
const GoogleMark = () => (
  <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden="true">
    <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.1-.83 2.03-1.78 2.66v2.2h2.88c1.68-1.55 2.66-3.84 2.66-6.5z" />
    <path fill="#34A853" d="M9 18c2.4 0 4.42-.8 5.9-2.18l-2.88-2.2c-.8.53-1.83.85-3.02.85-2.32 0-4.29-1.56-4.99-3.66H1.02v2.28C2.5 15.98 5.48 18 9 18z" />
    <path fill="#FBBC05" d="M4.01 10.8A5.4 5.4 0 0 1 3.73 9c0-.63.1-1.23.28-1.8V4.92H1.02A9 9 0 0 0 0 9c0 1.45.35 2.83 1.02 4.08l2.99-2.28z" />
    <path fill="#EA4335" d="M9 3.55c1.31 0 2.48.45 3.4 1.34l2.55-2.55C13.42.8 11.4 0 9 0 5.48 0 2.5 2.02 1.02 4.92l2.99 2.28C4.71 5.11 6.68 3.55 9 3.55z" />
  </svg>
);

const OAUTH_ERRORS = {
  cancelled: "Sign-in was cancelled before an account was chosen.",
  google_error: 'Google reported an error before sign-in completed.',
  invalid_response: 'Google did not return a usable sign-in response.',
  invalid_state: "Your sign-in attempt expired or didn't match. Please try again.",
  exchange_failed: 'We could not complete the Google token exchange. Please try again.',
  invalid_token: "Google's identity token was invalid or expired. Please sign in again.",
  unverified_email: "That Google account's email address is not verified by Google.",
  not_rgukt: null, // handled specially (needs email)
  server_error: 'Something went wrong on our side while signing you in. Please try again.',
  not_configured: "Google sign-in isn't configured on this deployment yet. Use a demo credential below, or set GOOGLE_CLIENT_ID/SECRET (see GOOGLE_SETUP.md).",
};

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get("email") || "");
  const [password, setPassword] = useState(params.get("pw") || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const oauthCode = params.get("oauth");
  const triedEmail = params.get("email") && params.get("pw") == null && oauthCode ? params.get("email") : null;

  const oauthMessage = (() => {
    if (!oauthCode) return null;
    if (oauthCode === "not_rgukt")
      return `Please sign in using your RGUKT student Google account (for example: r220246@rguktrkv.ac.in).${triedEmail ? ` You chose: ${triedEmail}.` : ""}`;
    return OAUTH_ERRORS[oauthCode] || "Sign-in could not be completed.";
  })();

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const d = await api("/api/auth/login", { method: "POST", body: { email, password } });
      navigate(d.redirect);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left panel — identity */}
      <aside className="hidden lg:flex flex-col justify-between border-r border-line p-10 xl:p-14">
        <Link to="/"><Logo sub="Registrar e-Clearance" /></Link>
        <div>
          <h1 className="display text-4xl xl:text-5xl leading-[1.08]">
            The registrar's office, <em className="not-italic text-brand">open 24×7.</em>
          </h1>
          <ul className="mt-10 space-y-5">
            {[
              ["file-text", "One application covers Library, Hostels, Sports and Accounts"],
              ["pen-line", "Every decision carries a verifiable digital signature"],
              ["qr-code", "Certificates validate publicly — no calls to the office"],
            ].map(([icon, text], i) => (
              <li key={i} className="flex items-start gap-3.5">
                <span className="w-8 h-8 shrink-0 border border-line-strong rounded-md grid place-items-center text-brand">
                  <Icon name={icon} size={15} />
                </span>
                <span className="text-[14px] leading-relaxed text-muted pt-1">{text}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="font-mono text-[11px] text-muted">Ref: Dossier No. CV/2026/REG-011 · Academic Year 2025–26</p>
      </aside>

      {/* Right panel — form */}
      <main className="flex items-center justify-center p-6 relative">
        <div className="absolute top-5 right-5 flex items-center gap-2">
          <ThemeToggle />
          <Link to="/" className="btn btn-outline btn-sm lg:hidden"><Icon name="arrow-left" size={14} /> Home</Link>
        </div>
        <div className="w-full max-w-[400px]">
          <div className="lg:hidden mb-10"><Logo sub="Registrar e-Clearance" /></div>
          <p className="kicker">Secure sign in</p>
          <h2 className="display text-[32px] mt-2 font-semibold">Sign in with your RGUKT account</h2>
          <p className="text-[13.5px] text-muted mt-2 leading-relaxed">
            Use your RGUKT student Google account to continue.
            <br /><span className="font-mono text-[12px] text-ink">[r / o / n / s]XXXXXX@rguktrkv.ac.in</span>
          </p>

          {/* OAuth outcome banner */}
          {oauthMessage && (
            <div className="mt-6 border border-bad/40 bg-bad/5 rounded-[10px] p-4">
              <p className="text-[13px] font-medium text-bad flex gap-2.5 leading-relaxed">
                <Icon name="alert" size={16} className="shrink-0 mt-0.5" /> {oauthMessage}
              </p>
              {oauthCode === "not_rgukt" && (
                <a href="/api/auth/google" className="btn btn-outline btn-sm mt-3">
                  <GoogleMark /> Choose a different account
                </a>
              )}
            </div>
          )}

          {/* Google */}
          <a href="/api/auth/google"
            className="btn btn-outline w-full mt-7 !py-3 !gap-3 !text-[14px] hover:!border-brand">
            <GoogleMark /> Continue with Google
          </a>

          <div className="flex items-center gap-4 my-6">
            <span className="flex-1 h-px bg-line" />
            <span className="kicker !text-[9.5px]">or with a campus credential</span>
            <span className="flex-1 h-px bg-line" />
          </div>

          <form onSubmit={submit}>
            <div>
              <label className="field">Campus email</label>
              <input className="input" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@campus.edu" required />
            </div>
            <div className="mt-4">
              <label className="field">Password</label>
              <input className="input" type="password" value={password}
                onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>

            {error && (
              <p className="mt-4 text-[13px] font-medium text-bad flex items-center gap-2">
                <Icon name="alert" size={15} /> {error}
              </p>
            )}

            <button disabled={busy} className="btn btn-primary w-full mt-6 !py-3">
              {busy ? "Verifying…" : <>Sign in <Icon name="arrow-right" size={15} /></>}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-line">
            <p className="kicker mb-3">Demo quick-fill</p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK.map(([label, e, pw]) => (
                <button key={e} type="button" onClick={() => { setEmail(e); setPassword(pw); setError(""); }}
                  className="text-left px-3.5 py-2.5 border border-line rounded-lg hover:border-line-strong transition text-[13px] font-medium flex items-center justify-between">
                  {label}
                  <Icon name="arrow-right" size={13} className="text-muted" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
