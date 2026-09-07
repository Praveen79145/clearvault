import React, { useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout, { ArrowIcon, AuthField, MailIcon } from "../components/AuthLayout.jsx";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
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
        const fallback = "Password reset is currently unavailable. Please contact the registrar.";
        throw new Error(data.error || data.message || fallback);
      }

      setMessage(data.message || "If an account exists for this email, password reset instructions have been sent.");
    } catch (err) {
      setError(err.message || "Password reset is currently unavailable. Please contact the registrar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout message={message} error={error}>
      <div className="cv-forgot">
        <div className="cv-welcome">ACCOUNT RECOVERY</div>
        <h2 className="cv-auth-title">Forgot your password?</h2>
        <p className="cv-forgot-description">Enter the college email associated with your ClearVault account. If the account exists, password reset instructions will be sent to that address.</p>

        <form className="cv-form" onSubmit={handleSubmit}>
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
            {loading ? "Sending…" : "Send reset instructions"}
            {!loading && <ArrowIcon />}
          </button>
        </form>

        <Link to="/login" className="cv-back-signin">← Back to sign in</Link>
      </div>
    </AuthLayout>
  );
}
