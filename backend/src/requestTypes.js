// ────────────────────────────────────────────────────────────────────────────
// REQUEST-TYPE REGISTRY + APPROVAL WORKFLOWS
// `requires` is the mandatory-approval configuration, enforced by the backend:
// clearances are created ONLY for these offices, and a certificate is issued
// only when every one of them is CLEARED. Change a workflow here and every
// layer (validation, fan-out, UI, issuance) follows — no frontend hardcoding.
//
// `purpose` strings match values historically stored in
// clearance_requests.purpose, so existing data maps to a type without migration.
// ────────────────────────────────────────────────────────────────────────────

const ALL_OFFICES = [
  "FINANCE", "LIBRARY", "HOSTEL", "SPORTS",
  "PHYSICS_LAB", "CHEMISTRY_LAB", "DEAN", "AO", "DIRECTOR",
];

export const REQUEST_TYPES = [
  {
    id: "semester",
    title: "Semester Clearance",
    blurb: "End-of-semester clearance — the Finance Office verifies fees and scholarship records.",
    purpose: "Semester Clearance",
    icon: "book-open",
    requires: ["FINANCE"],
  },
  {
    id: "hostel",
    title: "Hostel Vacating Clearance",
    blurb: "Room handover: the Warden verifies hostel & mess dues, paybills and assets.",
    purpose: "Hostel Vacating Clearance",
    icon: "home",
    requires: ["HOSTEL"],
  },
  {
    id: "tc",
    title: "Transfer Certificate (TC)",
    blurb: "Migration to another institution — full institutional clearance from all nine offices.",
    purpose: "TC / Migration Clearance",
    icon: "file-text",
    requires: ALL_OFFICES,
  },
  {
    id: "graduation",
    title: "Graduation Clearance",
    blurb: "Final-year clearance — every office signs off before the certificate is issued.",
    purpose: "Final Year / Graduation Clearance",
    icon: "grad-cap",
    requires: ALL_OFFICES,
  },
];

export const findRequestType = (id) => REQUEST_TYPES.find((t) => t.id === id) || null;

/** Map a stored request back to its type using the purpose label. */
export function requestTypeOf(request) {
  const byPurpose = request && REQUEST_TYPES.find((t) => t.purpose === request.purpose);
  if (byPurpose) return byPurpose.id;
  // Legacy/custom purposes fall back to a kebab-case slug so their detail
  // route stays addressable without touching old rows.
  return String(request?.purpose || "custom").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/** Mandatory offices for a stored request (type-driven, legacy-safe). */
export function requiredDeptsForType(typeId) {
  const t = findRequestType(typeId);
  return t ? t.requires : ["FINANCE", "LIBRARY", "HOSTEL", "SPORTS"];
}
export function requiredDeptsForRequest(request) {
  const t = request && REQUEST_TYPES.find((x) => x.purpose === request.purpose);
  return t ? t.requires : ["FINANCE", "LIBRARY", "HOSTEL", "SPORTS"];
}
