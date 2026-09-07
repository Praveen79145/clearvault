import { DEPTS, normDept } from "./departments.js";

// ────────────────────────────────────────────────────────────────────────────
// DEPARTMENT DUES — deterministic fixture engine + snapshot helpers.
//
// One source of truth for the demo ledger each office checks before signing:
//   · FINANCE      → tuition fee + scholarship due
//   · LIBRARY      → books issued & not returned + library fine
//   · HOSTEL       → hostel dues + mess dues
//   · SPORTS       → issued kit/equipment + equipment charges
//   · PHYSICS_LAB / CHEMISTRY_LAB → issued equipment, unreturned equipment,
//                                   breakage / usage charges
//   · DEAN / AO / DIRECTOR → register check only (no money on file)
//
// CANONICAL SNAPSHOT (stored verbatim on every clearance at request-creation):
//   {
//     v: 2,
//     status: "NO_DUES" | "DUES_FOUND",
//     total: <sum of line amounts, ₹>,
//     checkedAt: <ISO stamp — when this snapshot was produced>,
//     lines: [{ label, detail, amount }],
//     waived?: { by, at, total }          // only if an officer waived it
//   }
//
// The officer reads THE STORED SNAPSHOT — the number they sign off is the
// number that stays auditable on the historical request. Rows created by
// older builds (legacy `dues: [{label, amount}]` arrays, or no dues column
// at all) are upgraded on READ by normalizeDues(); decide() persists the
// exact snapshot it enforced, so enforcement never depends on the client.
//
// Alternation for the demo: seeded students have fixed fixtures (Ananya &
// Rohan always clean; Karan owes Hostel + Physics Lab; Zoya owes Finance,
// Hostel, Sports and Chemistry Lab) — and any other student (e.g. one
// provisioned via Google sign-in) gets a stable pseudo-random mix derived
// from their roll number, so different students intentionally show BOTH
// NO DUES and DUES FOUND across departments.
// ────────────────────────────────────────────────────────────────────────────

// ── Deterministic hashing / RNG (no crypto needed for demo data) ────────────
const hash32 = (str) => {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};
// Simple xorshift — seeded by the hash, so the same (rollNo, dept) pair
// always produces the same numbers.
const makeRng = (seed) => () => {
  seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
  return (seed >>>= 0) / 4294967296;
};

// ── Clean (NO DUES) line templates — the standard items every office checks ─
const CLEAN_LINES = {
  FINANCE: () => [
    { label: "Tuition fee", detail: "All semester instalments settled", amount: 0 },
    { label: "Scholarship due", detail: "No recoverable scholarship amount on account", amount: 0 },
  ],
  LIBRARY: () => [
    { label: "Books pending", detail: "No titles outstanding", value: "0", amount: 0 },
    { label: "Library fine", detail: "No overdue fines on account", amount: 0 },
  ],
  HOSTEL: () => [
    { label: "Hostel dues", detail: "Room rent cleared to date", amount: 0 },
    { label: "Mess dues", detail: "All mess bills settled", amount: 0 },
    { label: "Paybill", detail: "No pending hostel paybill", amount: 0 },
  ],
  SPORTS: () => [
    { label: "Kit / equipment issued", detail: "Nothing on issue under this roll number", amount: 0 },
    { label: "Equipment charges", detail: "No loss or damage charges", amount: 0 },
  ],
  PHYSICS_LAB: () => [
    { label: "Equipment issued", detail: "No equipment on issue", amount: 0 },
    { label: "Equipment unreturned", detail: "Nothing outstanding", amount: 0 },
    { label: "Breakage / usage charges", detail: "No charges applicable", amount: 0 },
  ],
  CHEMISTRY_LAB: () => [
    { label: "Equipment issued", detail: "No equipment on issue", amount: 0 },
    { label: "Equipment unreturned", detail: "Nothing outstanding", amount: 0 },
    { label: "Breakage / usage charges", detail: "No charges applicable", amount: 0 },
  ],
  DEAN: () => [{ label: "Academic & conduct record", detail: "No objection on the Dean's register", amount: 0 }],
  AO: () => [{ label: "Administrative record", detail: "No objection on the AO's register", amount: 0 }],
  DIRECTOR: () => [{ label: "Directorate record", detail: "No objection on the Director's register", amount: 0 }],
};

