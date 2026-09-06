// ────────────────────────────────────────────────────────────────────────────
// Seeds your Supabase project with the demo registry (9 offices + workflows).
//   Run:  npm run seed   (after .env has SUPABASE_URL + SERVICE ROLE key,
//                         and after schema.sql has been run in the SQL editor)
// Safe to run twice — existing users and demo requests are skipped.
// ────────────────────────────────────────────────────────────────────────────
import "../src/env.js";
import { createClient } from "@supabase/supabase-js";
import { hashPassword, shortSign } from "../src/sign.js";
import { REQUEST_TYPES } from "../src/requestTypes.js";
import crypto from "crypto";

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("✖  Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env first.");
  process.exit(1);
}
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const must = ({ data, error }) => { if (error) throw new Error(error.message); return data; };

const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();
const hoursAgo = (n) => new Date(Date.now() - n * 3600000).toISOString();
const mkUser = (name, email, pw, role, dept, rollNo, dues) => {
  const salt = crypto.randomBytes(8).toString("hex");
  return { name, email, roll_no: rollNo || null, role, dept, salt, password_hash: hashPassword(pw, salt), dues: dues || null };
};

const USERS = [
  mkUser("Ananya Verma", "ananya@campus.edu", "student123", "STUDENT", null, "CS22B1047"),
  mkUser("Rohan Mehta", "rohan@campus.edu", "student123", "STUDENT", null, "EC22B0913"),
  mkUser("Karan Patel", "karan@campus.edu", "student123", "STUDENT", null, "ME21B0755",
    { FINANCE: [{ label: "Semester 6 tuition instalment", amount: 2500 }], LIBRARY: [{ label: "Overdue: 'Signals & Systems' — 18 days", amount: 120 }] }),
  mkUser("Zoya Khan", "zoya@campus.edu", "student123", "STUDENT", null, "BT23B0621",
    { HOSTEL: [{ label: "Mess bill — July", amount: 1800 }] }),
  mkUser("P. Ramesh", "finance@campus.edu", "staff123", "STAFF", "FINANCE"),
  mkUser("Meera Krishnan", "library@campus.edu", "staff123", "STAFF", "LIBRARY"),
  mkUser("Rajan Iyer", "hostel@campus.edu", "staff123", "STAFF", "HOSTEL"),
  mkUser("Divya Nair", "sports@campus.edu", "staff123", "STAFF", "SPORTS"),
  mkUser("Dr. K. Varma", "physics@campus.edu", "staff123", "STAFF", "PHYSICS_LAB"),
  mkUser("Dr. L. Shenoy", "chemistry@campus.edu", "staff123", "STAFF", "CHEMISTRY_LAB"),
  mkUser("Prof. A. Reddy", "dean@campus.edu", "staff123", "STAFF", "DEAN"),
  mkUser("G. Menon", "ao@campus.edu", "staff123", "STAFF", "AO"),
  mkUser("Dr. (Prof.) V. Iyer", "director@campus.edu", "staff123", "STAFF", "DIRECTOR"),
  mkUser("Farhan Ali", "accounts@campus.edu", "staff123", "STAFF", "FINANCE"),   // legacy alias
  mkUser("Warden Desk", "hostels@campus.edu", "staff123", "STAFF", "HOSTEL"),    // legacy alias
  mkUser("Dr. S. Rao", "admin@campus.edu", "admin123", "ADMIN"),
];
const ALL = REQUEST_TYPES.find((t) => t.id === "graduation").requires;

const idByEmail = {};
for (const u of USERS) {
  const exists = must(await sb.from("profiles").select("id").eq("email", u.email).maybeSingle());
  if (exists) { idByEmail[u.email] = exists.id; console.log(`· skip ${u.email} (exists)`); continue; }
  // strip optional new columns if the schema hasn't been ALTERed yet
  let payload = { ...u };
  let res = await sb.from("profiles").insert(payload).select().single();
  if (res.error && /column/i.test(res.error.message || "")) {
    const { dues, ...withoutDues } = payload;
    res = await sb.from("profiles").insert(withoutDues).select().single();
  }
  const row = must(res);
  idByEmail[u.email] = row.id;
  console.log(`✔ created ${u.role.padEnd(7)} ${u.name} <${u.email}>`);
}

