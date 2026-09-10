import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import AuthLayout, { ArrowIcon, AuthField } from "../components/AuthLayout.jsx";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    setMessage("");
    setError("");
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!token) {
      setError("Missing or invalid reset token.");
      return;
    }
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
      const data = await api("/api/auth/reset-password", {
        method: "POST",
        body: { token, password, confirmPassword },
      });
      setMessage(data.message || "Password reset successfully.");
    } catch (err) {
      setError(err.message || "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout message={message} error={error}>
      <div className="cv-forgot">
        <div className="cv-welcome">ACCOUNT RECOVERY</div>
        <h2 className="cv-auth-title">Reset password</h2>
        <p className="cv-forgot-description">Enter your new password below. Password must contain at least 8 characters.</p>

        <form className="cv-form" onSubmit={handleSubmit}>
          <AuthField label="New password" type="password" value={password} onChange={setPassword} placeholder="New password" autoComplete="new-password" />
          <AuthField label="Confirm password" type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Confirm password" autoComplete="new-password" />

          <button className="cv-submit" type="submit" disabled={loading}>
            {loading ? "Resetting…" : "Reset password"}
            {!loading && <ArrowIcon />}
          </button>
        </form>

        <Link to="/login" className="cv-back-signin">← Back to sign in</Link>
      </div>
    </AuthLayout>
  );
}