// ── Fixed fixtures for the seeded demo students (by roll number) ────────────
// Intentionally mixed so the demo always contains BOTH examples per office:
//   Finance      — Ananya ₹0/₹0 (NO DUES) · Zoya ₹2,500+₹1,000 (DUES) · Karan ₹0+₹500
//   Library      — Ananya clean · Karan 2 books + ₹150 (DUES)
//   Hostel       — Ananya clean · Karan ₹1,500+₹800 · Zoya ₹950+₹1,800 (DUES)
//   Sports       — Zoya with an unreturned kit · others clean
//   Physics lab  — Karan with an unreturned instrument · others clean
//   Chemistry    — Zoya with unreturned glassware · others clean
//
// Every entry is keyed by UPPER-CASE roll number and is fully deterministic —
// the same (rollNo, dept) pair always yields the same lines, so refreshing or
// re-logging never changes what an officer sees on a given file.
const DEMO_FIXTURES = {
  // Ananya Verma — spotless file, behaves as textbook "NO DUES" everywhere
  CS22B1047: {},
  // Rohan Mehta — graduated cleanly
  EC22B0913: {},
  // Karan Patel — mid-clearance: hostel rent short, library books overdue,
  //               physics locker open, scholarship recovery on file
  ME21B0755: {
    FINANCE: [
      { label: "Tuition fee", detail: "Semester 7 instalment settled", amount: 0 },
      { label: "Scholarship due", detail: "Merit-scholarship adjustment pending — ₹500 recoverable", amount: 500 },
    ],
    HOSTEL: [
      { label: "Hostel dues", detail: "Room rent — Semester 7 (June–July) short-paid", amount: 1500 },
      { label: "Mess dues", detail: "Mess bill — July arrears", amount: 800 },
      { label: "Paybill", detail: "No pending hostel paybill", amount: 0 },
    ],
    PHYSICS_LAB: [
      { label: "Equipment issued", detail: "2 instruments issued this semester", amount: 0 },
      { label: "Equipment unreturned", detail: "Vernier caliper + optical bench convex lens — locker 14", amount: 450 },
      { label: "Breakage / usage charges", detail: "No charges applicable", amount: 0 },
    ],
    LIBRARY: [
      { label: "Books pending", detail: "2 titles past due date", value: "2", amount: 0 },
      { label: "Library fine", detail: "Overdue fine accrued", amount: 300 },
    ],
  },
  // Zoya Khan — the worked "DUES FOUND" example across several offices
  BT23B0621: {
    FINANCE: [
      { label: "Tuition fee", detail: "Semester 2 instalment unpaid", amount: 2500 },
      { label: "Scholarship due", detail: "Merit-scholarship advance — recoverable adjustment", amount: 1000 },
    ],
    HOSTEL: [
      { label: "Hostel dues", detail: "Room rent — July arrears", amount: 950 },
      { label: "Mess dues", detail: "Mess bill — July", amount: 1800 },
      { label: "Paybill", detail: "No pending hostel paybill", amount: 0 },
    ],
    SPORTS: [
      { label: "Kit / equipment issued", detail: "Cricket kit (bat, pads, gloves, helmet) — issued Aug 12", amount: 0 },
      { label: "Equipment charges", detail: "Kit not returned — replacement cost + worn grips", amount: 1500 },
    ],
    CHEMISTRY_LAB: [
      { label: "Equipment issued", detail: "Titrimetric set issued (burette, pipette, flask)", amount: 0 },
      { label: "Equipment unreturned", detail: "50 ml burette — drawer C-3, not returned", amount: 380 },
      { label: "Breakage / usage charges", detail: "One cracked 250 ml beaker", amount: 120 },
    ],
  },
};

// Per-student demo library book records (optional). Keys are UPPER-CASE roll numbers.
// These are used only by the demo `computeDues` to include per-book amounts and
// to return a `books` array in the canonical snapshot for the LIBRARY department.
const DEMO_BOOKS = {
  // Student 1: 2 pending books (₹500 + ₹500) + fine ₹300 => total ₹1,300
  ME21B0755: [
    { id: "LIB-2025-00124", name: "Database Management Systems", issueDate: "2026-08-12", dueDate: "2026-08-26", amount: 500, status: "PENDING" },
    { id: "LIB-2025-00187", name: "Operating System Concepts", id2: "LIB-2025-00187", issueDate: "2026-08-15", dueDate: "2026-08-29", amount: 500, status: "PENDING" },
  ],
  // Student 2: 1 pending book (₹400) + fine ₹0 => total ₹400
  CS22B1047: [
    { id: "LIB-2025-00201", name: "Computer Networks", issueDate: "2026-08-10", dueDate: "2026-08-24", amount: 400, status: "PENDING" },
  ],
  // Student 3: no pending books
  BT23B0621: [],
};

