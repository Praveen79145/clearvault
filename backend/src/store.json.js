// ────────────────────────────────────────────────────────────────────────────
// JSON-FILE IMPLEMENTATION (demo default). Same async interface as
// store.supabase.js — the dispatcher in store.js picks one at boot.
// Departments & workflows come from ./departments.js + ./requestTypes.js.
// ────────────────────────────────────────────────────────────────────────────
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { shortSign, uid, hashPassword } from "./sign.js";
import { DEPTS, deptById, normDept } from "./departments.js";
import { REQUEST_TYPES, requestTypeOf, requiredDeptsForRequest } from "./requestTypes.js";

export { DEPTS };

const DATA_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "data", "db.json");

const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();
const hoursAgo = (n) => new Date(Date.now() - n * 3600000).toISOString();

const mkUser = (name, email, pw, role, dept, rollNo, extra = {}) => {
  const salt = crypto.randomBytes(8).toString("hex");
  return { name, email, role, dept, rollNo, salt, passwordHash: hashPassword(pw, salt), ...extra };
};

const ALL_OFFICES = ["FINANCE", "LIBRARY", "HOSTEL", "SPORTS", "PHYSICS_LAB", "CHEMISTRY_LAB", "DEAN", "AO", "DIRECTOR"];
const signedApproval = (requestId, dept, rollNo, officer, at, remarks) => ({
  id: uid("clr"), requestId, dept, status: "APPROVED", remarks,
  approvedBy: officer, signedAt: at, signatureHash: shortSign(`${rollNo}|${dept}|${at}`),
});

