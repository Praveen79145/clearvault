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
import { computeDues, normalizeDues, inr } from "./dues.js";

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
    // Students — new demo set (10)
    mk("B Praveen", "o220854@rguktrkv.ac.in", "student123", "STUDENT", null, "O220854", { meta: { campus: "rguktrkv" } }),
    mk("C Kiran", "r220007@rguktrkv.ac.in", "student123", "STUDENT", null, "R220007", { meta: { campus: "rguktrkv" } }),
    mk("M Mahesh", "r220921@rguktrkv.ac.in", "student123", "STUDENT", null, "R220921", { dues: Object.fromEntries(["FINANCE","LIBRARY","HOSTEL","SPORTS","PHYSICS_LAB","CHEMISTRY_LAB","DEAN","AO","DIRECTOR"].map((d) => [d, { v: 2, status: "NO_DUES", total: 0, checkedAt: new Date().toISOString(), lines: [] } ])), meta: { campus: "rguktrkv" } }),
    mk("Nikhil Rao", "r220112@rguktrkv.ac.in", "student123", "STUDENT", null, "R220112", { FINANCE: { v: 2, lines: [ { label: "Tuition fee", detail: "Semester instalment unpaid", amount: 15000 } ], total: 15000, status: "DUES_FOUND" }, meta: { phone: "+91-7700010112", campus: "rguktrkv" } }),
    mk("Priya Sharma", "r220113@rguktrkv.ac.in", "student123", "STUDENT", null, "R220113", { LIBRARY: { v: 2, lines: [ { label: "Books pending", detail: "2 titles past due", value: "2", amount: 700 } ], books: [ { id: "LIB-2026-02001", name: "Algorithms", issueDate: "2026-06-01", dueDate: "2026-06-15", amount: 350, status: "PENDING" }, { id: "LIB-2026-02002", name: "Discrete Math", issueDate: "2026-06-03", dueDate: "2026-06-17", amount: 350, status: "PENDING" } ], total: 700, status: "DUES_FOUND" }, meta: { phone: "+91-7700010113", campus: "rguktrkv" } }),
    mk("Rahul Gupta", "r220114@rguktrkv.ac.in", "student123", "STUDENT", null, "R220114", { HOSTEL: { v: 2, lines: [ { label: "Hostel dues", detail: "Room rent — July", amount: 3000 } ], total: 3000, status: "DUES_FOUND" }, meta: { phone: "+91-7700010114", campus: "rguktrkv" } }),
    mk("Sangeeta Rao", "r220115@rguktrkv.ac.in", "student123", "STUDENT", null, "R220115", { SPORTS: { v: 2, lines: [ { label: "Equipment charges", detail: "Replacement racket", amount: 1200 } ], total: 1200, status: "DUES_FOUND" }, meta: { phone: "+91-7700010115", campus: "rguktrkv" } }),
    mk("Vikram Singh", "r220116@rguktrkv.ac.in", "student123", "STUDENT", null, "R220116", { PHYSICS_LAB: { v: 2, lines: [ { label: "Equipment unreturned", detail: "Oscilloscope lead", amount: 600 } ], total: 600, status: "DUES_FOUND" }, meta: { phone: "+91-7700010116", campus: "rguktrkv" } }),
    mk("Anita Das", "r220117@rguktrkv.ac.in", "student123", "STUDENT", null, "R220117", { CHEMISTRY_LAB: { v: 2, lines: [ { label: "Breakage charge", detail: "Cracked beaker", amount: 1200 } ], total: 1200, status: "DUES_FOUND" }, FINANCE: { v: 2, lines: [ { label: "Tuition fee", detail: "Partial instalment unpaid", amount: 5000 } ], total: 5000, status: "DUES_FOUND" }, meta: { phone: "+91-7700010117", campus: "rguktrkv" } }),
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
  // Demo history participants: choose seeded indexes for completed/in-progress/cancelled
  const completedStudent = users[2]; // M Mahesh (NO DUES)
  const inProgressStudent = users[3]; // Nikhil Rao
  const byDept = Object.fromEntries(users.filter((u) => u.role === "STAFF").map((u) => [normDept(u.dept), u]));

  const db = { users, requests: [], clearances: [], notifications: [], audit: [], payments: [], passwordResets: [] };
  const pushAudit = (actorName, action, detail, at) =>
    db.audit.push({ id: uid("aud"), actorName, action, detail, createdAt: at || new Date().toISOString() });

  // ── Completed demo: M Mahesh — NO DUES across all offices, certificate issued
  const r1 = { id: uid("req"), studentId: completedStudent.id, purpose: "Final Year / Graduation Clearance", createdAt: daysAgo(4), completedAt: daysAgo(2), certificateCode: "CV-26-R4J8KX" };
  db.requests.push(r1);
  ALL_OFFICES.forEach((d, i) => {
    const at = daysAgo(2.6 - i * 0.05);
    db.clearances.push({ ...signedApproval(r1.id, d, completedStudent.rollNo, byDept[d].name, at, "Verified — no dues."),
      dues: computeDues({ rollNo: completedStudent.rollNo, dept: d, checkedAt: at }) });
  });
  pushAudit(completedStudent.name, "REQUEST_CREATED", "Final Year / Graduation Clearance", daysAgo(4));
  pushAudit("System", "CERTIFICATE_ISSUED", `Certificate CV-26-R4J8KX issued to ${completedStudent.name}`, daysAgo(2));

  // ── In-progress demo: Nikhil Rao — some cleared, others pending
  const r2 = { id: uid("req"), studentId: inProgressStudent.id, purpose: "Final Year / Graduation Clearance", createdAt: hoursAgo(20) };
  db.requests.push(r2);
  for (const d of ALL_OFFICES) {
    if (["FINANCE", "LIBRARY", "SPORTS"].includes(d)) {
      const at = hoursAgo(12);
      db.clearances.push({ ...signedApproval(r2.id, d, inProgressStudent.rollNo, byDept[d].name, at, "Cleared."),
        dues: computeDues({ rollNo: inProgressStudent.rollNo, dept: d, checkedAt: at }) });
    } else {
      // Pending steps keep the dues snapshot the officer will review
      db.clearances.push({ id: uid("clr"), requestId: r2.id, dept: d, status: "PENDING",
        dues: computeDues({ rollNo: inProgressStudent.rollNo, dept: d, checkedAt: r2.createdAt }) });
    }
  }
  pushAudit(inProgressStudent.name, "REQUEST_CREATED", "Final Year / Graduation Clearance", hoursAgo(20));

  // ── Zoya: CANCELLED hostel-vacating filing (history + read-only demo) ──
  const r3 = {
    id: uid("req"), studentId: users[4].id, purpose: "Hostel Vacating Clearance",
    createdAt: daysAgo(1.2), cancelledAt: daysAgo(1), cancelledBy: "Student",
    cancellationReason: "Submitted by mistake — selected the wrong semester while filing.",
  };
  db.requests.push(r3);
  db.clearances.push({ id: uid("clr"), requestId: r3.id, dept: "HOSTEL", status: "PENDING",
    dues: computeDues({ rollNo: users[3].rollNo, dept: "HOSTEL", checkedAt: r3.createdAt }) }); // frozen, never actionable
  pushAudit("Zoya Khan", "REQUEST_CANCELLED",
    "Hostel Vacating Clearance — reason: Submitted by mistake — selected the wrong semester while filing.", daysAgo(1));

  db.notifications.push({ id: uid("ntf"), userId: completedStudent.id, type: "success", isRead: false, message: "Graduation Clearance fully approved — certificate CV-26-R4J8KX is ready.", createdAt: daysAgo(2) });
  return db;
}

