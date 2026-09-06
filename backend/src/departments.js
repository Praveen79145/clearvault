// ────────────────────────────────────────────────────────────────────────────
// DEPARTMENTS / OFFICES REGISTRY — the backend's source of truth for who can
// review what. Add a new office by appending one object here; queues, RBAC,
// officer titles and dashboards derive from this automatically.
// `legacy` maps old stored codes so historic records keep rendering.
// ────────────────────────────────────────────────────────────────────────────

export const DEPTS = [
  {
    id: "FINANCE", code: "FIN", name: "Finance Office", short: "Finance",
    officerTitle: "Finance Officer", icon: "wallet", legacy: ["ACCOUNTS"],
    checks: ["Tuition & term fees settled", "Pending payments reconciled", "Scholarship credit verified", "Payment receipts matched"],
  },
  {
    id: "LIBRARY", code: "LIB", name: "Library", short: "Library",
    officerTitle: "Library Officer", icon: "book-open", legacy: [],
    checks: ["Issued books returned", "Library fines cleared", "Lost/damaged book charges settled"],
  },
  {
    id: "HOSTEL", code: "HOS", name: "Hostel", short: "Hostel",
    officerTitle: "Hostel Warden", icon: "home", legacy: ["HOSTELS"],
    checks: ["Room dues & key handover", "Mess bill settled", "Paybills completed", "Hostel assets verified"],
  },
  {
    id: "SPORTS", code: "SPT", name: "Sports", short: "Sports",
    officerTitle: "Sports Officer", icon: "trophy", legacy: [],
    checks: ["Kits & equipment returned", "Sports fines settled"],
  },
  {
    id: "PHYSICS_LAB", code: "PHL", name: "Physics Lab", short: "Physics Lab",
    officerTitle: "Physics Lab Officer", icon: "zap", legacy: [],
    checks: ["Instruments returned", "Damage/loss charges settled"],
  },
  {
    id: "CHEMISTRY_LAB", code: "CHL", name: "Chemistry Lab", short: "Chemistry Lab",
    officerTitle: "Chemistry Lab Officer", icon: "flask", legacy: [],
    checks: ["Equipment returned", "Breakage charges settled"],
  },
  {
    id: "DEAN", code: "DEAN", name: "Dean's Office", short: "Dean",
    officerTitle: "Dean", icon: "landmark", legacy: [],
    checks: ["Academic record verified", "Department-level no-due confirmed"],
  },
  {
    id: "AO", code: "AO", name: "AO Office", short: "AO",
    officerTitle: "Administrative Officer", icon: "stamp", legacy: [],
    checks: ["Administrative verification completed"],
  },
  {
    id: "DIRECTOR", code: "DIR", name: "Director's Office", short: "Director",
    officerTitle: "Director", icon: "crown", legacy: [],
    checks: ["Final institutional approval granted"],
  },
];

/** Old stored codes → current codes (read-path only; nothing is rewritten). */
export const LEGACY_DEPT_MAP = { ACCOUNTS: "FINANCE", HOSTELS: "HOSTEL" };
export const normDept = (id) => LEGACY_DEPT_MAP[id] || id;

/** Lookup that also understands legacy codes and unknown ids safely. */
export const deptById = (id) =>
  DEPTS.find((d) => d.id === normDept(id)) ||
  { id, code: id, name: id, short: id, officerTitle: "Officer", icon: "hash", checks: [] };

export const publicDeptInfo = (id) => {
  const d = deptById(id);
  return { id: d.id, code: d.code, name: d.name, short: d.short, officerTitle: d.officerTitle, icon: d.icon, checks: d.checks };
};
