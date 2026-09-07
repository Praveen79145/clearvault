import { Router } from "express";

import {
  findUserByEmail,
  registerStudent,
} from "../store.js";

import { hashPassword } from "../sign.js";

import {
  setSessionCookie,
  clearSessionCookie,
  homeFor,
  userFromRequest,
} from "../auth.js";

const router = Router();

const publicUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  rollNo: u.rollNo,
  role: u.role,
  dept: u.dept,
  picture: u.picture || null,
});

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({
        error: "Email and password are required.",
      });
    }

    const user = await findUserByEmail(normalizedEmail);

    if (
      !user ||
      hashPassword(String(password), user.salt) !== user.passwordHash
    ) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    if (user.disabled) {
      return res.status(403).json({
        error:
          "This account has been disabled. Please contact the administrator.",
      });
    }

    setSessionCookie(res, user.id);

    return res.json({
      ok: true,
      user: publicUser(user),
      redirect: homeFor(user.role),
    });
  } catch (err) {
    console.error("[auth/login]", err);

    return res.status(500).json({
      error: "Unable to login. Please try again.",
    });
  }
});

// ─────────────────────────────────────────────
// REGISTER STUDENT
// ─────────────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const {
      name,
      fullName,
      email,
      collegeEmail,
      idNo,
      studentId,
      rollNo,
      phone,
      password,
      confirmPassword,
    } = req.body || {};

    const finalName = String(name || fullName || "").trim();

    const finalEmail = String(
      email || collegeEmail || ""
    )
      .trim()
      .toLowerCase();

    const finalRollNo = String(
      idNo || studentId || rollNo || ""
    ).trim();

    const finalPhone = String(phone || "").trim();

    // Required fields
    if (!finalName) {
      return res.status(400).json({
        error: "Full name is required.",
      });
    }

    if (!finalEmail) {
      return res.status(400).json({
        error: "College email is required.",
      });
    }

    if (!finalRollNo) {
      return res.status(400).json({
        error: "Student ID is required.",
      });
    }

    if (!finalPhone) {
      return res.status(400).json({
        error: "Phone number is required.",
      });
    }

    if (!password) {
      return res.status(400).json({
        error: "Password is required.",
      });
    }

    if (!confirmPassword) {
      return res.status(400).json({
        error: "Please confirm your password.",
      });
    }

    // Password validation
    if (password.length < 8) {
      return res.status(400).json({
        error: "Password must contain at least 8 characters.",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        error: "Passwords do not match.",
      });
    }

    // RGUKT email validation
    if (!finalEmail.endsWith("@rguktrkv.ac.in")) {
      return res.status(400).json({
        error: "Please use your official RGUKT college email.",
      });
    }

    // Check duplicate email
    const existingEmail = await findUserByEmail(finalEmail);

    if (existingEmail) {
      return res.status(409).json({
        error: "An account with this email already exists.",
      });
    }

    // Create student
    const user = await registerStudent({
      name: finalName,
      email: finalEmail,
      rollNo: finalRollNo,
      phone: finalPhone,
      password: String(password),
    });

    return res.status(201).json({
      ok: true,
      message: "Account created successfully.",
      user: publicUser(user),
    });
  } catch (err) {
    console.error("[auth/register]", err);

    const message = String(err?.message || "");
    if (/already exists|already registered/i.test(message)) {
      return res.status(409).json({
        error: message,
      });
    }

    return res.status(500).json({
      error: message || "Unable to create account. Please try again.",
    });
  }
});

// ─────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────
router.post("/logout", (_req, res) => {
  clearSessionCookie(res);

  res.json({
    ok: true,
  });
});

// ─────────────────────────────────────────────
// CURRENT USER
// ─────────────────────────────────────────────
router.get("/me", async (req, res) => {
  try {
    const user = await userFromRequest(req);

    if (!user) {
      return res.status(401).json({
        user: null,
      });
    }

    return res.json({
      user: publicUser(user),
    });
  } catch (err) {
    console.error("[auth/me]", err);

    return res.status(500).json({
      error: "Unable to fetch user session.",
    });
  }
});

export default router;