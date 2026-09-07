// ────────────────────────────────────────────────────────────────────────────
// SUPABASE IMPLEMENTATION (production). Same async interface as
// store.json.js. Connects with the SERVICE ROLE key — server-side only.
// Departments & workflows come from ./departments.js + ./requestTypes.js.
// ────────────────────────────────────────────────────────────────────────────
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { shortSign, hashPassword } from "./sign.js";
import { DEPTS, deptById, normDept } from "./departments.js";
import { REQUEST_TYPES, requestTypeOf, requiredDeptsForRequest, requiredDeptsForType } from "./requestTypes.js";
import { computeDues, normalizeDues, inr } from "./dues.js";

export { DEPTS };

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const must = ({ data, error }) => {
  if (error) throw new Error(`[supabase] ${error.message}`);
  return data;
};

// snake_case row → app shape
const userRow = (u) => u && ({ id: u.id, name: u.name, email: u.email, rollNo: u.roll_no, role: u.role, dept: normDept(u.dept), salt: u.salt, passwordHash: u.password_hash, picture: u.picture || null, googleSub: u.google_sub || null, disabled: !!u.disabled, dues: u.dues || null });
const publicUser = (u) => u && ({ id: u.id, name: u.name, email: u.email, rollNo: u.rollNo ?? u.roll_no, role: u.role, dept: normDept(u.dept), picture: u.picture || null });
const reqRow = (r) => r && ({ id: r.id, studentId: r.student_id, purpose: r.purpose, createdAt: r.created_at, completedAt: r.completed_at, certificateCode: r.certificate_code, cancelledAt: r.cancelled_at || null, cancelledBy: r.cancelled_by || null, cancellationReason: r.cancellation_reason || null });
const clrRow = (c) => c && ({ id: c.id, requestId: c.request_id, dept: normDept(c.department_id), status: c.status, remarks: c.remarks, approvedBy: c.approved_by, signedAt: c.signed_at, signatureHash: c.signature_hash, dues: c.dues || null });
const ntfRow = (n) => n && ({ id: n.id, userId: n.user_id, message: n.message, type: n.type, isRead: n.is_read, createdAt: n.created_at });
const audRow = (a) => a && ({ id: String(a.id), actorName: a.actor_name, action: a.action, detail: a.detail, createdAt: a.created_at });

const notify = async (userId, message, type = "info") =>
  must(await sb.from("notifications").insert({ user_id: userId, message, type }));
const audit = async (actorName, action, detail) =>
  must(await sb.from("audit_log").insert({ actor_name: actorName, action, detail }));

/** Write helper: if NOT-YET-MIGRATED columns are referenced, strip them and retry.
 *  Works for BOTH a single row object and an ARRAY of rows (bulk insert) —
 *  spreading an array with { ...arr } would corrupt it into { "0": row, "1": row… },
 *  which is exactly what produced the bogus 'column "0" missing' errors. */