function seed() {
  const mk = (n, e, p, r, d, ro, x) => ({ id: uid("usr"), ...mkUser(n, e, p, r, d, ro, x) });
  const users = [
    // Students
    mk("Ananya Verma", "ananya@campus.edu", "student123", "STUDENT", null, "CS22B1047"),
    mk("Rohan Mehta", "rohan@campus.edu", "student123", "STUDENT", null, "EC22B0913"),
    mk("Karan Patel", "karan@campus.edu", "student123", "STUDENT", null, "ME21B0755",
      { dues: {
        FINANCE: [{ label: "Semester 6 tuition instalment", amount: 2500 }],
        LIBRARY: [{ label: "Overdue: 'Signals & Systems' — 18 days", amount: 120 }],
      } }),
    mk("Zoya Khan", "zoya@campus.edu", "student123", "STUDENT", null, "BT23B0621",
      { dues: { HOSTEL: [{ label: "Mess bill — July", amount: 1800 }] } }),
    // Officers (one account per office)
    mk("P. Ramesh", "finance@campus.edu", "staff123", "STAFF", "FINANCE"),
    mk("Meera Krishnan", "library@campus.edu", "staff123", "STAFF", "LIBRARY"),
    mk("Rajan Iyer", "hostel@campus.edu", "staff123", "STAFF", "HOSTEL"),
    mk("Divya Nair", "sports@campus.edu", "staff123", "STAFF", "SPORTS"),
    mk("Dr. K. Varma", "physics@campus.edu", "staff123", "STAFF", "PHYSICS_LAB"),
    mk("Dr. L. Shenoy", "chemistry@campus.edu", "staff123", "STAFF", "CHEMISTRY_LAB"),
    mk("Prof. A. Reddy", "dean@campus.edu", "staff123", "STAFF", "DEAN"),
    mk("G. Menon", "ao@campus.edu", "staff123", "STAFF", "AO"),
    mk("Dr. (Prof.) V. Iyer", "director@campus.edu", "staff123", "STAFF", "DIRECTOR"),
    // Legacy aliases so older docs/credentials keep working (same offices)
    mk("Farhan Ali", "accounts@campus.edu", "staff123", "STAFF", "FINANCE"),
    mk("Warden Desk", "hostels@campus.edu", "staff123", "STAFF", "HOSTEL"),
    // Admin
    mk("Dr. S. Rao", "admin@campus.edu", "admin123", "ADMIN"),
  ];
  const rohan = users[1];
  const karan = users[2];
  const byDept = Object.fromEntries(users.filter((u) => u.role === "STAFF").map((u) => [normDept(u.dept), u]));

  const db = { users, requests: [], clearances: [], notifications: [], audit: [] };
  const pushAudit = (actorName, action, detail, at) =>
    db.audit.push({ id: uid("aud"), actorName, action, detail, createdAt: at || new Date().toISOString() });

  // ── Rohan: COMPLETED Graduation Clearance, all 9 offices signed off ──
  const r1 = { id: uid("req"), studentId: rohan.id, purpose: "Final Year / Graduation Clearance", createdAt: daysAgo(4), completedAt: daysAgo(2), certificateCode: "CV-26-R4J8KX" };
  db.requests.push(r1);
  ALL_OFFICES.forEach((d, i) => {
    const at = daysAgo(2.6 - i * 0.05);
    db.clearances.push(signedApproval(r1.id, d, rohan.rollNo, byDept[d].name, at, "Verified — no dues."));
  });
  pushAudit("Rohan Mehta", "REQUEST_CREATED", "Final Year / Graduation Clearance", daysAgo(4));
  pushAudit("System", "CERTIFICATE_ISSUED", "Certificate CV-26-R4J8KX issued to Rohan Mehta", daysAgo(2));

  // ── Karan: IN-PROGRESS Graduation Clearance — 3 cleared, 6 pending ──
  const r2 = { id: uid("req"), studentId: karan.id, purpose: "Final Year / Graduation Clearance", createdAt: hoursAgo(20) };
  db.requests.push(r2);
  for (const d of ALL_OFFICES) {
    if (["FINANCE", "LIBRARY", "SPORTS"].includes(d)) {
      const at = hoursAgo(12);
      db.clearances.push(signedApproval(r2.id, d, karan.rollNo, byDept[d].name, at, "Cleared."));
    } else {
      db.clearances.push({ id: uid("clr"), requestId: r2.id, dept: d, status: "PENDING", dues: r2 && karan.dues ? (karan.dues[d] || null) : null });
    }
  }
  pushAudit("Karan Patel", "REQUEST_CREATED", "Final Year / Graduation Clearance", hoursAgo(20));

  // ── Zoya: CANCELLED hostel-vacating filing (history + read-only demo) ──
  const r3 = {
    id: uid("req"), studentId: users[3].id, purpose: "Hostel Vacating Clearance",
    createdAt: daysAgo(1.2), cancelledAt: daysAgo(1), cancelledBy: "Student",
    cancellationReason: "Submitted by mistake — selected the wrong semester while filing.",
  };
  db.requests.push(r3);
  db.clearances.push({ id: uid("clr"), requestId: r3.id, dept: "HOSTEL", status: "PENDING" }); // frozen, never actionable
  pushAudit("Zoya Khan", "REQUEST_CANCELLED",
    "Hostel Vacating Clearance — reason: Submitted by mistake — selected the wrong semester while filing.", daysAgo(1));

  db.notifications.push({ id: uid("ntf"), userId: rohan.id, type: "success", isRead: false, message: "Graduation Clearance fully approved — certificate CV-26-R4J8KX is ready.", createdAt: daysAgo(2) });
  return db;
}

function load() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    const fresh = seed();
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(fresh, null, 2));
    return fresh;
  }
}

const db = load();
const save = () => fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));

export const notify = (userId, message, type = "info") => {
  db.notifications.unshift({ id: uid("ntf"), userId, message, type, isRead: false, createdAt: new Date().toISOString() });
  save();
};
export const audit = (actorName, action, detail) => {
  db.audit.unshift({ id: uid("aud"), actorName, action, detail, createdAt: new Date().toISOString() });
  save();
};

const publicUser = (u) => u && { id: u.id, name: u.name, email: u.email, rollNo: u.rollNo, role: u.role, dept: normDept(u.dept), picture: u.picture || null };

/**
 * Google sign-in provisioning: existing RGUKT student → refresh Google fields;
 * new RGUKT email → create a STUDENT account with roll number = studentId.
 * (Password is random — Google sign-in is the only way into these accounts.)
 */
