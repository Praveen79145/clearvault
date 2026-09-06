// ────────────────────────────────────────────────────────────────────────────
// RGUKT email policy + Google identity validation — single source of truth,
// unit-testable (see scripts/test-rgukt.js). Backend enforces; UI only hints.
// ────────────────────────────────────────────────────────────────────────────

/** Exact student format: campus prefix r/o/n/s + 6 digits @ rguktrkv.ac.in */
export const RGUKT_EMAIL_RE = /^[rons][0-9]{6}@rguktrkv\.ac\.in$/;

export const RGUKT_EMAIL_HINT = "r220246@rguktrkv.ac.in";

export function checkRguktEmail(rawEmail) {
  const email = String(rawEmail || "").trim().toLowerCase();
  if (!RGUKT_EMAIL_RE.test(email)) return { ok: false, email };
  const studentId = email.split("@")[0];        // e.g. o220123
  const campusPrefix = studentId[0];            // e.g. "o" — dynamic, never hardcoded
  return { ok: true, email, studentId, campusPrefix };
}

/**
 * Decide whether a verified Google identity payload may sign in.
 * payload = the fields we extracted from Google's verified ID token.
 * Returns { ok, email, studentId, profile } or { ok:false, reason, email? }.
 */
export function validateGoogleIdentity(payload) {
  if (!payload || typeof payload !== "object")
    return { ok: false, reason: "invalid_token" };
  if (!payload.sub || !payload.email)
    return { ok: false, reason: "invalid_token" };
  if (payload.emailVerified !== true)
    return { ok: false, reason: "unverified_email", email: payload.email };
  const check = checkRguktEmail(payload.email);
  if (!check.ok)
    return { ok: false, reason: "not_rgukt", email: String(payload.email).toLowerCase() };
  return {
    ok: true,
    email: check.email,
    studentId: check.studentId,
    campusPrefix: check.campusPrefix,
    profile: {
      googleSub: payload.sub,
      name: payload.name || check.studentId.toUpperCase(),
      picture: payload.picture || null,
    },
  };
}
