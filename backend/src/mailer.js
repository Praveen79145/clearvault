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

  try {
    const info = await transporter.sendMail({ from: EMAIL_FROM, to, subject, text });
    return { ok: true, info };
  } catch (error) {
    console.warn("[mailer] sendResetEmail failed:", error?.message || error);
    return { ok: false, error };
  }
}

export async function sendStatusEmail(to, subject, message) {
  const text = String(message || "").trim();
  const html = `
    <div style="font-family: Arial, sans-serif; line-height:1.6; color:#1a1a1a; background:#f7faf8; padding:24px;">
      <div style="max-width:600px; margin:0 auto; background:#ffffff; border:1px solid #e3e8e5; border-radius:12px; overflow:hidden;">
        <div style="background:#0c8b64; color:#ffffff; padding:18px 24px; font-weight:700; letter-spacing:0.04em;">
          ClearVault
        </div>
        <div style="padding:24px;">
          <h2 style="margin:0 0 12px; font-size:24px; color:#11251d;">${subject}</h2>
          <p style="margin:0; white-space:pre-wrap;">${(text || "No details provided.").replace(/\n/g, "<br/>")}</p>
        </div>
        <div style="padding:0 24px 24px; font-size:12px; color:#66736d;">
          This is an automated message from ClearVault.
        </div>
      </div>
    </div>
  `;

  if (!transporter) {
    console.log(`[mailer] SMTP not configured — status email for ${to}: ${subject}`);
    return { ok: true, info: "logged" };
  }

  try {
    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      text,
      html,
    });
    return { ok: true, info };
  } catch (error) {
    console.warn("[mailer] sendStatusEmail failed:", error?.message || error);
    return { ok: false, error };
  }
}

export async function sendTemplateEmail(to, { subject, html, text } = {}) {
  const plainText = text || (html ? html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "");

  if (!transporter) {
    console.log(`[mailer] SMTP not configured — template email for ${to}: ${subject}`);
    return { ok: true, info: "logged" };
  }

  try {
    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      text: plainText,
      html,
    });
    return { ok: true, info };
  } catch (error) {
    console.warn("[mailer] sendTemplateEmail failed:", error?.message || error);
    return { ok: false, error };
  }
}

export default { sendResetEmail, sendStatusEmail, sendTemplateEmail };
