// Full post-Google pipeline reproduction — run: npm run debug:flow
// Simulates what happens AFTER Google verifies an identity, for every campus
// prefix, through the REAL dispatcher + store. Prints the same step log the
// OAuth callback prints live (so you can compare server output).
import("../src/store.js").then(async (store) => {
  const { validateGoogleIdentity } = await import("../src/rgukt.js");
  const CASES = [
    "r220246@rguktrkv.ac.in", "o220123@rguktrkv.ac.in",
    "n210456@rguktrkv.ac.in", "s230789@rguktrkv.ac.in",
  ];
  let failed = 0;
  for (const email of CASES) {
    console.log(`\n═══ ${email} ═══`);
    console.log("[google] Google identity verified (simulated)", { email, emailVerified: true });
    const verdict = validateGoogleIdentity({
      sub: "sim-" + email, email, emailVerified: true, name: "Simulated " + email[0].toUpperCase(),
    });
    if (!verdict.ok) { console.log("[google] ✘ policy rejected:", verdict.reason); failed++; continue; }
    console.log(`[google] RGUKT policy PASS · campus=${verdict.campusPrefix} studentId=${verdict.studentId}`);
    const user = await store.upsertGoogleStudent(verdict);
    console.log(`[google] user ready · userId=${user.id} rollNo=${user.rollNo} campus=${user.campus || verdict.campusPrefix}`);
    // Assertions
    const prefixOk = user.rollNo.startsWith(verdict.campusPrefix.toUpperCase());
    console.log(`  ▸ no prefix conversion: ${prefixOk ? "✔" : "✘ FAIL"} (${verdict.campusPrefix} → ${user.rollNo[0].toLowerCase()})`);
    console.log(`  ▸ session would be created for id ${user.id} → redirect /student`);
    if (!prefixOk) failed++;
  }
  console.log(failed ? `\n✘ ${failed} case(s) failed` : "\n✔ All four campuses pass the complete pipeline");
  process.exit(failed ? 1 : 0);
}).catch((e) => { console.error("PIPELINE CRASH:", e); process.exit(1); });