// ── Generic fallback (Google-provisioned or admin-added students) ───────────
// ~45% chance per office of dues, with plausible line items — deterministic
// per (rollNo, dept) so every screen and every retry agrees on the amounts.
function generatedLines(rollNo, requestId, dept) {
  const rng = makeRng(hash32(`${rollNo}|${requestId}|${dept}`));
  if (rng() > 0.45 || !CLEAN_LINES[dept] || ["DEAN", "AO", "DIRECTOR"].includes(dept))
    return CLEAN_LINES[dept] ? CLEAN_LINES[dept]() : [];
  const r100 = (n) => Math.round(n / 100) * 100; // round to believable amounts
  switch (dept) {
    case "FINANCE":
      { const scholarshipDue = rng() > 0.5;
      return [
        { label: "Tuition fee", detail: "One semester instalment pending", amount: r100(1500 + rng() * 3500) },
        { label: "Scholarship due", detail: scholarshipDue ? "Recoverable scholarship adjustment" : "No recoverable scholarship amount on account", amount: scholarshipDue ? r100(500 + rng() * 1500) : 0 },
      ];
      }
    case "LIBRARY": {
      const n = 1 + Math.floor(rng() * 2);
      return [
        { label: "Books pending", detail: `${n} title${n > 1 ? "s" : ""} past due date`, value: String(n), amount: r100(300 * n + rng() * 400) },
        { label: "Library fine", detail: "Overdue fine accrued", amount: r100(80 + rng() * 420) },
      ];
    }
    case "HOSTEL":
      return [
        { label: "Hostel dues", detail: "Room rent arrears", amount: r100(800 + rng() * 1600) },
        { label: "Mess dues", detail: "Mess bill balance", amount: r100(600 + rng() * 1800) },
      ];
    case "SPORTS":
      return [
        { label: "Kit / equipment issued", detail: "Team kit on issue", amount: 0 },
        { label: "Equipment charges", detail: "Unreturned equipment — assessed charge", amount: r100(400 + rng() * 1200) },
      ];
    case "PHYSICS_LAB":
    case "CHEMISTRY_LAB":
      return [
        { label: "Equipment issued", detail: "Instruments/glassware on issue this semester", amount: 0 },
        { label: "Equipment unreturned", detail: "One item outstanding", amount: r100(250 + rng() * 650) },
        { label: "Breakage / usage charges", detail: rng() > 0.5 ? "Minor breakage charge" : "No charges applicable", amount: rng() > 0.5 ? r100(60 + rng() * 240) : 0 },
      ];
    default:
      return [];
  }
}

/** Produce the canonical dues snapshot the office will review. */
export function computeDues({ rollNo, requestId, dept, checkedAt }) {
  const roll = String(rollNo || "").toUpperCase();
  const fixture = DEMO_FIXTURES[roll];
  // A named demo student is intentionally fixed across all offices: omitted
  // department entries mean that office has the clean standard record. Only
  // unseeded students use the request-ID-derived fixture generator.
  const lines = fixture
    ? (fixture[dept] || (CLEAN_LINES[dept] ? CLEAN_LINES[dept]() : []))
    : generatedLines(roll, requestId || "legacy", dept);
  let baseTotal = lines.reduce((a, l) => a + (l.amount || 0), 0);

  // If this is the library department, include per-student demo books and
  // ensure the canonical `lines` reflect the books' count and amounts so the
  // UI always derives display values from the same source.
  if (dept === "LIBRARY") {
    const books = DEMO_BOOKS[roll] || [];
    const pendingBooks = (books || []).filter((b) => !b.status || b.status === "PENDING");
    const booksTotal = pendingBooks.reduce((s, b) => s + (Number(b.amount || 0)), 0);

    // Ensure there's a 'Books pending' line and set its `value` from the books list
    // and its `amount` to the aggregated books amount so text builders like
    // `rejectDesc()` produce consistent messages.
    const outLines = (lines || []).map((l) => ({ ...l }));
    const idx = outLines.findIndex((l) => l.label === "Books pending");
    if (idx >= 0) {
      outLines[idx].value = String(pendingBooks.length);
      outLines[idx].amount = booksTotal;
      outLines[idx].detail = pendingBooks.length ? `${pendingBooks.length} title${pendingBooks.length > 1 ? "s" : ""} past due date` : "No titles outstanding";
    } else {
      outLines.unshift({ label: "Books pending", detail: pendingBooks.length ? `${pendingBooks.length} title${pendingBooks.length > 1 ? "s" : ""} past due date` : "No titles outstanding", value: String(pendingBooks.length), amount: booksTotal });
    }

    // Recompute base total as lines (library fine may already be present) + booksTotal
    baseTotal = outLines.reduce((a, l) => a + (l.amount || 0), 0);

    return {
      v: 2,
      status: baseTotal > 0 ? "DUES_FOUND" : "NO_DUES",
      total: baseTotal,
      checkedAt: checkedAt || null,
      lines: outLines,
      books: pendingBooks,
    };
  }

  return {
    v: 2,
    status: baseTotal > 0 ? "DUES_FOUND" : "NO_DUES",
    total: baseTotal,
    checkedAt: checkedAt || null,
    lines,
  };
}

