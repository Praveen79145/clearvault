import { Router } from "express";
import { findUserByEmail } from "../store.js";
import { hashPassword } from "../sign.js";
import { setSessionCookie, clearSessionCookie, homeFor, userFromRequest } from "../auth.js";

const router = Router();
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, rollNo: u.rollNo, role: u.role, dept: u.dept, picture: u.picture || null });

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  const user = await findUserByEmail(email || "");
  if (!user || hashPassword(password || "", user.salt) !== user.passwordHash) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  if (user.disabled) return res.status(403).json({ error: "This account has been disabled. Please contact the administrator." });
  setSessionCookie(res, user.id);
  res.json({ ok: true, user: publicUser(user), redirect: homeFor(user.role) });
});

router.post("/logout", (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

router.get("/me", async (req, res) => {
  const user = await userFromRequest(req);
  if (!user) return res.status(401).json({ user: null });
  res.json({ user: publicUser(user) });
});

export default router;
