// ────────────────────────────────────────────────────────────────────────────
// Google OAuth 2.0 (authorization-code flow) — server-side only.
//   GET /api/auth/google           → redirect to Google account chooser
//   GET /api/auth/google/callback  → exchange code, verify ID token, enforce
//                                    RGUKT policy, create app session
// Every step is logged server-side for debugging. Secrets/tokens are NEVER logged.
// ────────────────────────────────────────────────────────────────────────────
import { Router } from "express";
import crypto from "crypto";
import { validateGoogleIdentity } from "../rgukt.js";
import { upsertGoogleStudent } from "../store.js";
import { setSessionCookie, resolveUserHome } from "../auth.js";

const router = Router();

const isProduction = process.env.NODE_ENV === "production" || (process.env.BACKEND_URL || "").startsWith("https://") || (process.env.FRONTEND_URL || "").startsWith("https://");
const DEFAULT_BACKEND_URL = isProduction ? "https://clearvault-backend.onrender.com" : "http://localhost:4000";
const DEFAULT_FRONTEND_URL = isProduction ? "https://clearvault-alpha.vercel.app" : "http://localhost:5173";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const BACKEND_URL = (process.env.BACKEND_URL || DEFAULT_BACKEND_URL).replace(/\/$/, "");
const FRONTEND_URL = (process.env.FRONTEND_URL || DEFAULT_FRONTEND_URL).replace(/\/$/, "");
const CALLBACK_URL = (process.env.GOOGLE_CALLBACK_URL || `${BACKEND_URL}/api/auth/google/callback`).replace(/\/$/, "");
const STATE_COOKIE = "cv_oauth_state";
const RETURN_COOKIE = "cv_oauth_return";

const normalizeOrigin = (value) => {
  const candidate = String(value || "").trim().replace(/\/$/, "");
  if (!candidate) return FRONTEND_URL;
  try {
    const parsed = new URL(candidate);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return candidate;
  }
};

const parseCookies = (header = "") =>
  Object.fromEntries(
    (header.split(";") || [])
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const idx = part.indexOf("=");
        if (idx === -1) return [part, ""];
        const key = part.slice(0, idx);
        const value = decodeURIComponent(part.slice(idx + 1));
        return [key, value];
      })
  );

const fail = (res, code, extra = "", redirectOrigin = FRONTEND_URL) =>
  res.redirect(`${normalizeOrigin(redirectOrigin)}/login?oauth=${code}${extra}`);
const setCookies = (res, values) => res.setHeader("Set-Cookie", values);
// Step logger — safe fields only (never secrets, tokens, or passwords)
const step = (msg, obj = {}) => {
  const extra = Object.entries(obj).map(([k, v]) => `${k}=${v}`).join(" ");
  console.log(`[google] ${msg}${extra ? " · " + extra : ""}`);
};

// ── Step 1: send the user to Google's real account chooser ──────────────────
router.get("/", (req, res) => {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.warn("[google] start called but GOOGLE_CLIENT_ID/SECRET are not set — see GOOGLE_SETUP.md");
    return fail(res, "not_configured");
  }

  const returnOrigin = normalizeOrigin(
    req.query.returnTo || req.headers.origin || req.headers.referer || FRONTEND_URL
  );
  const state = crypto.randomBytes(16).toString("hex");
  setCookies(res, [
    `${STATE_COOKIE}=${state}; HttpOnly; SameSite=Lax; Path=/; Max-Age=600`,
    `${RETURN_COOKIE}=${encodeURIComponent(returnOrigin)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=600`,
  ]);
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("redirect_uri", CALLBACK_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("prompt", "select_account"); // ALWAYS show the account chooser
  url.searchParams.set("state", state);
  step("start → redirecting to Google account chooser", { callback: CALLBACK_URL, returnOrigin });
  res.redirect(url.toString());
});