// Demo history (only when the registry is empty)
const existing = must(await sb.from("clearance_requests").select("id").limit(1));
if (existing.length) {
  console.log("· registry already has requests — skipping demo history");
} else {
  const rohan = idByEmail["rohan@campus.edu"];
  const karan = idByEmail["karan@campus.edu"];
  const officerOf = (d) =>
    USERS.find((u) => u.role === "STAFF" && u.dept === d).name;

  const r1 = must(await sb.from("clearance_requests").insert({
    student_id: rohan, purpose: "Final Year / Graduation Clearance",
    created_at: daysAgo(4), completed_at: daysAgo(2), certificate_code: "CV-26-R4J8KX",
  }).select().single());
  await sb.from("clearances").insert(ALL.map((d, i) => {
    const at = daysAgo(2.6 - i * 0.05);
    return {
      request_id: r1.id, department_id: d, status: "APPROVED", remarks: "Verified — no dues.",
      approved_by: officerOf(d), signed_at: at,
      signature_hash: shortSign(`EC22B0913|${d}|${at}`),
    };
  }));

  const r2 = must(await sb.from("clearance_requests").insert({
    student_id: karan, purpose: "Final Year / Graduation Clearance", created_at: hoursAgo(20),
  }).select().single());
  await sb.from("clearances").insert(ALL.map((d) =>
    ["FINANCE", "LIBRARY", "SPORTS"].includes(d)
      ? { request_id: r2.id, department_id: d, status: "APPROVED", remarks: "Cleared.",
          approved_by: officerOf(d), signed_at: hoursAgo(12),
          signature_hash: shortSign(`ME21B0755|${d}|${hoursAgo(12)}`) }
      : { request_id: r2.id, department_id: d, status: "PENDING" }
  ));

  // Zoya: CANCELLED hostel-vacating filing (kept as history, never actionable)
  const r3 = must(await sb.from("clearance_requests").insert({
    student_id: idByEmail["zoya@campus.edu"], purpose: "Hostel Vacating Clearance",
    created_at: daysAgo(1.2), cancelled_at: daysAgo(1), cancelled_by: "Student",
    cancellation_reason: "Submitted by mistake — selected the wrong semester while filing.",
  }).select().single());
  await sb.from("clearances").insert({ request_id: r3.id, department_id: "HOSTEL", status: "PENDING" });

  await sb.from("notifications").insert({
    user_id: rohan, type: "success",
    message: "Graduation Clearance fully approved — certificate CV-26-R4J8KX is ready.",
  });
  await sb.from("audit_log").insert([
    { actor_name: "Rohan Mehta", action: "REQUEST_CREATED", detail: "Final Year / Graduation Clearance", created_at: daysAgo(4) },
    { actor_name: "System", action: "CERTIFICATE_ISSUED", detail: "Certificate CV-26-R4J8KX issued to Rohan Mehta", created_at: daysAgo(2) },
    { actor_name: "Karan Patel", action: "REQUEST_CREATED", detail: "Final Year / Graduation Clearance", created_at: hoursAgo(20) },
    { actor_name: "Zoya Khan", action: "REQUEST_CANCELLED", detail: "Hostel Vacating Clearance — reason: Submitted by mistake — selected the wrong semester while filing.", created_at: daysAgo(1) },
  ]);
  console.log("✔ demo history seeded (1 fully-signed certificate + 1 in-progress graduation file)");
}

console.log("\nDone. Start the API with:  npm run start   — it will log 'data layer → SUPABASE'");
