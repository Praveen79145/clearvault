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

// For tracking purposes: request subtype identifiers within a combined card
export const SUBTYPE = {
  TC: "tc",
  GRADUATION: "graduation",
};

export const REQUEST_TYPES = [
  {
    id: "study-certificate",
    title: "Study Certificate",
    blurb: "Request an official certificate confirming your enrollment and academic standing.",
    purpose: "Study Certificate",
    icon: "award",
    requires: ["AO"], // Administrative Office
  },
  {
    id: "no-due-certificate",
    title: "No-Due Certificate",
    blurb: "Verify that you have no outstanding dues across Finance, Library, Hostel, and Sports.",
    purpose: "No-Due Certificate",
    icon: "check-circle",
    requires: ["FINANCE", "LIBRARY", "HOSTEL", "SPORTS"],
  },
  {
    id: "no-objection-certificate",
    title: "No Objection Certificate",
    blurb: "Obtain clearance from all required departments for external commitments.",
    purpose: "No Objection Certificate",
    icon: "clipboard-check",
    requires: ["FINANCE", "LIBRARY", "HOSTEL", "SPORTS"],
  },
  {
    id: "tc-graduation",
    title: "TC & Graduation Clearance",
    blurb: "Apply for your PUC Transfer Certificate and Graduation Clearance from one place.",
    purpose: "TC & Graduation Clearance",
    icon: "book-open",
    requires: ALL_OFFICES,
    // This is a combined card with two subtypes — each handled separately at the backend
    subtypes: [
      {
        id: "tc",
        title: "PUC Transfer Certificate",
        blurb: "Migration to another institution — full institutional clearance.",
        purpose: "TC / Migration Clearance",
        requires: ALL_OFFICES,
      },
      {
        id: "graduation",
        title: "Graduation Clearance",
        blurb: "Final-year clearance — every office signs off before certificate issuance.",
        purpose: "Final Year / Graduation Clearance",
        requires: ALL_OFFICES,
      },
    ],
  },
];

export const findRequestType = (id) => {
  const type = REQUEST_TYPES.find((t) => t.id === id);
  if (type) return type;
  // Handle legacy types that map to new combined types
  if (id === "tc") return REQUEST_TYPES.find((t) => t.id === "tc-graduation");
  if (id === "graduation") return REQUEST_TYPES.find((t) => t.id === "tc-graduation");
  return null;
};

/** Map a stored request back to its type using the purpose label. */
export function requestTypeOf(request) {
  const byPurpose = request && REQUEST_TYPES.find((t) => t.purpose === request.purpose);
  if (byPurpose) return byPurpose.id;
  // Legacy purposes that should map to the combined tc-graduation card
  if (request?.purpose === "TC / Migration Clearance") return "tc-graduation";
  if (request?.purpose === "Final Year / Graduation Clearance") return "tc-graduation";
  // Legacy/custom purposes fall back to a kebab-case slug so their detail
  // route stays addressable without touching old rows.
  return String(request?.purpose || "custom").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/** Mandatory offices for a stored request (type-driven, legacy-safe). */
export function requiredDeptsForType(typeId) {
  let t = findRequestType(typeId);
  return t ? t.requires : ["FINANCE", "LIBRARY", "HOSTEL", "SPORTS"];
}
export function requiredDeptsForRequest(request) {
  let t = request && REQUEST_TYPES.find((x) => x.purpose === request.purpose);
  return t ? t.requires : ["FINANCE", "LIBRARY", "HOSTEL", "SPORTS"];
}