// ── Step 2: Google calls us back with an authorization code ─────────────────
router.get("/callback", async (req, res) => {
  const { code, state, error } = req.query;
  step("callback received");

  if (error === "access_denied") { step("user cancelled on the Google screen"); return fail(res, "cancelled"); }
  if (error) { step("google returned an error", { error }); return fail(res, "google_error"); }
  if (!code) { step("callback had no authorization code"); return fail(res, "invalid_response"); }

  // CSRF: the state must match the cookie we set before leaving
  const cookies = parseCookies(req.headers.cookie || "");
  const returnOrigin = normalizeOrigin(cookies[RETURN_COOKIE] || FRONTEND_URL);
  setCookies(res, [
    `${STATE_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`,
    `${RETURN_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`,
  ]);
  if (!state || !cookies[STATE_COOKIE] || state !== cookies[STATE_COOKIE]) {
    step("state mismatch — possible CSRF or expired attempt");
    return fail(res, "invalid_state", "", returnOrigin);
  }
  step("state check passed", { returnOrigin });

  try {
    // Exchange code → tokens (client secret stays here, server-side)
    step("exchanging authorization code for tokens…");
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: String(code),
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: CALLBACK_URL,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) {
      const body = await tokenRes.text().catch(() => "");
      step("token exchange failed", { googleStatus: tokenRes.status, googleError: body.slice(0, 200) });
      return fail(res, "exchange_failed");
    }
    const tokens = await tokenRes.json();
    if (!tokens.id_token) { step("token response had no id_token"); return fail(res, "invalid_token"); }
    step("tokens received (id_token present)");

    // Verify the ID token with Google (checks signature + expiry server-side)
    const infoRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokens.id_token)}`
    );
    if (!infoRes.ok) { step("ID token failed verification (expired or tampered)"); return fail(res, "invalid_token"); }
    const idt = await infoRes.json();

    if (idt.aud !== CLIENT_ID) { step("token audience mismatch", { aud: idt.aud }); return fail(res, "invalid_token"); }
    if (!["https://accounts.google.com", "accounts.google.com"].includes(idt.iss)) {
      step("token issuer mismatch", { iss: idt.iss }); return fail(res, "invalid_token");
    }
    if (Number(idt.exp) * 1000 < Date.now()) { step("token expired"); return fail(res, "invalid_token"); }
    step("Google identity verified", { email: idt.email, emailVerified: idt.email_verified });

    // Policy: verified Google identity + exact RGUKT student email
    const verdict = validateGoogleIdentity({
      sub: idt.sub,
      email: idt.email,
      emailVerified: idt.email_verified === true || idt.email_verified === "true",
      name: idt.name,
      picture: idt.picture,
    });
    if (!verdict.ok) {
      step("RGUKT policy rejected the email", { email: verdict.email || "(none)", reason: verdict.reason });
      const emailParam = verdict.email ? `&email=${encodeURIComponent(verdict.email)}` : "";
      return fail(res, verdict.reason, emailParam, returnOrigin);
    }
    step("RGUKT policy PASS", { campus: verdict.campusPrefix, studentId: verdict.studentId });

    // Provision / refresh the student, then open the app's own session
    let user;
    try {
      user = await upsertGoogleStudent(verdict);
    } catch (dbErr) {
      console.error("[google] ✘ USER LOOKUP/PROVISION FAILED — this is your oauth=server_error cause:", dbErr.message);
      if (/google_sub|picture|column/i.test(dbErr.message))
        console.error("[google] ➜ Your database schema is stale. Run the two ALTER statements at the bottom of backend/supabase/schema.sql in the Supabase SQL Editor.");
      return fail(res, "server_error", "", returnOrigin);
    }
    step("user ready", { userId: user.id, rollNo: user.rollNo, campus: verdict.campusPrefix });

    setSessionCookie(res, user.id);
    const successTarget = `${returnOrigin}/student`;
    step("session created → redirecting", { to: successTarget });
    return res.redirect(successTarget);
  } catch (err) {
    console.error("[google] ✘ CALLBACK EXCEPTION:", err.stack || err.message);
    return fail(res, "server_error", "", returnOrigin);
  }
});

export default router;
