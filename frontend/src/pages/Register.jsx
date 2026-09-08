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
  const [accountType, setAccountType] = useState("STUDENT"); // STUDENT or AUTHORITY
  const [form, setForm] = useState({
    name: "",
    email: "",
    idNo: "",
    phone: "",
    dept: "",
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
    const idNo = form.idNo.trim();
    const password = form.password;
    const confirmPassword = form.confirmPassword;

    if (!name || !idNo || !password || !confirmPassword) {
      setError("Please complete all required fields.");
      return;
    }
    
    if (accountType === "STUDENT") {
      const email = form.email.trim().toLowerCase();
      const phone = form.phone.trim();
      if (!email || !phone) {
        setError("Please complete all registration fields.");
        return;
      }
      if (!email.endsWith("@rguktrkv.ac.in") && !email.endsWith("@rguktong.ac.in")) {
        setError("Please use your official RGUKT college email.");
        return;
      }
    } else {
      if (!form.dept) {
        setError("Please select a department.");
        return;
      }
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
      const payload = {
        accountType,
        name,
        rollNo: idNo,
        password,
        confirmPassword,
      };

      if (accountType === "STUDENT") {
        payload.email = form.email.trim().toLowerCase();
        payload.phone = form.phone.trim();
      } else {
        payload.dept = form.dept;
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || data.message || "Unable to create your account.");
      }

      navigate("/login", {
        state: { message: data.message || "Account created successfully. Sign in to continue.", email: accountType === "STUDENT" ? payload.email : payload.rollNo },
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
      <p className="cv-auth-subtitle">Register to access the clearance portal.</p>

      <div className="flex bg-line/50 p-1 rounded-lg mb-6 max-w-sm ml-0">
        <button
          type="button"
          onClick={() => { setAccountType("STUDENT"); setError(""); }}
          className={`flex-1 text-sm font-medium py-2 rounded-md transition ${accountType === "STUDENT" ? "bg-white shadow-sm text-ink" : "text-muted hover:text-ink"}`}
        >
          Student
        </button>
        <button
          type="button"
          onClick={() => { setAccountType("AUTHORITY"); setError(""); }}
          className={`flex-1 text-sm font-medium py-2 rounded-md transition ${accountType === "AUTHORITY" ? "bg-white shadow-sm text-ink" : "text-muted hover:text-ink"}`}
        >
          Authority
        </button>
      </div>

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

          {accountType === "STUDENT" && (
            <AuthField
              label="College email"
              type="email"
              value={form.email}
              onChange={(value) => updateField("email", value)}
              placeholder="you@rguktrkv.ac.in"
              icon={<MailIcon />}
              autoComplete="email"
            />
          )}

          <AuthField
            label={accountType === "STUDENT" ? "ID number" : "Employee ID"}
            value={form.idNo}
            onChange={(value) => updateField("idNo", value)}
            placeholder={accountType === "STUDENT" ? "O220854" : "EMP-102"}
            icon={<IdIcon />}
            autoComplete="off"
          />

          {accountType === "STUDENT" && (
            <AuthField
              label="Phone number"
              type="tel"
              value={form.phone}
              onChange={(value) => updateField("phone", value)}
              placeholder="10-digit mobile number"
              icon={<PhoneIcon />}
              autoComplete="tel"
            />
          )}

          {accountType === "AUTHORITY" && (
            <div className="cv-field full">
              <label className="text-sm font-medium text-ink block mb-2">Department</label>
              <select
                value={form.dept}
                onChange={(e) => updateField("dept", e.target.value)}
                className="w-full bg-surface border border-line rounded-lg px-4 py-3 text-ink text-sm appearance-none focus:outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/10 transition"
              >
                <option value="" disabled>Select your department</option>
                <option value="FINANCE">Finance / Accounts</option>
                <option value="LIBRARY">Library</option>
                <option value="HOSTEL">Hostel Office</option>
                <option value="SPORTS">Sports Department</option>
                <option value="PHYSICS_LAB">Physics Lab</option>
                <option value="CHEMISTRY_LAB">Chemistry Lab</option>
                <option value="DEAN">Dean Academics</option>
                <option value="AO">Administrative Office</option>
                <option value="DIRECTOR">Director</option>
              </select>
            </div>
          )}

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

        <p className="cv-small-note">
          {accountType === "STUDENT"
            ? "Use your official RGUKT college email and correct student ID."
            : "Use your official Employee ID for authentication."}
        </p>

        <button className="cv-submit" type="submit" disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
          {!loading && <ArrowIcon />}
        </button>
      </form>
    </AuthLayout>
  );
}
