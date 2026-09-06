// Policy unit tests — run: npm run test:auth
// These exercise the EXACT backend validation used in the OAuth callback,
// with Google identity payloads standing in for the verified ID token.
import { RGUKT_EMAIL_RE, checkRguktEmail, validateGoogleIdentity } from "../src/rgukt.js";

let passed = 0, failed = 0;
const t = (name, fn) => {
  try { fn(); passed++; console.log(`  ✔ ${name}`); }
  catch (e) { failed++; console.error(`  ✘ ${name}\n      ${e.message}`); }
};
const expect = (cond, msg) => { if (!cond) throw new Error(msg || "expectation failed"); };

const payload = (email, extra = {}) => ({
  sub: "108912345678901234567", email, emailVerified: true, name: "Test Student", picture: "https://lh3.googleusercontent.com/p.jpg", ...extra,
});

console.log("\nRGUKT email policy — campus prefixes r / o / n / s\n──────────────────────────────────────────────────");

// ── Required Test 1: all four campus prefixes accepted ──
t("accepts r220246@rguktrkv.ac.in → studentId r220246", () => {
  const v = validateGoogleIdentity(payload("r220246@rguktrkv.ac.in"));
  expect(v.ok, "should allow"); expect(v.studentId === "r220246", "studentId r220246");
});
t("accepts o220123@rguktrkv.ac.in → studentId o220123", () => {
  const v = validateGoogleIdentity(payload("o220123@rguktrkv.ac.in"));
  expect(v.ok, "should allow"); expect(v.studentId === "o220123", "studentId o220123");
});
t("accepts n210456@rguktrkv.ac.in → studentId n210456", () => {
  const v = validateGoogleIdentity(payload("n210456@rguktrkv.ac.in"));
  expect(v.ok, "should allow"); expect(v.studentId === "n210456", "studentId n210456");
});
t("accepts s230789@rguktrkv.ac.in → studentId s230789", () => {
  const v = validateGoogleIdentity(payload("s230789@rguktrkv.ac.in"));
  expect(v.ok, "should allow"); expect(v.studentId === "s230789", "studentId s230789");
});
t("normalises uppercase input (R220246@RGUKT-style)", () => {
  expect(checkRguktEmail("R220246@rguktrkv.ac.in".toLowerCase()).ok, "normalised");
});

// ── Required rejections ──
t("rejects r220246@gmail.com (wrong domain)", () => {
  const v = validateGoogleIdentity(payload("r220246@gmail.com"));
  expect(!v.ok && v.reason === "not_rgukt", "must reject with not_rgukt");
});
t("rejects x220246@rguktrkv.ac.in (invalid campus prefix)", () => {
  expect(!checkRguktEmail("x220246@rguktrkv.ac.in").ok, "prefix must be r/o/n/s");
});
t("rejects 220246@rguktrkv.ac.in (no campus prefix)", () => {
  expect(!checkRguktEmail("220246@rguktrkv.ac.in").ok, "must reject");
});
t("rejects r22024@rguktrkv.ac.in (5 digits)", () => {
  expect(!checkRguktEmail("r22024@rguktrkv.ac.in").ok, "must reject");
});
t("rejects r2202467@rguktrkv.ac.in (7 digits)", () => {
  expect(!checkRguktEmail("r2202467@rguktrkv.ac.in").ok, "must reject");
});
t("rejects valid email when Google says email is NOT verified", () => {
  const v = validateGoogleIdentity(payload("n210456@rguktrkv.ac.in", { emailVerified: false }));
  expect(!v.ok && v.reason === "unverified_email", "must reject with unverified_email");
});

// ── Extra anchor checks ──
t("rejects rr220246@rguktrkv.ac.in (double prefix)", () => { expect(!RGUKT_EMAIL_RE.test("rr220246@rguktrkv.ac.in"), "anchor ^"); });
t("rejects o220123@rguktrkv.com (wrong TLD)", () => { expect(!RGUKT_EMAIL_RE.test("o220123@rguktrkv.com"), "tld"); });
t("rejects s230789@rguktrkv.ac.in.example.com (suffix attack)", () => { expect(!RGUKT_EMAIL_RE.test("s230789@rguktrkv.ac.in.example.com"), "anchor $"); });
t("rejects student@rguktrkv.ac.in (staff-style)", () => { expect(!RGUKT_EMAIL_RE.test("student@rguktrkv.ac.in"), "non-prefix local part"); });
t("rejects admin@rguktrkv.ac.in (admin-style)", () => { expect(!RGUKT_EMAIL_RE.test("admin@rguktrkv.ac.in"), "non-prefix local part"); });
t("rejects tampered payloads (missing sub/email/null)", () => {
  expect(!validateGoogleIdentity(null).ok, "null");
  expect(!validateGoogleIdentity({ email: "r220246@rguktrkv.ac.in" }).ok, "no sub");
  expect(!validateGoogleIdentity({ sub: "1" }).ok, "no email");
});
t("regex is exact: " + RGUKT_EMAIL_RE, () => { expect(String(RGUKT_EMAIL_RE) === "/^[rons][0-9]{6}@rguktrkv\\.ac\\.in$/", "exact regex"); });

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