// ── Demo payment helpers (JSON store) ─────────────────────────────────────
export async function createPaymentRecord({ studentId, dept, amount, duesRecordId, razorpayOrderId }) {
  const p = { id: uid("pay"), studentId, dept, amount, duesRecordId, razorpayOrderId, paymentStatus: "CREATED", createdAt: new Date().toISOString() };
  db.payments.push(p);
  save();
  return p;
}

export async function findPaymentByOrder(orderId) {
  return db.payments.find((p) => p.razorpayOrderId === orderId) || null;
}

export async function markPaymentPaid({ razorpayOrderId, razorpayPaymentId }) {
  const p = db.payments.find((x) => x.razorpayOrderId === razorpayOrderId);
  if (!p) throw new Error("Payment record not found");
  if (p.paymentStatus === "PAID") return p;
  p.paymentStatus = "PAID";
  p.razorpayPaymentId = razorpayPaymentId;
  p.paidAt = new Date().toISOString();

  // If this payment is tied to a clearance row, mark that clearance as cleared for demo purposes.
  if (p.duesRecordId) {
    const clr = db.clearances.find((c) => c.id === p.duesRecordId);
    if (clr) {
      // Clear the dues snapshot so officers/students see NO_DUES afterwards.
      clr.dues = { v: 2, status: "NO_DUES", total: 0, checkedAt: new Date().toISOString(), lines: CLEAN_LINES[clr.dept] ? CLEAN_LINES[clr.dept]() : [] };
      // If library, also clear any demo books attached to this student's clearance
      if (clr.dept === "LIBRARY") clr.books = [];
    }
  }

  save();
  return p;
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
export async function findUserByIdentifier(identifier) {
  const norm = String(identifier || "").trim().toLowerCase();
  return db.users.find((u) => String(u.email||"").toLowerCase() === norm || String(u.rollNo||"").toLowerCase() === norm) || null;
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

export async function getStudentDues(studentId, dept) {
  const student = db.users.find((u) => u.id === studentId);
  const roll = student?.rollNo || null;
  // Use the most recent request if any — the stored clearance snapshot is authoritative
  const requests = db.requests.filter((r) => r.studentId === studentId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const req = requests[0] || null;
  let clearance = null;
  if (req) {
    clearance = db.clearances.find((c) => c.requestId === req.id && normDept(c.dept) === normDept(dept)) || null;
  }
  if (clearance) {
    const dues = normalizeDues(clearance.dues, { rollNo: roll, dept: normDept(dept), checkedAt: clearance.dues?.checkedAt || req?.createdAt });
    // If this clearance had books stored (demo), include them on the returned record
    const out = { dues, clearance };
    if (clearance.books) out.books = clearance.books;
    return out;
  }
  // No active clearance — compute a stable per-student fixture
  const dues = computeDues({ rollNo: roll, dept: normDept(dept) });
  return { dues, clearance: null };
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
    const order = requiredDeptsForRequest(r);
    const sortedClearances = [...cs].sort(
      (a, b) => order.indexOf(normDept(a.dept)) - order.indexOf(normDept(b.dept))
    );

    out.push({
      ...r,
      type: requestTypeOf(r),
      overall: await overallStatus(r.id),
      total,
      cleared: cs.filter((c) => c.status === "APPROVED").length,
      clearances: sortedClearances,
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
      const student = db.users.find((u) => u.id === request.studentId);
      return {
        ...c, dept: normDept(c.dept), request,
        // The officer always reviews a CANONICAL dues snapshot (legacy arrays
        // and pre-migration rows are upgraded on read — see src/dues.js).
        dues: normalizeDues(c.dues, { rollNo: student?.rollNo, dept: mine, checkedAt: request.createdAt }),
        type: requestTypeOf(request),
        student: publicUser(student),
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
      // Per-request department dues snapshot — generated server-side and
      // frozen onto the clearance so the officer's review stays auditable.
      dues: computeDues({ rollNo: student.rollNo, dept: d, checkedAt: req.createdAt }),
    });
  }
  notify(student.id, `${typeObj.title} filed — routed to ${typeObj.requires.length} ${typeObj.requires.length === 1 ? "office" : "offices"}.`);
  audit(student.name, "REQUEST_CREATED", `${typeObj.title} · requires ${typeObj.requires.join(", ")}`);
  save();
  return req;
}

export async function decide(clearanceId, approve, remarks, staff, duesAcknowledged = false) {
  const clearance = db.clearances.find((c) => c.id === clearanceId);
  const req = db.requests.find((r) => r.id === clearance.requestId);
  // Cancelled/completed files are frozen — no approval operation may land on them.
  if (req.cancelledAt) throw new Error("This request was cancelled by the student — approvals are closed.");
  if (req.completedAt || req.certificateCode) throw new Error("This request is already completed.");
  if (clearance.status !== "PENDING") throw new Error("This clearance has already been decided.");
  const student = db.users.find((u) => u.id === req.studentId);
  const deptName = deptById(clearance.dept).name;

  // ── Dues gate (server-side): the snapshot stored on this clearance decides.
  // An officer may never silently approve a file with outstanding dues — the
  // only path is an EXPLICIT acknowledgement (duesAcknowledged=true), which we
  // record on the snapshot as a waiver so the decision remains auditable.
  const duesInfo = normalizeDues(clearance.dues, { rollNo: student.rollNo, dept: clearance.dept, checkedAt: req.createdAt });
  if (approve && duesInfo.total > 0) {
    if (!duesAcknowledged)
      throw new Error(`Outstanding dues of ${inr(duesInfo.total)} on record with ${deptName} — approval is blocked. Confirm settlement (explicit acknowledgement) or reject with a comment.`);
    clearance.dues = { ...duesInfo, waived: { by: staff.name, at: new Date().toISOString(), total: duesInfo.total } };
  } else {
    clearance.dues = duesInfo; // persist the exact snapshot that was reviewed
  }

  const prevStatus = clearance.status;
  clearance.status = approve ? "APPROVED" : "REJECTED";
  clearance.remarks = remarks || (approve
    ? (duesInfo.total > 0 ? `Dues of ${inr(duesInfo.total)} verified as settled — waived on record.` : "No dues found.")
    : "");
  clearance.approvedBy = staff.name;
  clearance.signedAt = new Date().toISOString();
  clearance.signatureHash = approve ? shortSign(`${student.rollNo}|${clearance.dept}|${clearance.signedAt}`) : undefined;
  const newStatus = approve ? "CLEARED" : "REJECTED";
  notify(student.id, approve
    ? `${deptName} cleared your request. Sign-off ${clearance.signatureHash}`
    : `${deptName} returned your request: “${remarks}”. Resolve the due and re-apply.`,
    approve ? "success" : "danger");
  audit(staff.name, approve ? "CLEARANCE_CLEARED" : "CLEARANCE_REJECTED",
    `${deptName} · ${prevStatus} → ${newStatus} · ${student.name} (${student.rollNo}) — ${clearance.remarks}` +
    (approve && duesInfo.total > 0 ? ` · dues ${inr(duesInfo.total)} acknowledged (waived by officer)` : ""));
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
  // Re-check dues server-side on every re-application — never trust that the
  // file the officer last saw is still current.
  clearance.dues = computeDues({ rollNo: student.rollNo, dept: clearance.dept, checkedAt: new Date().toISOString() });
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

// ─── Account maintenance ────────────────────────────────────────────────────
/** Self-service student registration (Login page → Register tab). */
export async function registerStudent({ name, email, password, rollNo, phone }) {
  email = String(email || "").trim().toLowerCase();
  const normalizedRollNo = String(rollNo || "").trim().toUpperCase();
  const normalizedPhone = String(phone || "").trim();

  if (db.users.find((u) => String(u.email || "").toLowerCase() === email)) {
    throw new Error("An account with this email already exists.");
  }

  if (normalizedRollNo && db.users.find((u) => String(u.rollNo || "").trim().toUpperCase() === normalizedRollNo)) {
    throw new Error("This student ID is already registered.");
  }

  if (normalizedPhone && db.users.find((u) => String(u.phone || "").trim() === normalizedPhone)) {
    throw new Error("This phone number is already registered.");
  }

  const salt = crypto.randomBytes(8).toString("hex");
  const u = {
    id: uid("usr"), name: String(name).trim(), email, role: "STUDENT", dept: null,
    rollNo: normalizedRollNo, phone: normalizedPhone || null,
    salt, passwordHash: hashPassword(password, salt),
  };
  db.users.push(u);
  notify(u.id, "Welcome to ClearVault. Raise your first clearance request from the dashboard.", "info");
  audit(u.name, "ACCOUNT_REGISTERED", `Student self-registration (${u.rollNo})`);
  save();
  return publicUser(u);
}

/** Self-service authority registration */
export async function registerAuthority({ name, employeeId, dept, password }) {
  const normalizedId = String(employeeId || "").trim().toUpperCase();
  if (!normalizedId) throw new Error("Employee ID is required.");
  
  if (db.users.find((u) => String(u.rollNo || "").trim().toUpperCase() === normalizedId)) {
    throw new Error("This Employee ID is already registered.");
  }
  
  const fakeEmail = `${normalizedId.toLowerCase()}@authority.clearvault.local`;
  const salt = crypto.randomBytes(8).toString("hex");
  
  const u = {
    id: uid("usr"), name: String(name).trim(), email: fakeEmail, role: "STAFF", dept,
    rollNo: normalizedId, phone: null,
    salt, passwordHash: hashPassword(password, salt), disabled: false,
  };
  
  db.users.push(u);
  audit(u.name, "ACCOUNT_REGISTERED", `Authority self-registration (${u.rollNo})`);
  save();
  return publicUser(u);
}

/** Update password for an existing user by email (in-app reset, no tokens). */
export async function updateUserPassword(email, salt, passwordHash) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const u = db.users.find((x) => String(x.email || "").toLowerCase() === normalizedEmail);
  if (!u) throw new Error("User not found");
  u.salt = salt;
  u.passwordHash = passwordHash;
  save();
  return { ok: true };
}

/** Persist a (re-)hashed password — used when a legacy-format hash is verified
 *  once and we upgrade the row to the canonical scrypt format. */
export async function setUserPassword(userId, salt, passwordHash) {
  const u = db.users.find((x) => x.id === userId);
  if (!u) throw new Error("User not found");
  u.salt = salt;
  u.passwordHash = passwordHash;
  save();
  return { ok: true };
}

// ── Password reset tokens (JSON fallback) ─────────────────────────────────
export async function createPasswordReset(userId, tokenHash, expiresAt) {
  const row = { id: uid("prt"), userId, tokenHash, expiresAt, used: false, createdAt: new Date().toISOString() };
  db.passwordResets.push(row);
  save();
  return { id: row.id, createdAt: row.createdAt };
}

export async function findPasswordResetByHash(tokenHash) {
  return db.passwordResets.find((p) => p.tokenHash === tokenHash) || null;
}

export async function invalidatePasswordReset(id) {
  const p = db.passwordResets.find((x) => x.id === id);
  if (!p || p.used) throw new Error("Reset token already used or not found");
  p.used = true;
  save();
  return { ok: true };
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
