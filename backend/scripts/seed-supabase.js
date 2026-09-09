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
// Keep the plaintext demo password alongside its row so we can verify/repair.
const mkUser = (name, email, pw, role, dept, rollNo, dues) => {
  const salt = crypto.randomBytes(8).toString("hex");
  return {
    __pw: pw, // script-internal only — never inserted into the DB, never logged
    name, email, roll_no: rollNo || null, role, dept, salt,
    password_hash: hashPassword(pw, salt), dues: dues || null,
  };
};

// Ten RGUKT demo students (fictional). Password: student123
const USERS = [
  // Special three exact accounts
  mkUser("B Praveen", "o220854@rguktrkv.ac.in", "student123", "STUDENT", null, "O220854", { meta: { campus: "rguktrkv" } }),
  mkUser("C Kiran", "r220007@rguktrkv.ac.in", "student123", "STUDENT", null, "R220007", { meta: { campus: "rguktrkv" } }),
  // M Mahesh: NO DUES across every department — supply explicit v2 snapshots with total 0
  mkUser("M Mahesh", "r220921@rguktrkv.ac.in", "student123", "STUDENT", null, "R220921", {
    dues: Object.fromEntries(["FINANCE","LIBRARY","HOSTEL","SPORTS","PHYSICS_LAB","CHEMISTRY_LAB","DEAN","AO","DIRECTOR"].map((d) => [d, { v: 2, status: "NO_DUES", total: 0, checkedAt: new Date().toISOString(), lines: [] } ])),
    meta: { campus: "rguktrkv" }
  }),
  // Seven additional realistic demo students with varied dues
  mkUser("Nikhil Rao", "r220112@rguktrkv.ac.in", "student123", "STUDENT", null, "R220112", {
    FINANCE: { v: 2, lines: [ { label: "Tuition fee", detail: "Semester instalment unpaid", amount: 15000 } ], total: 15000, status: "DUES_FOUND" },
    meta: { phone: "+91-7700010112", campus: "rguktrkv" }
  }),
  mkUser("Priya Sharma", "r220113@rguktrkv.ac.in", "student123", "STUDENT", null, "R220113", {
    LIBRARY: { v: 2, lines: [ { label: "Books pending", detail: "2 titles past due", value: "2", amount: 700 } ], books: [ { id: "LIB-2026-02001", name: "Algorithms", issueDate: "2026-06-01", dueDate: "2026-06-15", amount: 350, status: "PENDING" }, { id: "LIB-2026-02002", name: "Discrete Math", issueDate: "2026-06-03", dueDate: "2026-06-17", amount: 350, status: "PENDING" } ], total: 700, status: "DUES_FOUND" },
    meta: { phone: "+91-7700010113", campus: "rguktrkv" }
  }),
  mkUser("Rahul Gupta", "r220114@rguktrkv.ac.in", "student123", "STUDENT", null, "R220114", {
    HOSTEL: { v: 2, lines: [ { label: "Hostel dues", detail: "Room rent — July", amount: 3000 } ], total: 3000, status: "DUES_FOUND" },
    meta: { phone: "+91-7700010114", campus: "rguktrkv" }
  }),
  mkUser("Sangeeta Rao", "r220115@rguktrkv.ac.in", "student123", "STUDENT", null, "R220115", {
    SPORTS: { v: 2, lines: [ { label: "Equipment charges", detail: "Replacement racket", amount: 1200 } ], total: 1200, status: "DUES_FOUND" },
    meta: { phone: "+91-7700010115", campus: "rguktrkv" }
  }),
  mkUser("Vikram Singh", "r220116@rguktrkv.ac.in", "student123", "STUDENT", null, "R220116", {
    PHYSICS_LAB: { v: 2, lines: [ { label: "Equipment unreturned", detail: "Oscilloscope lead", amount: 600 } ], total: 600, status: "DUES_FOUND" },
    meta: { phone: "+91-7700010116", campus: "rguktrkv" }
  }),
  mkUser("Anita Das", "r220117@rguktrkv.ac.in", "student123", "STUDENT", null, "R220117", {
    CHEMISTRY_LAB: { v: 2, lines: [ { label: "Breakage charge", detail: "Cracked beaker", amount: 1200 } ], total: 1200, status: "DUES_FOUND" },
    FINANCE: { v: 2, lines: [ { label: "Tuition fee", detail: "Partial instalment unpaid", amount: 5000 } ], total: 5000, status: "DUES_FOUND" },
    meta: { phone: "+91-7700010117", campus: "rguktrkv" }
  }),
  // Officers (one account per office)
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
// Ensure we select the combined TC & Graduation card (current id: "tc-graduation").
const ALL = (REQUEST_TYPES.find((t) => t.id === "tc-graduation") || { requires: [] }).requires;

const idByEmail = {};
let created = 0, repaired = 0, kept = 0;
for (const u of USERS) {
  // Prefer matching by email; if absent, try matching by roll_no to avoid duplicates.
  let exists = must(await sb.from("profiles").select("id,salt,password_hash,email,roll_no").eq("email", u.email).maybeSingle());
  if (!exists && u.roll_no) {
    exists = must(await sb.from("profiles").select("id,salt,password_hash,email,roll_no").eq("roll_no", u.roll_no).maybeSingle());
  }
  if (exists) {
    idByEmail[u.email] = exists.id;
    // ── self-heal: stored hash must verify under the CURRENT hashing scheme ──
    const cachedSalt = exists.salt || "";
    if (exists.password_hash === hashPassword(u.__pw, cachedSalt)) {
      console.log(`· keep  ${u.email}`);
      kept++;
      // Even when keeping, ensure demo STUDENT rows receive latest seeded dues
      if (u.role === "STUDENT") {
        try {
          const updates = {
            name: u.name,
            roll_no: u.roll_no || null,
            dues: u.dues || null,
            email: u.email,
          };
          // If the schema doesn't include dues, this will error; ignore
          await sb.from("profiles").update(updates).eq("id", exists.id);
        } catch (e) {
          // non-fatal — older databases may not have the column
        }
      }
      continue;
    }
    const salt = crypto.randomBytes(8).toString("hex");
    must(await sb.from("profiles").update({ salt, password_hash: hashPassword(u.__pw, cachedSalt) }).eq("id", exists.id));
    // Also update seeded metadata + dues for existing student rows
    if (u.role === "STUDENT") {
      try {
        const updates2 = { name: u.name, roll_no: u.roll_no || null, dues: u.dues || null, email: u.email };
        await sb.from("profiles").update(updates2).eq("id", exists.id);
      } catch (e) {
        // ignore if column doesn't exist yet
      }
    }s; de
    repaired++;
    console.log(`↺ repaired password hash for ${u.email} (was seeded with an older format)`);
    continue;
  }
  // strip optional new columns if the schema hasn't been ALTERed yet
  let payload = { ...u };
  delete payload.__pw;
  let res = await sb.from("profiles").insert(payload).select().single();
  if (res.error && /column/i.test(res.error.message || "")) {
    const { dues, ...withoutDues } = payload;
    res = await sb.from("profiles").insert(withoutDues).select().single();
  }
  const row = must(res);
  idByEmail[u.email] = row.id;
  created++;
  console.log(`✔ created ${u.role.padEnd(7)} ${u.name} <${u.email}>`);
}
console.log(`· accounts — created: ${created}, kept: ${kept}, password-repaired: ${repaired}`);

// Demo history (only when the registry is empty)
const existing = must(await sb.from("clearance_requests").select("id").limit(1));
if (existing.length) {
  console.log("· registry already has requests — skipping demo history");
} else {
  // Map demo history to the new seeded demo accounts
  const stuA = idByEmail["r220921@rguktrkv.ac.in"]; // M Mahesh — completed, NO_DUES
  const stuB = idByEmail["r220112@rguktrkv.ac.in"]; // Nikhil Rao — in-progress
  const stuC = idByEmail["r220114@rguktrkv.ac.in"]; // Rahul Gupta — cancelled
  const officerOf = (d) =>
    USERS.find((u) => u.role === "STAFF" && u.dept === d).name;
  const r1 = must(await sb.from("clearance_requests").insert({
    student_id: stuA, purpose: "Final Year / Graduation Clearance",
    created_at: daysAgo(4), completed_at: daysAgo(2), certificate_code: "CV-26-R4J8KX",
  }).select().single());
  await sb.from("clearances").insert(ALL.map((d, i) => {
    const at = daysAgo(2.6 - i * 0.05);
    return {
      request_id: r1.id, department_id: d, status: "APPROVED", remarks: "Verified — no dues.",
      approved_by: officerOf(d), signed_at: at,
      signature_hash: shortSign(`R220921|${d}|${at}`),
    };
  }));

  const r2 = must(await sb.from("clearance_requests").insert({
    student_id: stuB, purpose: "Final Year / Graduation Clearance", created_at: hoursAgo(20),
  }).select().single());
  await sb.from("clearances").insert(ALL.map((d) =>
    ["FINANCE", "LIBRARY", "SPORTS"].includes(d)
      ? { request_id: r2.id, department_id: d, status: "APPROVED", remarks: "Cleared.",
          approved_by: officerOf(d), signed_at: hoursAgo(12),
          signature_hash: shortSign(`R220112|${d}|${hoursAgo(12)}`) }
      : { request_id: r2.id, department_id: d, status: "PENDING" }
  ));

  // Zoya: CANCELLED hostel-vacating filing (kept as history, never actionable)
  const r3 = must(await sb.from("clearance_requests").insert({
    student_id: stuC, purpose: "Hostel Vacating Clearance",
    created_at: daysAgo(1.2), cancelled_at: daysAgo(1), cancelled_by: "Student",
    cancellation_reason: "Submitted by mistake — selected the wrong semester while filing.",
  }).select().single());
  await sb.from("clearances").insert({ request_id: r3.id, department_id: "HOSTEL", status: "PENDING" });

  await sb.from("notifications").insert({
    user_id: stuA, type: "success",
    message: "Graduation Clearance fully approved — certificate CV-26-R4J8KX is ready.",
  });
  await sb.from("audit_log").insert([
    { actor_name: "M Mahesh", action: "REQUEST_CREATED", detail: "Final Year / Graduation Clearance", created_at: daysAgo(4) },
    { actor_name: "System", action: "CERTIFICATE_ISSUED", detail: "Certificate CV-26-R4J8KX issued to M Mahesh", created_at: daysAgo(2) },
    { actor_name: "Nikhil Rao", action: "REQUEST_CREATED", detail: "Final Year / Graduation Clearance", created_at: hoursAgo(20) },
    { actor_name: "Rahul Gupta", action: "REQUEST_CANCELLED", detail: "Hostel Vacating Clearance — reason: Submitted by mistake — selected the wrong semester while filing.", created_at: daysAgo(1) },
  ]);
  console.log("✔ demo history seeded (1 fully-signed certificate + 1 in-progress graduation file)");
}

console.log("\nDone. Start the API with:  npm run start   — it will log 'data layer → SUPABASE'");
