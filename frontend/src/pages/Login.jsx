import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthLayout, {
  ArrowIcon,
  AuthField,
  GoogleIcon,
  LockIcon,
  MailIcon,
} from "../components/AuthLayout.jsx";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [login, setLogin] = useState({ email: "", password: "" });
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(location.state?.message || "");
  const [error, setError] = useState("");

  useEffect(() => {
    // Priority: explicit demo-account navigation state -> URL query params -> remembered email
    const params = new URLSearchParams(location.search);
    const qEmail = params.get("email") || "";
    const qPassword = params.get("pw") || "";

    const state = location.state || {};
    const demoEmail = state.demoEmail || state.email || "";
    const demoPassword = state.demoPassword || state.pw || "";

    if (demoEmail || demoPassword) {
      setLogin((current) => ({ ...current, email: demoEmail, password: demoPassword }));
      setRemember(Boolean(demoEmail));
      return;
    }

    if (qEmail || qPassword) {
      setLogin((current) => ({ ...current, email: qEmail, password: qPassword }));
      setRemember(Boolean(qEmail));
      return;
    }

    const saved = typeof window !== "undefined" ? localStorage.getItem("cv_remember_email") || "" : "";
    if (saved) {
      setLogin((current) => ({ ...current, email: saved }));
      setRemember(true);
    }
  }, [location.search, location.state, login.email]);

  const clearMessages = () => {
    setMessage("");
    setError("");
  };

  const handleGoogle = () => {
    clearMessages();
    window.location.href = "/api/auth/google";
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    clearMessages();

    const email = login.email.trim();
    const password = login.password;

    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      if (remember) {
        localStorage.setItem("cv_remember_email", email);
      } else {
        localStorage.removeItem("cv_remember_email");
      }

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || data.message || "Invalid email or password.");
      }

      navigate(data.redirect || "/student", { replace: true });
    } catch (err) {
      setError(err.message || "Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout message={message} error={error}>
      <div className="cv-welcome">WELCOME TO CLEARVAULT</div>
      <h2 className="cv-auth-title">Sign in to continue</h2>
      <p className="cv-auth-subtitle">Use your RGUKT account to access your clearance dashboard.</p>

      <button type="button" className="cv-google" onClick={handleGoogle} disabled={loading}>
        <GoogleIcon />
        Continue with Google
      </button>

      <div className="cv-divider">OR</div>

      <form className="cv-form" onSubmit={handleLogin}>
        <AuthField
          label="Email or Employee ID"
          type="text"
          value={login.email}
          onChange={(value) => setLogin((current) => ({ ...current, email: value }))}
          placeholder="you@rguktrkv.ac.in or EMP-102"
          icon={<MailIcon />}
          autoComplete="username"
        />

        <AuthField
          label="Password"
          type="password"
          value={login.password}
          onChange={(value) => setLogin((current) => ({ ...current, password: value }))}
          placeholder="Enter your password"
          icon={<LockIcon />}
          autoComplete="current-password"
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword((current) => !current)}
        />

        <div className="cv-form-options">
          <label className="cv-remember">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            Remember me
          </label>

          <button type="button" className="cv-link" onClick={() => navigate("/forgot-password")}>
            Forgot password?
          </button>
        </div>

        <button className="cv-submit" type="submit" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
          {!loading && <ArrowIcon />}
        </button>
      </form>
    </AuthLayout>
  );
}
