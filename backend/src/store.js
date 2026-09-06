// ────────────────────────────────────────────────────────────────────────────
// DATA-LAYER DISPATCHER — imports the right implementation once, at boot.
//   .env has SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY  →  Supabase (Postgres)
//   otherwise                                          →  local JSON store
// ────────────────────────────────────────────────────────────────────────────

const useSupabase = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

const impl = useSupabase
  ? await import("./store.supabase.js")
  : await import("./store.json.js");

console.log(`[store] data layer → ${useSupabase ? "SUPABASE (PostgreSQL)" : "local JSON file (backend/data/db.json)"}`);

export const DEPTS = impl.DEPTS;
export const findUserByEmail = impl.findUserByEmail;
export const findUserById = impl.findUserById;
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
export const notificationsFor = impl.notificationsFor;
export const markNotificationsRead = impl.markNotificationsRead;
export const adminStats = impl.adminStats;
export const auditList = impl.auditList;
export const verifyCertificate = impl.verifyCertificate;
export const upsertGoogleStudent = impl.upsertGoogleStudent;
export const listOfficers = impl.listOfficers;
export const createOfficer = impl.createOfficer;
export const setOfficerDisabled = impl.setOfficerDisabled;
