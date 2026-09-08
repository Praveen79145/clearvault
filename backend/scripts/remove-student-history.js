import "../src/env.js";
import { createClient } from "@supabase/supabase-js";

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env first.");
  process.exit(1);
}
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// Usage: node remove-student-history.js [--preview] email1 email2 ...
async function main() {
  const args = process.argv.slice(2);
  const preview = args.includes("--preview");
  const emails = args.filter((a) => a !== "--preview");
  if (!emails.length) {
    console.error("Provide one or more student emails to remove history for. Example:");
    console.error("  node remove-student-history.js --preview r220007@rguktrkv.ac.in o220854@rguktrkv.ac.in");
    process.exit(1);
  }

  for (const email of emails) {
    console.log(`\nProcessing ${email} (${preview ? 'PREVIEW' : 'DELETE'})`);
    // Find profile id
    const { data: prof, error: pErr } = await sb.from("profiles").select("id,roll_no,name").eq("email", email).maybeSingle();
    if (pErr) { console.error("Error fetching profile:", pErr); continue; }
    if (!prof) { console.log("Profile not found for", email); continue; }

    const pid = prof.id;
    // 1) clearances
    const { data: clears, error: cErr } = await sb.from("clearances").select("id,request_id,department_id").in("request_id", (await sb.from("clearance_requests").select("id").eq("student_id", pid)).data.map(r=>r.id));
    if (cErr) { console.error("Error fetching clearances:", cErr); }
    console.log(`Clearances to remove: ${clears ? clears.length : 0}`);

    // 2) clearance_requests
    const { data: reqs, error: rErr } = await sb.from("clearance_requests").select("id").eq("student_id", pid);
    if (rErr) { console.error("Error fetching requests:", rErr); }
    console.log(`Clearance requests to remove: ${reqs ? reqs.length : 0}`);

    // 3) payments
    const { data: pays, error: payErr } = await sb.from("payments").select("id").eq("student_id", pid);
    if (payErr) { console.error("Error fetching payments:", payErr); }
    console.log(`Payments to remove: ${pays ? pays.length : 0}`);

    // 4) notifications
    const { data: notifs, error: nErr } = await sb.from("notifications").select("id").eq("user_id", pid);
    if (nErr) { console.error("Error fetching notifications:", nErr); }
    console.log(`Notifications to remove: ${notifs ? notifs.length : 0}`);

    // 5) audit_log entries mentioning the user by name (best-effort)
    const { data: audits, error: aErr } = await sb.from("audit_log").select("id,actor_name").ilike("actor_name", `%${prof.name}%`);
    if (aErr) { console.error("Error fetching audit log:", aErr); }
    console.log(`Audit log entries to remove (matched by name): ${audits ? audits.length : 0}`);

    if (preview) continue;

    // Perform deletes in an order that avoids FK errors
    try {
      // delete clearances linked to these requests
      if (reqs && reqs.length) {
        const reqIds = reqs.map(r => r.id);
        await sb.from("clearances").delete().in("request_id", reqIds);
      }
      // delete requests
      await sb.from("clearance_requests").delete().eq("student_id", pid);
      // delete payments
      await sb.from("payments").delete().eq("student_id", pid);
      // delete notifications
      await sb.from("notifications").delete().eq("user_id", pid);
      // delete audit_log entries matched by actor_name
      if (audits && audits.length) {
        const aIds = audits.map(a => a.id);
        await sb.from("audit_log").delete().in("id", aIds);
      }

      console.log(`Deleted history for ${email}`);
    } catch (err) {
      console.error("Failed to delete history for", email, err);
    }
  }
  console.log("Finished.");
}

main().catch(e => { console.error(e); process.exit(1); });
