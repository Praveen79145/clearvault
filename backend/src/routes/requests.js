import { Router } from "express";
import { requireRole } from "../auth.js";
import {
  createRequest, cancelRequest, getActiveRequest, clearancesFor, overallStatus, reapply, getStudentDues,
  findClearanceById, findRequestById, listStudentRequests,
} from "../store.js";
import { REQUEST_TYPES, findRequestType } from "../requestTypes.js";
import { publicDeptInfo, deptById } from "../departments.js";

/** Enrich a clearance row with display metadata (legacy codes resolve too) */
const withDeptMeta = (c) => {
  const d = deptById(c.dept);
  return { ...c, deptName: d.name, officerTitle: d.officerTitle, deptIcon: d.icon };
};

const router = Router();

/** Catalog of selectable request types (cards on the student home),
 *  with each type's mandatory offices expanded for display. */
router.get("/request-types", requireRole("STUDENT"), (_req, res) => {
  res.json({
    types: REQUEST_TYPES.map((t) => ({
      ...t,
      requires: t.requires.map((id) => publicDeptInfo(id)),
    })),
  });
});

/** Every request this student has ever filed (typed + status) — powers "Your requests" */
router.get("/requests/list", requireRole("STUDENT"), async (req, res) => {
  res.json({ requests: await listStudentRequests(req.user.id) });
});

/**
 * Compact student-dashboard ledger for the major service departments.
 * If this student has a request, its stored clearance snapshot is used—the
 * exact same record the officer sees. Before a request exists, a stable
 * student-ID fixture provides a pre-flight view without random page loads.
 */
router.get("/student/dues", requireRole("STUDENT"), async (req, res) => {
  const ids = ["FINANCE", "LIBRARY", "HOSTEL", "SPORTS"];
  const departments = await Promise.all(ids.map(async (dept) => {
    const record = await getStudentDues(req.user.id, dept);
    const { dues, clearance } = record;
    const d = deptById(dept);
    return {
      id: dept, name: d.name, short: d.short, icon: d.icon, dues,
      // expose `books` at the top-level for the frontend library modal
      books: dues?.books || null,
      clearanceStatus: clearance?.status || "NOT_REQUESTED",
      officerDescription: clearance?.remarks || null,
      requestId: clearance?.requestId || null,
    };
  }));
  res.json({ departments });
});

router.post("/requests", requireRole("STUDENT"), async (req, res) => {
  // Backend validates the type — client-supplied values are never trusted
  const type = findRequestType(String(req.body?.type || ""));
  if (!type) {
    return res.status(400).json({ error: "Unknown request type. Choose one from the list." });
  }
  const existing = await getActiveRequest(req.user.id);
  if (existing) {
    const os = await overallStatus(existing.id);
    // Completed and CANCELLED filings are history — they never block a new one.
    if (os !== "COMPLETED" && os !== "CANCELLED") {
      return res.status(400).json({ error: "You already have an active clearance request." });
    }
  }
  const r = await createRequest(req.user, type); // fan-out uses type.requires (backend-enforced)
  res.json({ ok: true, requestId: r.id, type: type.id });
});

router.get("/requests/mine", requireRole("STUDENT"), async (req, res) => {
  const request = await getActiveRequest(req.user.id);
  if (!request) return res.json({ request: null, clearances: [] });
  res.json({
    request,
    overall: await overallStatus(request.id),
    clearances: (await clearancesFor(request.id)).map(withDeptMeta),
  });
});

/** One request in full — but only ever the signed-in student's own */
router.get("/requests/:id", requireRole("STUDENT"), async (req, res) => {
  const request = await findRequestById(req.params.id);
  if (!request) return res.status(404).json({ error: "Request not found" });
  if (request.studentId !== req.user.id)
    return res.status(403).json({ error: "This request belongs to another student." });
  res.json({
    request,
    overall: await overallStatus(request.id),
    clearances: (await clearancesFor(request.id)).map(withDeptMeta),
  });
});

/**
 * Cancel the sign-in student's own request.
 * Backend verifies: authenticated → ownership → cancellable state → not already
 * cancelled → no certificate issued (guards inside cancelRequest are atomic).
 */
router.post("/requests/:id/cancel", requireRole("STUDENT"), async (req, res) => {
  const request = await findRequestById(req.params.id);
  if (!request) return res.status(404).json({ error: "Request not found" });
  if (request.studentId !== req.user.id)
    return res.status(403).json({ error: "This request belongs to another student." });
  try {
    await cancelRequest(request.id, req.user, String(req.body?.reason || "").trim());
    res.json({ ok: true });
  } catch (e) {
    res.status(409).json({ error: e.message }); // conflict — already cancelled / completed
  }
});

router.post("/clearances/:id/reapply", requireRole("STUDENT"), async (req, res) => {
  const clearance = await findClearanceById(req.params.id);
  if (!clearance) return res.status(404).json({ error: "Not found" });
  const request = await findRequestById(clearance.requestId);
  if (!request || request.studentId !== req.user.id) return res.status(403).json({ error: "Forbidden" });
  if (clearance.status !== "REJECTED")
    return res.status(400).json({ error: "Only rejected departments can be re-applied." });
  try {
    await reapply(clearance.id, req.user);
    res.json({ ok: true });
  } catch (e) {
    res.status(409).json({ error: e.message });
  }
});

export default router;
