import { Router } from "express";
import { requireRole } from "../auth.js";
import { deptQueue, decide, findClearanceById } from "../store.js";
import { normDept, publicDeptInfo } from "../departments.js";

const router = Router();

/** Officer's queue + the office profile (title, review checklist) */
router.get("/clearances", requireRole("STAFF"), async (req, res) => {
  res.json({
    queue: await deptQueue(req.user.dept),
    deptInfo: publicDeptInfo(req.user.dept),
  });
});

router.put("/clearances/:id", requireRole("STAFF"), async (req, res) => {
  const { action, remarks } = req.body || {};
  const clearance = await findClearanceById(req.params.id);
  if (!clearance) return res.status(404).json({ error: "Clearance not found" });
  // Department-scoped authorization: officers act ONLY on their own office
  if (normDept(clearance.dept) !== normDept(req.user.dept))
    return res.status(403).json({ error: "This approval belongs to another office. You are not authorized." });
  if (clearance.status !== "PENDING")
    return res.status(400).json({ error: "This clearance has already been decided." });

  const approve = action === "APPROVE";
  if (!approve && !(remarks || "").trim())
    return res.status(400).json({ error: "A comment is required when returning/rejecting — the student must know what to fix." });

  try {
    await decide(clearance.id, approve, (remarks || "").trim(), req.user);
    res.json({ ok: true });
  } catch (e) {
    // Cancelled / already-completed / already-decided files are frozen
    res.status(409).json({ error: e.message });
  }
});

export default router;