async function compatWrite(label, builder, input) {
  const isArray = Array.isArray(input);
  let payload = isArray ? input.map((r) => ({ ...r })) : { ...input };
  let res = await builder(payload);
  let guard = 0;
  while (res?.error && guard++ < 5) {
    const m = res.error.message?.match(/column ['"]?([\w_]+)['"]? .*(does not exist|not found)/i) ||
              res.error.message?.match(/Could not find the ['"]?([\w_]+)['"]? column/i);
    if (!m) break;
    const col = m[1];
    console.warn(`[supabase] ${label}: column "${col}" missing — run the ALTERs in backend/supabase/schema.sql. Retrying without it.`);
    if (isArray) payload = payload.map((r) => { const { [col]: _drop, ...rest } = r; return rest; });
    else { const { [col]: _drop, ...rest } = payload; payload = rest; }
    res = await builder(payload);
  }
  return res;
}
async function safeAux(label, fn) {
  try { await fn(); } catch (e) { console.warn(`[store] ${label} failed (non-fatal):`, e.message); }
}

export async function upsertGoogleStudent({ email, studentId, campusPrefix, profile }) {
  const existing = must(await sb.from("profiles").select("*").eq("email", email).maybeSingle());
  if (existing) {
    const updates = {
      name: profile.name || existing.name,
      picture: profile.picture || existing.picture,
      google_sub: profile.googleSub,
      roll_no: existing.roll_no || studentId.toUpperCase(),
    };
    const res = await compatWrite("profiles.update", (r) => sb.from("profiles").update(r).eq("id", existing.id).select().single(), updates);
    const row = must(res);
    await safeAux("audit", () => audit(row.name, "GOOGLE_LOGIN", `RGUKT Google sign-in (${email}, campus ${campusPrefix})`));
    return userRow(row);
  }
  const salt = crypto.randomBytes(8).toString("hex");
  const insertRow = {
    name: profile.name, email, role: "STUDENT", dept: null,
    roll_no: studentId.toUpperCase(), picture: profile.picture || null,
    google_sub: profile.googleSub, salt,
    password_hash: hashPassword(crypto.randomBytes(16).toString("hex"), salt),
  };
  const res = await compatWrite("profiles.insert", (r) => sb.from("profiles").insert(r).select().single(), insertRow);
  const row = must(res);
  await safeAux("welcome notification", () =>
    notify(row.id, "Welcome to ClearVault. Raise your first clearance request from the dashboard.", "info"));
  await safeAux("audit", () => audit(row.name, "GOOGLE_LOGIN", `RGUKT Google sign-in (${email}, campus ${campusPrefix})`));
  return userRow(row);
}

// ─── Interface ──────────────────────────────────────────────────────────────
export async function findUserByEmail(email) {
  const row = must(await sb.from("profiles").select("*").eq("email", String(email).toLowerCase()).maybeSingle());
  return userRow(row);
}
export async function findUserById(id) {
  const row = must(await sb.from("profiles").select("*").eq("id", id).maybeSingle());
  return userRow(row);
}
export async function findRequestById(id) {
  const row = must(await sb.from("clearance_requests").select("*").eq("id", id).maybeSingle());
  return reqRow(row);
}
export async function findClearanceById(id) {
  const row = must(await sb.from("clearances").select("*").eq("id", id).maybeSingle());
  return clrRow(row);
}
export async function getActiveRequest(studentId) {
  const rows = must(await sb.from("clearance_requests").select("*").eq("student_id", studentId).order("created_at", { ascending: false }).limit(1));
  return reqRow(rows[0] || null);
}
/** Central status derivation — CANCELLED is terminal and outranks everything. */
const deriveOverall = (req, clearanceRows) => {
  if (req?.cancelledAt) return "CANCELLED";
  const cs = clearanceRows || [];
  const required = requiredDeptsForRequest(req);
  const allCleared = required.every((d) => cs.some((c) => normDept(c.dept ?? c.department_id) === d && c.status === "APPROVED"));
  if (allCleared) return "COMPLETED";
  if (cs.some((c) => c.status === "REJECTED")) return "ACTION_REQUIRED";
  return "IN_PROGRESS";
};

export async function listStudentRequests(studentId) {
  const rows = must(await sb.from("clearance_requests").select("*").eq("student_id", studentId).order("created_at", { ascending: false }));
  const requests = rows.map(reqRow);
  if (!requests.length) return [];
  const cls = must(await sb.from("clearances").select("request_id,department_id,status").in("request_id", requests.map((r) => r.id)));
  return requests.map((r) => {
    const cs = cls.filter((c) => c.request_id === r.id);
    // deriveOverall checks cancelledAt FIRST — dashboard shows CANCELLED, never a stale IN_PROGRESS
    return { ...r, type: requestTypeOf(r), overall: deriveOverall(r, cs), total: requiredDeptsForRequest(r).length, cleared: cs.filter((c) => c.status === "APPROVED").length };
  });
}
export async function clearancesFor(requestId) {
  const rows = must(await sb.from("clearances").select("*").eq("request_id", requestId));
  const req = await findRequestById(requestId);
  const order = req ? requiredDeptsForRequest(req) : [];
  return rows.map(clrRow).sort((a, b) => order.indexOf(a.dept) - order.indexOf(b.dept));
}
export async function overallStatus(requestId) {
  const req = await findRequestById(requestId);
  if (!req) return "IN_PROGRESS";
  return deriveOverall(req, await clearancesFor(requestId)); // CANCELLED first — terminal
}
export async function deptQueue(dept) {
  const mine = normDept(dept);
  const rows = must(await sb
    .from("clearances")
    .select("*, request:clearance_requests!clearances_request_id_fkey(*, student:profiles!clearance_requests_student_id_fkey(id,name,email,roll_no,role,dept))")
    .eq("department_id", mine));
  return rows
    .map((c) => {
      const request = reqRow(c.request);
      const student = publicUser(c.request.student);
      return {
        ...clrRow(c), request, type: requestTypeOf(c.request), student,
        // Canonical dues snapshot for the officer (legacy arrays / missing
        // pre-migration values are upgraded on read — see src/dues.js).
        dues: normalizeDues(c.dues, { rollNo: student?.rollNo, dept: mine, checkedAt: request.createdAt }),
        // Cancelled files stay visible (read-only history) but never actionable
        requestCancelled: !!request.cancelledAt,
        cancellationReason: request.cancellationReason,
      };
    })
    // Pending approvals of cancelled requests leave the active queue entirely
    .filter((c) => !(c.requestCancelled && c.status === "PENDING"))
    .sort((a, b) => (a.status === "PENDING" ? 0 : 1) - (b.status === "PENDING" ? 0 : 1) || b.request.createdAt.localeCompare(a.request.createdAt));
}

/**
 * Create a request and its approval tasks — correct order, every time:
 *   1. insert the clearance_requests row and keep its generated ID
 *   2. fan out ONE clearance per mandatory office (typeObj.requires, validated
 *      against the department registry) with that request_id attached
 *   3. return the complete request
 * `status` is sent explicitly (matches the schema default 'PENDING' even if a
 * database was created before the default existed).
 */
export async function createRequest(student, typeObj) {
  // 1) parent row first — request_id comes from here, never from the client
  const row = must(await sb
    .from("clearance_requests")
    .insert({ student_id: student.id, purpose: typeObj.purpose })
    .select()
    .single());
  const req = reqRow(row);
  if (!req?.id) throw new Error("[supabase] clearance_requests insert returned no id — request not created");

  // 2) mandatory-office fan-out, validated against the live department registry
  const unknown = (typeObj.requires || []).filter((d) => !DEPTS.some((dep) => dep.id === d));
  if (unknown.length) throw new Error(`Unknown department(s) in workflow: ${unknown.join(", ")}`);
  const inserts = typeObj.requires.map((d) => ({
    request_id: req.id,      // real generated ID — satisfies NOT NULL
    department_id: d,        // FINANCE | LIBRARY | HOSTEL | SPORTS | PHYSICS_LAB | CHEMISTRY_LAB | DEAN | AO | DIRECTOR
    status: "PENDING",
    // Per-request department dues snapshot — server-generated, frozen onto the
    // clearance so what the officer reviews stays auditable with this request.
    dues: computeDues({ rollNo: student.rollNo, dept: d, checkedAt: req.createdAt }),
  }));
  // compatWrite handles the ARRAY correctly (no object-spread corruption)
  must(await compatWrite("clearances.insert", (r) => sb.from("clearances").insert(r), inserts));

  // 3) side effects + return
  await notify(student.id, `${typeObj.title} filed — routed to ${typeObj.requires.length} ${typeObj.requires.length === 1 ? "office" : "offices"}.`);
  await audit(student.name, "REQUEST_CREATED", `${typeObj.title} · requires ${typeObj.requires.join(", ")}`);
  return req;
}

export async function decide(clearanceId, approve, remarks, staff, duesAcknowledged = false) {
  const clearance = await findClearanceById(clearanceId);
  const req = await findRequestById(clearance.requestId);
  // Cancelled/completed files are frozen — no approval operation may land on them.
  if (req.cancelledAt) throw new Error("This request was cancelled by the student — approvals are closed.");
  if (req.completedAt || req.certificateCode) throw new Error("This request is already completed.");
  const student = await findUserById(req.studentId);
  const deptName = deptById(clearance.dept).name;

  // ── Dues gate (server-side): the snapshot stored on this clearance decides.
  // An officer may never silently approve a file with outstanding dues — the
  // only path is an EXPLICIT acknowledgement (duesAcknowledged=true), which we
  // record on the snapshot as a waiver so the decision remains auditable.
  const duesInfo = normalizeDues(clearance.dues, { rollNo: student.rollNo, dept: clearance.dept, checkedAt: req.createdAt });
  const waivedAt = new Date().toISOString();
  if (approve && duesInfo.total > 0 && !duesAcknowledged)
    throw new Error(`Outstanding dues of ${inr(duesInfo.total)} on record with ${deptName} — approval is blocked. Confirm settlement (explicit acknowledgement) or reject with a comment.`);

  const prevStatus = clearance.status;
  const signedAt2 = new Date().toISOString();
  const signatureHash = approve ? shortSign(`${student.rollNo}|${clearance.dept}|${signedAt2}`) : null;
  // Atomic guard: the flip succeeds ONLY while the clearance is still PENDING.
  // compatWrite keeps this working on databases that haven't run
  // migration-dues.sql yet (the dues key is stripped and retried).
  const decided = must(await compatWrite("clearances.decide", (r) => sb.from("clearances").update(r).eq("id", clearanceId).eq("status", "PENDING").select().maybeSingle(), {
    status: approve ? "APPROVED" : "REJECTED",
    remarks: remarks || (approve
      ? (duesInfo.total > 0 ? `Dues of ${inr(duesInfo.total)} verified as settled — waived on record.` : "No dues found.")
      : ""),
    approved_by: staff.name,
    signed_at: signedAt2,
    signature_hash: signatureHash,
    dues: approve && duesInfo.total > 0
      ? { ...duesInfo, waived: { by: staff.name, at: waivedAt, total: duesInfo.total } }
      : duesInfo, // persist the exact snapshot that was reviewed
  }));
  if (!decided) throw new Error("This clearance is no longer actionable (already decided or request cancelled).");

  const newStatus = approve ? "CLEARED" : "REJECTED";
  await notify(student.id, approve
    ? `${deptName} cleared your request. Sign-off ${signatureHash}`
    : `${deptName} returned your request: “${remarks}”. Resolve the due and re-apply.`,
    approve ? "success" : "danger");
  await audit(staff.name, approve ? "CLEARANCE_CLEARED" : "CLEARANCE_REJECTED",
    `${deptName} · ${prevStatus} → ${newStatus} · ${student.name} (${student.rollNo}) — ${remarks || (duesInfo.total > 0 ? "Dues verified as settled — waived on record." : "No dues found.")}` +
    (approve && duesInfo.total > 0 ? ` · dues ${inr(duesInfo.total)} acknowledged (waived by officer)` : ""));

  // Re-read the request right before minting — a cancellation landing
  // mid-approval must suppress certificate generation entirely.
  const freshReq = await findRequestById(req.id);
  if ((await overallStatus(req.id)) === "COMPLETED" && !freshReq.completedAt && !freshReq.cancelledAt) {
    const code = "CV-26-" + crypto.randomBytes(3).toString("hex").toUpperCase();
    must(await sb.from("clearance_requests").update({ completed_at: new Date().toISOString(), certificate_code: code }).eq("id", req.id));
    await notify(student.id, `All mandatory approvals cleared. Certificate ${code} issued.`, "success");
    await audit("System", "CERTIFICATE_ISSUED", `Certificate ${code} issued to ${student.name}`);
  }
}
// ─── Student dues dashboard ────────────────────────────────────────────────
export async function getStudentDues(studentId, dept) {
  const mine = normDept(dept);

  const rows = must(await sb
    .from("clearances")
    .select(`
      *,
      request:clearance_requests!clearances_request_id_fkey(
        id,
        student_id,
        created_at,
        cancelled_at
      )
    `)
    .eq("department_id", mine));

  const studentRows = rows.filter(
    (c) => c.request?.student_id === studentId
  );
  if (!studentRows.length) {
    // No clearance rows found for this student+dept — fall back to any stored
    // per-profile dues snapshot (seeded) or compute a stable fixture.
    const prof = must(await sb.from("profiles").select("roll_no,dues").eq("id", studentId).maybeSingle());
    if (prof && prof.dues) {
      const raw = prof.dues && prof.dues[mine];
      if (raw) {
        // If raw is a v2 snapshot or an array of legacy lines, normalize it.
        if (raw.v === 2) {
          return { dues: raw, clearance: null };
        }
        if (Array.isArray(raw)) {
          return { dues: normalizeDues(raw, { rollNo: prof.roll_no || null, dept: mine, checkedAt: raw.checkedAt || new Date().toISOString() }), clearance: null };
        }
        // If it's an object with `lines`, convert to a v2 snapshot.
        if (raw.lines) {
          const total = (raw.lines || []).reduce((s, x) => s + (Number(x.amount || 0)), 0);
          const snap = { v: 2, status: total > 0 ? "DUES_FOUND" : "NO_DUES", total, checkedAt: raw.checkedAt || new Date().toISOString(), lines: raw.lines, books: raw.books || undefined };
          return { dues: snap, clearance: null };
        }
      }
    }
    return {
      dues: normalizeDues(null, {
        rollNo: prof?.roll_no || null,
        dept: mine,
        checkedAt: new Date().toISOString(),
      }),
      clearance: null,
    };
  }

  // Use the most recent request for this department.
  const latest = studentRows
    .slice()
    .sort(
      (a, b) =>
        new Date(b.request?.created_at || 0) -
        new Date(a.request?.created_at || 0)
    )[0];

  const clearance = clrRow(latest);

  return {
    dues: normalizeDues(latest.dues, {
      rollNo: null,
      dept: mine,
      checkedAt: latest.request?.created_at || new Date().toISOString(),
    }),
    clearance,
  };
}
export async function reapply(clearanceId, student) {
  const clearance = await findClearanceById(clearanceId);
  const req = await findRequestById(clearance.requestId);
  if (req.cancelledAt) throw new Error("This request was cancelled — re-application is closed.");
  if (req.completedAt) throw new Error("This request is already completed.");
  // Re-check dues server-side on every re-application — never trust that the
  // file the officer last saw is still current. compatWrite stays compatible
  // with databases missing the dues column.
  must(await compatWrite("clearances.reapply", (r) => sb.from("clearances").update(r).eq("id", clearanceId), {
    status: "PENDING", remarks: null, approved_by: null, signed_at: null, signature_hash: null,
    dues: computeDues({ rollNo: student.rollNo, dept: clearance.dept, checkedAt: new Date().toISOString() }),
  }));
  const deptName = deptById(clearance.dept).name;
  await notify(student.id, `Re-application sent to ${deptName}.`);
  await audit(student.name, "CLEARANCE_REAPPLIED", deptName);
}

export async function notificationsFor(userId) {
  const rows = must(await sb.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20));
  const notifications = rows.map(ntfRow);
  return { notifications, unread: notifications.filter((n) => !n.isRead).length };
}
export async function markNotificationsRead(userId) {
  must(await sb.from("notifications").update({ is_read: true }).eq("user_id", userId));
}

// ─── Account maintenance ────────────────────────────────────────────────────
/** Self-service student registration (Login page → Register tab). */
export async function registerStudent({ name, email, password, rollNo, phone }) {
  email = String(email || "").trim().toLowerCase();
  const dup = must(await sb.from("profiles").select("id").eq("email", email).maybeSingle());
  if (dup) throw new Error("An account with this email already exists");
  const salt = crypto.randomBytes(8).toString("hex");
  // compatWrite drops `phone` if the schema predates migration-student-registration.sql
  const res = await compatWrite("profiles.register", (r) => sb.from("profiles").insert(r).select().single(), {
    name: String(name).trim(), email, role: "STUDENT", dept: null,
    roll_no: String(rollNo).trim().toUpperCase(), phone: phone || null,
    salt, password_hash: hashPassword(password, salt), disabled: false,
  });
  const row = must(res);
  await safeAux("welcome notification", () =>
    notify(row.id, "Welcome to ClearVault. Raise your first clearance request from the dashboard.", "info"));
  await safeAux("audit", () => audit(row.name, "ACCOUNT_REGISTERED", `Student self-registration (${row.roll_no})`));
  return publicUser(row);
}

/** Persist a (re-)hashed password — used when a legacy-format hash is verified
 *  once and we upgrade the row to the canonical scrypt format. */
export async function setUserPassword(userId, salt, passwordHash) {
  const row = must(await sb
    .from("profiles")
    .update({ salt, password_hash: passwordHash })
    .eq("id", userId)
    .select("id")
    .maybeSingle());
  if (!row) throw new Error("User not found");
  return { ok: true };
}

/**
 * Cancel a student's own request (Supabase path).
 *
 * Race-safety WITHOUT depending on the migration columns: the conditional
 * update filters ONLY on the original columns — `completed_at IS NULL AND
 * certificate_code IS NULL`. If the request completed/certificate-issued in
 * the meantime, zero rows match → precise 409. The cancellation columns are
 * written plainly; if the database predates the cancellation migration, the
 * PostgREST error is translated into an actionable message instead of the
 * old misleading "no longer cancellable". (Double-cancel racing is benign —
 * both writes land on the same CANCELLED state.)
 */
export async function cancelRequest(requestId, student, reason) {
  const req = await findRequestById(requestId);
  if (!req) throw new Error("Request not found");
  if (req.cancelledAt) throw new Error("This request has already been cancelled.");
  if (req.completedAt || req.certificateCode)
    throw new Error("This request is complete and its certificate has been issued — it can no longer be cancelled.");

  const res = await sb.from("clearance_requests")
    .update({
      cancelled_at: new Date().toISOString(),
      cancelled_by: "Student",
      cancellation_reason: reason || null,
    })
    .eq("id", requestId)
    .is("completed_at", null)        // original column
    .is("certificate_code", null)    // original column
    .select()
    .maybeSingle();

  if (res.error) {
    if (/cancelled_at|cancelled_by|cancellation_reason/i.test(res.error.message))
      throw new Error("The cancellation migrations aren't applied to this Supabase database — run backend/supabase/migration-cancellation.sql in the SQL editor, then retry.");
    throw new Error(`[supabase] ${res.error.message}`);
  }
  if (!res.data)
    throw new Error("This request is no longer cancellable — its certificate was issued a moment ago.");

  await safeAux("notify", () => notify(student.id,
    `You cancelled ${req.purpose}.${reason ? ` Reason: “${reason}”.` : ""} You may file a new request anytime.`, "info"));
  await safeAux("audit", () => audit(student.name, "REQUEST_CANCELLED",
    `${req.purpose}${reason ? ` — reason: ${reason}` : " — no reason given"}`));
  return reqRow(res.data);
}

// ─── Admin: officer management ──────────────────────────────────────────────
export async function listOfficers() {
  const rows = must(await sb.from("profiles").select("id,name,email,dept,disabled").eq("role", "STAFF"));
  return rows.map((u) => ({
    id: u.id, name: u.name, email: u.email, dept: normDept(u.dept),
    deptName: deptById(u.dept).name, officerTitle: deptById(u.dept).officerTitle,
    disabled: !!u.disabled,
  }));
}
export async function createOfficer({ name, email, dept, password }) {
  email = String(email || "").trim().toLowerCase();
  if (!name?.trim() || !email) throw new Error("Name and email are required");
  if (!DEPTS.find((d) => d.id === dept)) throw new Error("Unknown department");
  const dup = must(await sb.from("profiles").select("id").eq("email", email).maybeSingle());
  if (dup) throw new Error("An account with this email already exists");
  const salt = crypto.randomBytes(8).toString("hex");
  const res = await compatWrite("profiles.insert", (r) => sb.from("profiles").insert(r).select().single(), {
    name: name.trim(), email, role: "STAFF", dept, roll_no: null,
    salt, password_hash: hashPassword(password || "officer123", salt), disabled: false,
  });
  const row = must(res);
  await safeAux("audit", () => audit("Admin", "OFFICER_CREATED", `${name} → ${deptById(dept).officerTitle} (${deptById(dept).name})`));
  return { id: row.id };
}
export async function setOfficerDisabled(id, disabled) {
  const res = await compatWrite("profiles.disable", (r) => sb.from("profiles").update(r).eq("id", id).eq("role", "STAFF").select().maybeSingle(), { disabled: !!disabled });
  const row = must(res);
  if (!row) throw new Error("Officer not found");
  await safeAux("audit", () => audit("Admin", disabled ? "OFFICER_DISABLED" : "OFFICER_ENABLED", `${row.name} (${deptById(row.dept).name})`));
  return { ok: true };
}

export async function adminStats() {
  const requests = must(await sb
    .from("clearance_requests")
    .select("*, student:profiles!clearance_requests_student_id_fkey(name,roll_no)"))
    .map((r) => ({ ...reqRow(r), student: { name: r.student.name, rollNo: r.student.roll_no } }));
  const clearances = must(await sb.from("clearances").select("request_id,department_id,status"));
  const users = must(await sb.from("profiles").select("role"));

  const overallFor = (r) => deriveOverall(r, clearances.filter((c) => c.request_id === r.id));
  for (const r of requests) r.overall = overallFor(r);
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
      students: users.filter((u) => u.role === "STUDENT").length,
      staff: users.filter((u) => u.role === "STAFF").length,
    },
    deptStats: DEPTS.map((d) => ({
      ...d,
      pending: clearances.filter((c) => normDept(c.department_id) === d.id && c.status === "PENDING").length,
      approved: clearances.filter((c) => normDept(c.department_id) === d.id && c.status === "APPROVED").length,
      rejected: clearances.filter((c) => normDept(c.department_id) === d.id && c.status === "REJECTED").length,
    })),
    recentRequests: requests.slice().reverse().slice(0, 8),
  };
}

export async function auditList() {
  const rows = must(await sb.from("audit_log").select("*").order("created_at", { ascending: false }).limit(50));
  return rows.map(audRow);
}

export async function verifyCertificate(code) {
  const row = must(await sb
    .from("clearance_requests")
    .select("*, student:profiles!clearance_requests_student_id_fkey(name,roll_no)")
    .ilike("certificate_code", code)
    .maybeSingle());
  if (!row) return null;
  return {
    certificateCode: row.certificate_code,
    purpose: row.purpose,
    issuedAt: row.completed_at,
    student: { name: row.student.name, rollNo: row.student.roll_no },
    signoffs: (await clearancesFor(row.id)).map((c) => ({
      dept: deptById(c.dept).name,
      approvedBy: c.approvedBy,
      signedAt: c.signedAt,
      signatureHash: c.signatureHash,
    })),
  };
}
