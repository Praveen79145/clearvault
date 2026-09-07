import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout, {
  ArrowIcon,
  AuthField,
  IdIcon,
  LockIcon,
  MailIcon,
  PhoneIcon,
  UserIcon,
} from "../components/AuthLayout.jsx";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    idNo: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const idNo = form.idNo.trim();
    const phone = form.phone.trim();
    const password = form.password;
    const confirmPassword = form.confirmPassword;

    if (!name || !email || !idNo || !phone || !password || !confirmPassword) {
      setError("Please complete all registration fields.");
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
    if (!email.endsWith("@rguktrkv.ac.in")) {
      setError("Please use your official RGUKT college email.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          email,
          rollNo: idNo,
          phone,
          password,
          confirmPassword,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || data.message || "Unable to create your account.");
      }

      navigate("/login", {
        state: { message: data.message || "Account created successfully. Sign in to continue.", email },
      });
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout error={error}>
      <div className="cv-welcome">WELCOME TO CLEARVAULT</div>
      <h2 className="cv-auth-title">Create your account</h2>
      <p className="cv-auth-subtitle">Register with your college details to access the clearance portal.</p>

      <form className="cv-form" onSubmit={handleSubmit}>
        <div className="cv-register-grid">
          <div className="full">
            <AuthField
              label="Full name"
              value={form.name}
              onChange={(value) => updateField("name", value)}
              placeholder="Enter your full name"
              icon={<UserIcon />}
              autoComplete="name"
            />
          </div>

          <AuthField
            label="College email"
            type="email"
            value={form.email}
            onChange={(value) => updateField("email", value)}
            placeholder="you@rguktrkv.ac.in"
            icon={<MailIcon />}
            autoComplete="email"
          />

          <AuthField
            label="ID number"
            value={form.idNo}
            onChange={(value) => updateField("idNo", value)}
            placeholder="O220854"
            icon={<IdIcon />}
            autoComplete="off"
          />

          <AuthField
            label="Phone number"
            type="tel"
            value={form.phone}
            onChange={(value) => updateField("phone", value)}
            placeholder="10-digit mobile number"
            icon={<PhoneIcon />}
            autoComplete="tel"
          />

          <AuthField
            label="Password"
            type="password"
            value={form.password}
            onChange={(value) => updateField("password", value)}
            placeholder="Create a password"
            icon={<LockIcon />}
            autoComplete="new-password"
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword((current) => !current)}
          />

          <AuthField
            label="Confirm password"
            type="password"
            value={form.confirmPassword}
            onChange={(value) => updateField("confirmPassword", value)}
            placeholder="Repeat your password"
            icon={<LockIcon />}
            autoComplete="new-password"
            showPassword={showConfirmPassword}
            onTogglePassword={() => setShowConfirmPassword((current) => !current)}
          />
        </div>

        <p className="cv-small-note">Use your official RGUKT college email and correct student ID.</p>

        <button className="cv-submit" type="submit" disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
          {!loading && <ArrowIcon />}
        </button>
      </form>
    </AuthLayout>
  );
}
