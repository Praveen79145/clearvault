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
  mkUser("Aarav Kumar", "r220101@rguktrkv.ac.in", "student123", "STUDENT", null, "R220101", {
    meta: { phone: "+91-7700010101", campus: "rguktrkv" }
  }),
  mkUser("Bhavana Reddy", "r220102@rguktrkv.ac.in", "student123", "STUDENT", null, "R220102", {
    LIBRARY: {
      v: 2,
      lines: [
        { label: "Books pending", detail: "1 title past due date", value: "1", amount: 400 },
        { label: "Library fine", detail: "Overdue fine accrued", amount: 120 }
      ],
      books: [
        { id: "LIB-2026-01001", name: "Computer Networks", issueDate: "2026-07-10", dueDate: "2026-07-24", amount: 400, status: "PENDING" }
      ]
    },
    meta: { phone: "+91-7700010102", campus: "rguktrkv" }
  }),
  mkUser("Chaitanya N", "r220103@rguktrkv.ac.in", "student123", "STUDENT", null, "R220103", {
    FINANCE: {
      v: 2,
      lines: [
        { label: "Tuition fee", detail: "Semester instalment unpaid", amount: 50000 },
        { label: "Scholarship due", detail: "No scholarship", amount: 0 }
      ]
    },
    meta: { phone: "+91-7700010103", campus: "rguktrkv" }
  }),
  mkUser("Divya Shetty", "r220104@rguktrkv.ac.in", "student123", "STUDENT", null, "R220104", {
    HOSTEL: {
      v: 2,
      lines: [
        { label: "Hostel dues", detail: "Room rent — July arrears", amount: 3000 },
        { label: "Mess dues", detail: "Mess bill — July", amount: 2400 },
        { label: "Paybill", detail: "No pending hostel paybill", amount: 0 }
      ]
    },
    meta: { phone: "+91-7700010104", campus: "rguktrkv" }
  }),
  mkUser("Eesha Patel", "r220105@rguktrkv.ac.in", "student123", "STUDENT", null, "R220105", {
    FINANCE: {
      v: 2,
      lines: [
        { label: "Tuition fee", detail: "Semester instalment unpaid", amount: 45000 },
        { label: "Scholarship due", detail: "Partial scholarship", amount: 10000 }
      ]
    },
    LIBRARY: {
      v: 2,
      lines: [
        { label: "Books pending", detail: "1 title past due date", value: "1", amount: 350 },
        { label: "Library fine", detail: "Overdue fine accrued", amount: 80 }
      ],
      books: [{ id: "LIB-2026-01111", name: "Data Structures", issueDate: "2026-06-10", dueDate: "2026-06-24", amount: 350, status: "PENDING" }]
    },
    SPORTS: {
      v: 2,
      lines: [
        { label: "Kit / equipment issued", detail: "Team kit on issue", amount: 0 },
        { label: "Equipment charges", detail: "Jersey replacement", amount: 900 }
      ]
    },
    meta: { phone: "+91-7700010105", campus: "rguktrkv" }
  }),
  mkUser("Farhan Mohammed", "r220106@rguktrkv.ac.in", "student123", "STUDENT", null, "R220106", {
    HOSTEL: {
      v: 2,
      lines: [
        { label: "Hostel dues", detail: "Room rent — June arrears", amount: 1800 },
        { label: "Mess dues", detail: "Mess bill balance", amount: 1200 }
      ]
    },
    LIBRARY: {
      v: 2,
      lines: [ { label: "Books pending", detail: "1 title past due date", value: "1", amount: 400 }, { label: "Library fine", detail: "Overdue fine", amount: 150 } ],
      books: [{ id: "LIB-2026-01234", name: "Operating System Concepts", issueDate: "2026-07-01", dueDate: "2026-07-15", amount: 400, status: "PENDING" }]
    },
    meta: { phone: "+91-7700010106", campus: "rguktrkv" }
  }),
  mkUser("Gayatri Thampi", "r220107@rguktrkv.ac.in", "student123", "STUDENT", null, "R220107", {
    meta: { phone: "+91-7700010107", campus: "rguktrkv" }
  }),
  mkUser("Harish Varma", "r220108@rguktrkv.ac.in", "student123", "STUDENT", null, "R220108", {
    FINANCE: { v: 2, lines: [ { label: "Tuition fee", detail: "Semester instalment unpaid", amount: 20000 }, { label: "Scholarship due", detail: "No scholarship", amount: 0 } ] },
    HOSTEL: { v: 2, lines: [ { label: "Hostel dues", detail: "Room rent — July", amount: 2500 } ] },
    SPORTS: { v: 2, lines: [ { label: "Equipment charges", detail: "Replacement shoes", amount: 1200 } ] }
  , meta: { phone: "+91-7700010108", campus: "rguktrkv" } }),
  mkUser("Indra Kumar", "r220109@rguktrkv.ac.in", "student123", "STUDENT", null, "R220109", {
    LIBRARY: { v: 2, lines: [ { label: "Books pending", detail: "1 title past due date", value: "1", amount: 300 }, { label: "Library fine", detail: "Overdue fine", amount: 90 } ], books: [{ id: "LIB-2026-01321", name: "Modern Physics", issueDate: "2026-07-05", dueDate: "2026-07-19", amount: 300, status: "PENDING" }] },
    PHYSICS_LAB: { v: 2, lines: [ { label: "Equipment unreturned", detail: "Oscilloscope lead not returned", amount: 600 } ] }
  , meta: { phone: "+91-7700010109", campus: "rguktrkv" } }),
  mkUser("Jaya Lal", "r220110@rguktrkv.ac.in", "student123", "STUDENT", null, "R220110", {
    FINANCE: { v: 2, lines: [ { label: "Tuition fee", detail: "Semester instalment unpaid", amount: 32000 }, { label: "Scholarship due", detail: "Partial scholarship", amount: 5000 } ] },
    CHEMISTRY_LAB: { v: 2, lines: [ { label: "Breakage / usage charges", detail: "Cracked 250 ml beaker", amount: 1200 } ] },
    HOSTEL: { v: 2, lines: [ { label: "Mess dues", detail: "Mess bill balance", amount: 900 } ] }
  , meta: { phone: "+91-7700010110", campus: "rguktrkv" } }),
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
let created = 0, repaired = 0, kept = 0;
for (const u of USERS) {
  const exists = must(await sb.from("profiles").select("id,salt,password_hash").eq("email", u.email).maybeSingle());
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
    must(await sb.from("profiles").update({ salt, password_hash: hashPassword(u.__pw, salt) }).eq("id", exists.id));
    // Also update seeded metadata + dues for existing student rows
    if (u.role === "STUDENT") {
      try {
        const updates2 = { name: u.name, roll_no: u.roll_no || null, dues: u.dues || null };
        await sb.from("profiles").update(updates2).eq("id", exists.id);
      } catch (e) {
        // ignore if column doesn't exist yet
      }
    }
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
  const stuA = idByEmail["r220101@rguktrkv.ac.in"];
  const stuB = idByEmail["r220103@rguktrkv.ac.in"];
  const stuC = idByEmail["r220104@rguktrkv.ac.in"];
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
      signature_hash: shortSign(`R220101|${d}|${at}`),
    };
  }));

  const r2 = must(await sb.from("clearance_requests").insert({
    student_id: stuB, purpose: "Final Year / Graduation Clearance", created_at: hoursAgo(20),
  }).select().single());
  await sb.from("clearances").insert(ALL.map((d) =>
    ["FINANCE", "LIBRARY", "SPORTS"].includes(d)
      ? { request_id: r2.id, department_id: d, status: "APPROVED", remarks: "Cleared.",
          approved_by: officerOf(d), signed_at: hoursAgo(12),
          signature_hash: shortSign(`R220103|${d}|${hoursAgo(12)}`) }
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
    { actor_name: "Aarav Kumar", action: "REQUEST_CREATED", detail: "Final Year / Graduation Clearance", created_at: daysAgo(4) },
    { actor_name: "System", action: "CERTIFICATE_ISSUED", detail: "Certificate CV-26-R4J8KX issued to Aarav Kumar", created_at: daysAgo(2) },
    { actor_name: "Chaitanya N", action: "REQUEST_CREATED", detail: "Final Year / Graduation Clearance", created_at: hoursAgo(20) },
    { actor_name: "Divya Shetty", action: "REQUEST_CANCELLED", detail: "Hostel Vacating Clearance — reason: Submitted by mistake — selected the wrong semester while filing.", created_at: daysAgo(1) },
  ]);
  console.log("✔ demo history seeded (1 fully-signed certificate + 1 in-progress graduation file)");
}

console.log("\nDone. Start the API with:  npm run start   — it will log 'data layer → SUPABASE'");
