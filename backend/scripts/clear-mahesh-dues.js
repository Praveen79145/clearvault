import "../src/env.js";
import { createClient } from "@supabase/supabase-js";
import { shortSign } from "../src/sign.js";

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env first.");
  process.exit(1);
}
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function processStudent({ email, roll, setNoDues = false, setName = null }) {
  const now = new Date().toISOString();

  // Find profile by email first, then by roll_no to avoid quoting issues
  let profile = null;
  let pErr = null;
  try {
    const r1 = await sb.from("profiles").select("id,email,roll_no,dues,name").eq("email", email).maybeSingle();
    if (r1.error) throw r1.error;
    if (r1.data) profile = r1.data;
    else {
      const r2 = await sb.from("profiles").select("id,email,roll_no,dues,name").eq("roll_no", roll).maybeSingle();
      if (r2.error) throw r2.error;
      if (r2.data) profile = r2.data;
    }
  } catch (e) {
    pErr = e;
  }
  if (pErr) throw pErr;
  if (pErr) throw pErr;
  if (!profile) {
    console.log("Profile not found for", email, roll);
    return null;
  }
  console.log("Found profile:", profile.id, profile.name, profile.email, profile.roll_no);

  // Optionally update name
  if (setName && profile.name !== setName) {
    const { error: nErr } = await sb.from("profiles").update({ name: setName }).eq("id", profile.id);
    if (nErr) throw nErr;
    console.log(`Updated profile.name -> ${setName}`);
  }

  // Optionally set NO_DUES v2 snapshots for common departments
  if (setNoDues) {
    const DEPTS = ["FINANCE","LIBRARY","HOSTEL","SPORTS","PHYSICS_LAB","CHEMISTRY_LAB","DEAN","AO","DIRECTOR"];
    const noDues = { v: 2, status: "NO_DUES", total: 0, checkedAt: now, lines: [] };
    const duesObj = Object.fromEntries(DEPTS.map((d) => [d, noDues]));
    const { error: upErr } = await sb.from("profiles").update({ dues: duesObj }).eq("id", profile.id);
    if (upErr) throw upErr;
    console.log("Updated profile.dues -> NO_DUES for", profile.id);
  }

  return profile;
}

async function main() {
  // Only process C Kiran and B Praveen: approve all past requests/clearances
  const students = [
    { email: "r220007@rguktrkv.ac.in", roll: "R220007", setName: "C Kiran" },
    { email: "o220854@rguktrkv.ac.in", roll: "O220854" },
  ];
  const now = new Date().toISOString();

  for (const s of students) {
    const profile = await processStudent({ email: s.email, roll: s.roll, setNoDues: false, setName: s.setName || null });
    if (!profile) continue;

    const { data: reqs, error: rErr } = await sb.from("clearance_requests").select("id,completed_at").eq("student_id", profile.id);
    if (rErr) {
      console.error("Error fetching requests for", profile.email, rErr);
      continue;
    }
    if (!reqs || !reqs.length) {
      console.log(`No clearance requests found for ${profile.email}`);
      continue;
    }

    let totalUpdated = 0;
    for (const req of reqs) {
      const { data: clears, error: cErr } = await sb.from("clearances").select("id,department_id,status").eq("request_id", req.id);
      if (cErr) {
        console.error("Error fetching clearances for request", req.id, cErr);
        continue;
      }
      if (!clears || !clears.length) continue;
      for (const c of clears) {
        const signedAt = now;
        const { error: upd } = await sb.from("clearances").update({
          status: "APPROVED",
          remarks: "Cleared by admin (script)",
          approved_by: "System",
          signed_at: signedAt,
          signature_hash: shortSign(`${profile.roll_no}|${c.department_id}|${signedAt}`),
        }).eq("id", c.id);
        if (upd) {
          console.error("Failed to update clearance", c.id, upd);
          continue;
        }
        totalUpdated++;
      }
      if (!req.completed_at) {
        const { error: rc } = await sb.from("clearance_requests").update({ completed_at: now }).eq("id", req.id);
        if (rc) console.error("Failed to mark request completed", req.id, rc);
      }
    }
    console.log(`Updated ${totalUpdated} clearance rows to APPROVED for ${profile.name} <${profile.email}>`);
  }

  console.log("Done. Verify in Supabase dashboard or via API queries.");
}

main().catch((err) => { console.error(err); process.exit(1); });