/**
 * Upgrade ANY stored value to the canonical snapshot:
 *   v2 object → as-is  ·  legacy [{label, amount}] array → converted
 *   null / column missing (pre-migration Supabase) → computed deterministically
 * Never throws — an unknown shape simply recomputes like a missing column.
 */
export function normalizeDues(raw, { rollNo, requestId, dept, checkedAt } = {}) {
  if (raw && raw.v === 2 && Array.isArray(raw.lines)) return raw;
  if (Array.isArray(raw)) {
    const lines = raw.map((d) => ({ label: d.label || "Due", detail: d.detail || "", amount: d.amount || 0 }));
    const total = lines.reduce((a, l) => a + l.amount, 0);
    return { v: 2, status: total > 0 ? "DUES_FOUND" : "NO_DUES", total, checkedAt: checkedAt || null, lines };
  }
  return computeDues({ rollNo, requestId, dept, checkedAt });
}

/** Display helper (backend messages) — ₹1,23,400 style */
export const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

// ── Department metadata lookup for description builders ──────────────────────
const deptMeta = (id) => {
  const d = DEPTS.find((x) => x.id === id) || DEPTS.find((x) => x.id === normDept(id));
  return d ? { name: d.name, short: d.short } : { name: id, short: id };
};

// ── Department-specific description builders ────────────────────────────────
// These produce the pre-filled text the officer can edit before recording an
// approval or rejection. They are deterministic per (dept, lines) and never
// hardcode a single department's language — the description adapts to whatever
// office is reviewing the file.

/** Pre-filled approval note shown to officers who click "No Dues" → Sign & clear. */
export function approveDesc(dept, dues) {
  const d = deptMeta(dept);
  const short = d.short;
  switch (dept) {
    case "FINANCE":
      return `All ${short} records have been verified. No outstanding tuition fee or scholarship dues are pending.`;
    case "LIBRARY":
      return `All ${short} records have been verified. No books are outstanding and no library fines are due.`;
    case "HOSTEL":
      return `All ${short} records have been verified. No outstanding room, mess or paybill dues are pending.`;
    case "SPORTS":
      return `All ${short} records have been verified. No kits or equipment are outstanding.`;
    case "PHYSICS_LAB":
      return `All ${short} records have been verified. No instruments or charges are outstanding.`;
    case "CHEMISTRY_LAB":
      return `All ${short} records have been verified. No equipment or charges are outstanding.`;
    case "DEAN":
      return `${d.name} record verified — no objection on the Dean's register.`;
    case "AO":
      return `${d.name} record verified — no objection on the AO's register.`;
    case "DIRECTOR":
      return `${d.name} record verified — final institutional approval granted.`;
    default:
      const lineText = (dues?.lines || []).map((l) => l.label.toLowerCase()).join(" and ");
      return `All ${short} records have been verified. ${lineText ? `No outstanding ${lineText} are pending.` : "No dues are pending."}`;
  }
}

/** Pre-filled rejection note shown to officers who click "Dues" → Reject & return. */
export function rejectDesc(dept, dues) {
  const d = deptMeta(dept);
  const short = d.short;
  if (!dues || !dues.lines) return `Outstanding dues in ${short}. Please clear and re-apply.`;
  const parts = dues.lines
    .filter((l) => (l.amount || 0) > 0)
    .map((l) => `${inr(l.amount)} ${l.label.toLowerCase()}`);
  if (!parts.length) return `Outstanding dues in ${short}. Please clear and re-apply.`;
  const tail = parts.length === 1 ? `${parts[0]} is pending.` : `${parts.join(" and ")} are pending.`;
  return tail.charAt(0).toUpperCase() + tail.slice(1);
}
