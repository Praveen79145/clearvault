import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout, { ArrowIcon, AuthField, MailIcon, LockIcon, EyeIcon } from "../components/AuthLayout.jsx";

export function ForgotPasswordForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    const cleanedEmail = email.trim().toLowerCase();
    if (!cleanedEmail) {
      setError("Enter your college email.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanedEmail }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Unable to verify email.");
      }

      setMessage(data.message || "Email verified. You may now reset your password.");
      setStep("password");
    } catch (err) {
      setError(err.message || "Unable to verify email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    const cleanedEmail = email.trim().toLowerCase();
    if (!password) {
      setError("Enter a new password.");
      return;
    }
    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanedEmail, password, confirmPassword }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || data.message || "Unable to update password.");
      }

      setMessage("Password updated successfully. You can now sign in with your new password.");
      setTimeout(() => {
        navigate("/login", { state: { message: "Password updated successfully. You can now sign in with your new password.", email: cleanedEmail } });
      }, 1500);
    } catch (err) {
      setError(err.message || "Unable to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cv-forgot">
      {step === "email" ? (
        <>
          <div className="cv-welcome">ACCOUNT RECOVERY</div>
          <h2 className="cv-auth-title">Forgot your password?</h2>
          <p className="cv-forgot-description">Enter your college email associated with your ClearVault account. If the account exists, you will be able to reset your password.</p>

          <form className="cv-form" onSubmit={handleEmailSubmit}>
            <AuthField
              label="College email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@rguktrkv.ac.in"
              icon={<MailIcon />}
              autoComplete="email"
            />

            <button className="cv-submit" type="submit" disabled={loading}>
              {loading ? "Verifying…" : "Continue"}
              {!loading && <ArrowIcon />}
            </button>
          </form>
        </>
      ) : (
        <>
          <div className="cv-welcome">ACCOUNT RECOVERY</div>
          <h2 className="cv-auth-title">Create a new password</h2>
          <p className="cv-forgot-description">Enter your new password below.</p>

          <form className="cv-form" onSubmit={handlePasswordSubmit}>
            <AuthField
              label="New password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="Enter new password"
              icon={<LockIcon />}
              autoComplete="new-password"
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword((current) => !current)}
            />

            <AuthField
              label="Confirm password"
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Confirm new password"
              icon={<LockIcon />}
              autoComplete="new-password"
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword((current) => !current)}
            />

            <button className="cv-submit" type="submit" disabled={loading}>
              {loading ? "Updating…" : "Update password"}
              {!loading && <ArrowIcon />}
            </button>
          </form>
        </>
      )}

      <Link to="/login" className="cv-back-signin">← Back to sign in</Link>
      {message && <div className="cv-message success" role="status">{message}</div>}
      {error && <div className="cv-message error" role="alert">{error}</div>}
    </div>
  );
}

export default function ForgotPassword() {
  return <AuthLayout><ForgotPasswordForm /></AuthLayout>;
}
