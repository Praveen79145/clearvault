import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || "no-reply@clearvault.local";

let transporter = null;
if (SMTP_HOST && SMTP_PORT) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
}

export async function sendResetEmail(to, link) {
  const subject = "ClearVault password reset";
  const text = `You requested a password reset for your ClearVault account.\n\n` +
    `Open the following link to reset your password:\n\n${link}\n\nIf you didn't request this, you can ignore this message.`;

  if (!transporter) {
    console.log(`[mailer] SMTP not configured — reset link for ${to}: ${link}`);
    return { ok: true, info: "logged" };
  }

  const info = await transporter.sendMail({ from: EMAIL_FROM, to, subject, text });
  return { ok: true, info };
}

export default { sendResetEmail };
