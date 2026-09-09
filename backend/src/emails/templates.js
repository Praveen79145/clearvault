export function requestFiledTemplate({ username, purpose, dashboardLink }) {
  const name = username || "Student";
  const link = dashboardLink || "#";

  return {
    subject: "ClearVault — request received",
    html: `
      <div style="font-family: Arial, sans-serif; background:#f4f8f5; padding:32px 16px;">
        <div style="max-width:620px; margin:0 auto; background:#ffffff; border:1px solid #e0e8e3; border-radius:14px; overflow:hidden;">
          <div style="background:#0c8b64; color:#ffffff; padding:18px 24px; font-weight:700; letter-spacing:0.05em;">
            ClearVault
          </div>
          <div style="padding:28px 24px 18px;">
            <h2 style="margin:0 0 12px; color:#15352c; font-size:26px;">Request received</h2>
            <p style="margin:0 0 16px; color:#37514b; font-size:16px; line-height:1.7;">
              Hello ${name},
            </p>
            <p style="margin:0 0 16px; color:#37514b; font-size:15px; line-height:1.7;">
              Your request for <strong>${purpose}</strong> has been filed successfully and routed to the required departments.
            </p>
            <p style="margin:0 0 24px; color:#37514b; font-size:15px; line-height:1.7;">
              You can track it from your dashboard and monitor department updates in real time.
            </p>
            <div style="text-align:center; margin:0 0 18px;">
              <a href="${link}" style="display:inline-block; background:#0c8b64; color:#ffffff; text-decoration:none; padding:12px 22px; border-radius:8px; font-weight:600;">
                Open Dashboard
              </a>
            </div>
          </div>
          <div style="padding:0 24px 24px; font-size:12px; color:#64756e; text-align:center;">
            This is an automated message from ClearVault.
          </div>
        </div>
      </div>
    `,
  };
}

export function decisionTemplate({ username, approved, deptName, remarks, dashboardLink }) {
  const name = username || "Student";
  const link = dashboardLink || "#";
  const action = approved ? "approved" : "returned";
  const outcomeText = approved
    ? "Your request has been approved by the department."
    : "Your request needs attention before it can proceed.";
  const remarkText = remarks && String(remarks).trim()
    ? String(remarks).trim()
    : approved
      ? "No additional remarks were provided."
      : "No remarks were provided by the reviewer.";

  return {
    subject: approved ? "ClearVault — approval update" : "ClearVault — action required",
    html: `
      <div style="font-family: Arial, sans-serif; background:#f4f8f5; padding:32px 16px;">
        <div style="max-width:620px; margin:0 auto; background:#ffffff; border:1px solid #e0e8e3; border-radius:14px; overflow:hidden;">
          <div style="background:#0c8b64; color:#ffffff; padding:18px 24px; font-weight:700; letter-spacing:0.05em;">
            ClearVault
          </div>
          <div style="padding:28px 24px 18px;">
            <h2 style="margin:0 0 12px; color:#15352c; font-size:26px;">
              ${approved ? "Request approved" : "Action required"}
            </h2>
            <p style="margin:0 0 16px; color:#37514b; font-size:16px; line-height:1.7;">
              Hello ${name},
            </p>
            <p style="margin:0 0 16px; color:#37514b; font-size:15px; line-height:1.7;">
              Your clearance request was ${action} by <strong>${deptName}</strong>.
            </p>
            <p style="margin:0 0 16px; color:#37514b; font-size:15px; line-height:1.7;">
              ${outcomeText}
            </p>
            <div style="background:#f3f7f5; border-left:4px solid #0c8b64; padding:14px 16px; margin:0 0 18px; border-radius:6px; color:#2f453f;">
              <strong>Comment:</strong> ${remarkText}
            </div>
            <div style="text-align:center; margin:0 0 18px;">
              <a href="${link}" style="display:inline-block; background:#0c8b64; color:#ffffff; text-decoration:none; padding:12px 22px; border-radius:8px; font-weight:600;">
                View Request
              </a>
            </div>
          </div>
          <div style="padding:0 24px 24px; font-size:12px; color:#64756e; text-align:center;">
            This is an automated message from ClearVault.
          </div>
        </div>
      </div>
    `,
  };
}

export function certificateTemplate({ username, code, downloadLink }) {
  const name = username || "Student";
  const link = downloadLink || "#";

  return {
    subject: "ClearVault — certificate issued",
    html: `
      <div style="font-family: Arial, sans-serif; background:#f4f8f5; padding:32px 16px;">
        <div style="max-width:620px; margin:0 auto; background:#ffffff; border:1px solid #e0e8e3; border-radius:14px; overflow:hidden;">
          <div style="background:#0c8b64; color:#ffffff; padding:18px 24px; font-weight:700; letter-spacing:0.05em;">
            ClearVault
          </div>
          <div style="padding:28px 24px 18px;">
            <h2 style="margin:0 0 12px; color:#15352c; font-size:26px;">Certificate issued</h2>
            <p style="margin:0 0 16px; color:#37514b; font-size:16px; line-height:1.7;">
              Hello ${name},
            </p>
            <p style="margin:0 0 18px; color:#37514b; font-size:15px; line-height:1.7;">
              Your clearance has been completed and a certificate has been issued successfully.
            </p>
            <div style="background:#edf8f4; border:1px solid #cfe5dc; border-radius:10px; padding:14px 16px; margin:0 0 18px; color:#1c3a32;">
              <strong>Certificate code:</strong> ${code}
            </div>
            <div style="text-align:center; margin:0 0 18px;">
              <a href="${link}" style="display:inline-block; background:#0c8b64; color:#ffffff; text-decoration:none; padding:12px 22px; border-radius:8px; font-weight:600;">
                Download Certificate
              </a>
            </div>
          </div>
          <div style="padding:0 24px 24px; font-size:12px; color:#64756e; text-align:center;">
            This is an automated message from ClearVault.
          </div>
        </div>
      </div>
    `,
  };
}

export function cancelledTemplate({ username, purpose, reason }) {
  const name = username || "Student";
  const reasonText = reason && String(reason).trim() ? String(reason).trim() : "No reason was provided.";

  return {
    subject: "ClearVault — request cancelled",
    html: `
      <div style="font-family: Arial, sans-serif; background:#f4f8f5; padding:32px 16px;">
        <div style="max-width:620px; margin:0 auto; background:#ffffff; border:1px solid #e0e8e3; border-radius:14px; overflow:hidden;">
          <div style="background:#0c8b64; color:#ffffff; padding:18px 24px; font-weight:700; letter-spacing:0.05em;">
            ClearVault
          </div>
          <div style="padding:28px 24px 18px;">
            <h2 style="margin:0 0 12px; color:#15352c; font-size:26px;">Request cancelled</h2>
            <p style="margin:0 0 16px; color:#37514b; font-size:16px; line-height:1.7;">
              Hello ${name},
            </p>
            <p style="margin:0 0 16px; color:#37514b; font-size:15px; line-height:1.7;">
              Your <strong>${purpose}</strong> request has been cancelled successfully.
            </p>
            <div style="background:#f5f2ef; border-left:4px solid #b66f42; padding:14px 16px; margin:0 0 18px; border-radius:6px; color:#453a2e;">
              <strong>Reason:</strong> ${reasonText}
            </div>
            <p style="margin:0; color:#37514b; font-size:15px; line-height:1.7;">
              You can submit a new request at any time from the dashboard.
            </p>
          </div>
          <div style="padding:0 24px 24px; font-size:12px; color:#64756e; text-align:center;">
            This is an automated message from ClearVault.
          </div>
        </div>
      </div>
    `,
  };
}