export async function upsertGoogleStudent({ email, studentId, campusPrefix, profile }) {
  let user = db.users.find((u) => u.email === email);
  if (user) {
    user.name = profile.name || user.name;
    user.picture = profile.picture || user.picture || null;
    user.googleSub = profile.googleSub;
    user.campus = campusPrefix;
    if (!user.rollNo) user.rollNo = studentId.toUpperCase();
  } else {
    const salt = crypto.randomBytes(8).toString("hex");
    user = {
      id: uid("usr"), name: profile.name, email, role: "STUDENT", dept: null,
      rollNo: studentId.toUpperCase(), campus: campusPrefix, picture: profile.picture || null,
      googleSub: profile.googleSub, salt,
      passwordHash: hashPassword(crypto.randomBytes(16).toString("hex"), salt),
    };
    db.users.push(user);
    // Auxiliary writes must never block sign-in
    try { notify(user.id, "Welcome to ClearVault. Raise your first clearance request from the dashboard.", "info"); }
    catch (e) { console.warn("[store] welcome notification failed (non-fatal):", e.message); }
  }
  try { audit(user.name, "GOOGLE_LOGIN", `RGUKT Google sign-in (${email}, campus ${campusPrefix})`); }
  catch (e) { console.warn("[store] audit write failed (non-fatal):", e.message); }
  save();
  return user;
}

