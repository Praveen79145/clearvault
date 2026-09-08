// ────────────────────────────────────────────────────────────────────────────
// DATA-LAYER DISPATCHER
//
// SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY → Supabase/PostgreSQL
// Otherwise                              → local JSON store
// ────────────────────────────────────────────────────────────────────────────

const useSupabase = Boolean(
  process.env.SUPABASE_URL &&
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const impl = useSupabase
  ? await import("./store.supabase.js")
  : await import("./store.json.js");

console.log(
  `[store] data layer → ${
    useSupabase
      ? "SUPABASE (PostgreSQL)"
      : "local JSON file (backend/data/db.json)"
  }`
);

// ─────────────────────────────────────────────
// Departments
// ─────────────────────────────────────────────

export const DEPTS = impl.DEPTS;

// ─────────────────────────────────────────────
// Users / Authentication
// ─────────────────────────────────────────────

export const findUserByEmail = impl.findUserByEmail;
export const findUserByIdentifier = impl.findUserByIdentifier;
export const findUserById = impl.findUserById;
export const setUserPassword = impl.setUserPassword;
export const updateUserPassword = impl.updateUserPassword;
export const registerStudent = impl.registerStudent;
export const registerAuthority = impl.registerAuthority;
export const createPasswordReset = impl.createPasswordReset;
export const findPasswordResetByHash = impl.findPasswordResetByHash;
export const invalidatePasswordReset = impl.invalidatePasswordReset;

// ─────────────────────────────────────────────
// Requests
// ─────────────────────────────────────────────

export const findRequestById = impl.findRequestById;
export const findClearanceById = impl.findClearanceById;
export const getActiveRequest = impl.getActiveRequest;
export const listStudentRequests = impl.listStudentRequests;
export const clearancesFor = impl.clearancesFor;
export const overallStatus = impl.overallStatus;
export const deptQueue = impl.deptQueue;
export const createRequest = impl.createRequest;
export const cancelRequest = impl.cancelRequest;
export const decide = impl.decide;
export const reapply = impl.reapply;

// ─────────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────────

export const notificationsFor = impl.notificationsFor;
export const markNotificationsRead = impl.markNotificationsRead;

// ─────────────────────────────────────────────
// Admin
// ─────────────────────────────────────────────

export const adminStats = impl.adminStats;
export const auditList = impl.auditList;
export const verifyCertificate = impl.verifyCertificate;

export const listOfficers = impl.listOfficers;
export const createOfficer = impl.createOfficer;
export const setOfficerDisabled = impl.setOfficerDisabled;

// ─────────────────────────────────────────────
// Student dues
// ─────────────────────────────────────────────

export const getStudentDues = impl.getStudentDues;

// ─────────────────────────────────────────────
// Payments
// ─────────────────────────────────────────────

export const createPaymentRecord = impl.createPaymentRecord;
export const findPaymentByOrder = impl.findPaymentByOrder;
export const markPaymentPaid = impl.markPaymentPaid;

// ─────────────────────────────────────────────
// Google authentication
// ─────────────────────────────────────────────

export const upsertGoogleStudent = impl.upsertGoogleStudent;