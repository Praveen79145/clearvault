import crypto from "crypto";

const SECRET = process.env.SIGNING_SECRET || "clearvault-demo-signing-secret-2026";

/** Full HMAC-SHA256 signature */
export const sign = (payload) =>
  crypto.createHmac("sha256", SECRET).update(payload).digest("hex");

/** Short human-readable signature block printed on certificates */
export const shortSign = (payload) =>
  sign(payload).slice(0, 16).toUpperCase().replace(/(.{4})(?=.)/g, "$1-");

export const uid = (p) => `${p}_${crypto.randomBytes(5).toString("hex")}`;
export const hashPassword = (pw, salt) => crypto.scryptSync(pw, salt, 32).toString("hex");