// ─── Interface (async) ──────────────────────────────────────────────────────
export async function findUserByEmail(email) {
  return db.users.find((u) => u.email === String(email).toLowerCase()) || null;
}
export async function findUserById(id) {
  return db.users.find((u) => u.id === id) || null;
}
export async function findRequestById(id) {
  return db.requests.find((r) => r.id === id) || null;
}
export async function findClearanceById(id) {
  return db.clearances.find((c) => c.id === id) || null;
}
export async function getActiveRequest(studentId) {
  return db.requests.filter((r) => r.studentId === studentId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] || null;
}
/** All requests of one student, newest first, with type + approval progress */
export async function listStudentRequests(studentId) {
  const mine = db.requests
    .filter((r) => r.studentId === studentId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const out = [];
  for (const r of mine) {
    const cs = db.clearances.filter((c) => c.requestId === r.id);
    const total = requiredDeptsForRequest(r).length;
    out.push({
      ...r,
      type: requestTypeOf(r),
      overall: await overallStatus(r.id),
      total,
      cleared: cs.filter((c) => c.status === "APPROVED").length,
    });
  }
  return out;
}
export async function clearancesFor(requestId) {
  return db.clearances
    .filter((c) => c.requestId === requestId)
    .sort((a, b) => requiredDeptsForRequest(db.requests.find((r) => r.id === requestId)).indexOf(normDept(a.dept)) - requiredDeptsForRequest(db.requests.find((r) => r.id === requestId)).indexOf(normDept(b.dept)));
}
export async function overallStatus(requestId) {
  const req = db.requests.find((r) => r.id === requestId);
  if (!req) return "IN_PROGRESS";
  if (req.cancelledAt) return "CANCELLED";               // terminal — nothing can revive it
  const cs = db.clearances.filter((c) => c.requestId === requestId);
  // Backend rule: EVERY mandatory office must be CLEARED — nothing else counts.
  const allCleared = requiredDeptsForRequest(req).every((d) =>
    cs.some((c) => normDept(c.dept) === d && c.status === "APPROVED"));
  if (allCleared) return "COMPLETED";
  if (cs.some((c) => c.status === "REJECTED")) return "ACTION_REQUIRED";
  return "IN_PROGRESS";
}
export async function deptQueue(dept) {
  const mine = normDept(dept);
  return db.clearances
    .filter((c) => normDept(c.dept) === mine)
    .map((c) => {
      const request = db.requests.find((r) => r.id === c.requestId);
      return {
        ...c, dept: normDept(c.dept), request,
        type: requestTypeOf(request),
        student: publicUser(db.users.find((u) => u.id === request.studentId)),
        // Cancelled files stay visible (read-only history) but never actionable
        requestCancelled: !!request.cancelledAt,
        cancellationReason: request.cancellationReason || null,
      };
    })
    // Pending approvals of cancelled requests leave the active queue entirely
    .filter((c) => !(c.requestCancelled && c.status === "PENDING"))
    .sort((a, b) => (a.status === "PENDING" ? 0 : 1) - (b.status === "PENDING" ? 0 : 1) || b.request.createdAt.localeCompare(a.request.createdAt));
}

/** Create a request and its approval tasks — ONLY for the offices the workflow requires. */
export async function createRequest(student, typeObj) {
  const req = { id: uid("req"), studentId: student.id, purpose: typeObj.purpose, createdAt: new Date().toISOString() };
  db.requests.push(req);
  for (const d of typeObj.requires) {
    db.clearances.push({
      id: uid("clr"), requestId: req.id, dept: d, status: "PENDING",
      dues: (student.dues && student.dues[d]) || null,
    });
  }
  notify(student.id, `${typeObj.title} filed — routed to ${typeObj.requires.length} ${typeObj.requires.length === 1 ? "office" : "offices"}.`);
  audit(student.name, "REQUEST_CREATED", `${typeObj.title} · requires ${typeObj.requires.join(", ")}`);
  save();
  return req;
}

export async function decide(clearanceId, approve, remarks, staff) {
  const clearance = db.clearances.find((c) => c.id === clearanceId);
  const req = db.requests.find((r) => r.id === clearance.requestId);
  // Cancelled/completed files are frozen — no approval operation may land on them.
  if (req.cancelledAt) throw new Error("This request was cancelled by the student — approvals are closed.");
  if (req.completedAt || req.certificateCode) throw new Error("This request is already completed.");
  if (clearance.status !== "PENDING") throw new Error("This clearance has already been decided.");
  const student = db.users.find((u) => u.id === req.studentId);
  const prevStatus = clearance.status;
  clearance.status = approve ? "APPROVED" : "REJECTED";
  clearance.remarks = remarks || (approve ? "No dues found." : "");
  clearance.approvedBy = staff.name;
  clearance.signedAt = new Date().toISOString();
  clearance.signatureHash = approve ? shortSign(`${student.rollNo}|${clearance.dept}|${clearance.signedAt}`) : undefined;
  const deptName = deptById(clearance.dept).name;
  const newStatus = approve ? "CLEARED" : "REJECTED";
  notify(student.id, approve
    ? `${deptName} cleared your request. Sign-off ${clearance.signatureHash}`
    : `${deptName} returned your request: “${remarks}”. Resolve the due and re-apply.`,
    approve ? "success" : "danger");
  audit(staff.name, approve ? "CLEARANCE_CLEARED" : "CLEARANCE_REJECTED",
    `${deptName} · ${prevStatus} → ${newStatus} · ${student.name} (${student.rollNo}) — ${clearance.remarks}`);
  if ((await overallStatus(req.id)) === "COMPLETED" && !req.completedAt) {
    req.completedAt = new Date().toISOString();
    req.certificateCode = "CV-26-" + crypto.randomBytes(3).toString("hex").toUpperCase();
    notify(student.id, `All mandatory approvals cleared. Certificate ${req.certificateCode} issued.`, "success");
    audit("System", "CERTIFICATE_ISSUED", `Certificate ${req.certificateCode} issued to ${student.name}`);
  }
  save();
}

export async function reapply(clearanceId, student) {
  const clearance = db.clearances.find((c) => c.id === clearanceId);
  const req = db.requests.find((r) => r.id === clearance.requestId);
  if (req.cancelledAt) throw new Error("This request was cancelled — re-application is closed.");
  if (req.completedAt) throw new Error("This request is already completed.");
  clearance.status = "PENDING";
  clearance.remarks = undefined;
  clearance.dues = undefined;
  clearance.approvedBy = undefined;
  clearance.signedAt = undefined;
  clearance.signatureHash = undefined;
  const deptName = deptById(clearance.dept).name;
  notify(student.id, `Re-application sent to ${deptName}.`);
  audit(student.name, "CLEARANCE_REAPPLIED", deptName);
  save();
}

/**
 * Cancel a student's own request (backend-enforced guards, synchronous ⇒ race-safe):
 *  belongs to caller (checked by route) · not already cancelled · never completed
 *  · certificate never issued. The row STAYS in the db (audit/history), only its
 *  leftover PENDING approvals become inactive.
 */
export async function cancelRequest(requestId, student, reason) {
  const req = db.requests.find((r) => r.id === requestId);
  if (!req) throw new Error("Request not found");
  if (req.cancelledAt) throw new Error("This request has already been cancelled.");
  if (req.completedAt || req.certificateCode)
    throw new Error("This request is complete and its certificate has been issued — it can no longer be cancelled.");
  req.cancelledAt = new Date().toISOString();
  req.cancelledBy = "Student";
  req.cancellationReason = reason || null;
  notify(student.id, `You cancelled ${req.purpose}.${reason ? ` Reason: “${reason}”.` : ""} You may file a new request anytime.`, "info");
  audit(student.name, "REQUEST_CANCELLED",
    `${req.purpose}${reason ? ` — reason: ${reason}` : " — no reason given"}`);
  save();
  return req;
}

export async function notificationsFor(userId) {
  const notifications = db.notifications.filter((n) => n.userId === userId).slice(0, 20);
  return { notifications, unread: notifications.filter((n) => !n.isRead).length };
}
export async function markNotificationsRead(userId) {
  db.notifications.forEach((n) => { if (n.userId === userId) n.isRead = true; });
  save();
}

// ─── Admin: officer management ──────────────────────────────────────────────
export async function listOfficers() {
  return db.users
    .filter((u) => u.role === "STAFF")
    .map((u) => ({
      id: u.id, name: u.name, email: u.email, dept: normDept(u.dept),
      deptName: deptById(u.dept).name, officerTitle: deptById(u.dept).officerTitle,
      disabled: !!u.disabled,
    }));
}
export async function createOfficer({ name, email, dept, password }) {
  email = String(email || "").trim().toLowerCase();
  if (!name?.trim() || !email) throw new Error("Name and email are required");
  if (!DEPTS.find((d) => d.id === dept)) throw new Error("Unknown department");
  if (db.users.find((u) => u.email === email)) throw new Error("An account with this email already exists");
  const u = { id: uid("usr"), ...mkUser(name.trim(), email, password || "officer123", "STAFF", dept) };
  db.users.push(u);
  audit("Admin", "OFFICER_CREATED", `${name} → ${deptById(dept).officerTitle} (${deptById(dept).name})`);
  save();
  return { id: u.id };
}
export async function setOfficerDisabled(id, disabled) {
  const u = db.users.find((x) => x.id === id && x.role === "STAFF");
  if (!u) throw new Error("Officer not found");
  u.disabled = !!disabled;
  audit("Admin", disabled ? "OFFICER_DISABLED" : "OFFICER_ENABLED", `${u.name} (${deptById(u.dept).name})`);
  save();
  return { ok: true };
}

export async function adminStats() {
  const requests = db.requests.map((r) => {
    const s = db.users.find((u) => u.id === r.studentId);
    return { ...r, overall: undefined, student: { name: s.name, rollNo: s.rollNo } };
  });
  for (const r of requests) r.overall = await overallStatus(r.id);
  const completed = requests.filter((r) => r.overall === "COMPLETED");
  const avgHours = completed.length
    ? completed.reduce((a, r) => a + (new Date(r.completedAt) - new Date(r.createdAt)) / 3600000, 0) / completed.length : 0;
  return {
    totals: {
      requests: requests.length,
      completed: completed.length,
      inProgress: requests.filter((r) => r.overall === "IN_PROGRESS").length,
      actionRequired: requests.filter((r) => r.overall === "ACTION_REQUIRED").length,
      avgHours: Math.round(avgHours * 10) / 10,
      students: db.users.filter((u) => u.role === "STUDENT").length,
      staff: db.users.filter((u) => u.role === "STAFF").length,
    },
    deptStats: DEPTS.map((d) => ({
      ...d,
      pending: db.clearances.filter((c) => normDept(c.dept) === d.id && c.status === "PENDING").length,
      approved: db.clearances.filter((c) => normDept(c.dept) === d.id && c.status === "APPROVED").length,
      rejected: db.clearances.filter((c) => normDept(c.dept) === d.id && c.status === "REJECTED").length,
    })),
    recentRequests: requests.slice().reverse().slice(0, 8),
  };
}

export async function auditList() {
  return db.audit.slice(0, 50);
}

export async function verifyCertificate(code) {
  const request = db.requests.find((r) => r.certificateCode?.toLowerCase() === code.toLowerCase());
  if (!request) return null;
  const student = db.users.find((u) => u.id === request.studentId);
  return {
    certificateCode: request.certificateCode,
    purpose: request.purpose,
    issuedAt: request.completedAt,
    student: { name: student.name, rollNo: student.rollNo },
    signoffs: (await clearancesFor(request.id)).map((c) => ({
      dept: deptById(c.dept).name,
      approvedBy: c.approvedBy,
      signedAt: c.signedAt,
      signatureHash: c.signatureHash,
    })),
  };
}
