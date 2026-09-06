import { Router } from "express";
import { requireRole } from "../auth.js";
import { adminStats, auditList, listOfficers, createOfficer, setOfficerDisabled } from "../store.js";

const router = Router();

router.get("/stats", requireRole("ADMIN"), async (_req, res) => {
  res.json(await adminStats());
});

router.get("/audit", requireRole("ADMIN"), async (_req, res) => {
  res.json({ audit: await auditList() });
});

// ── Officer management ───────────────────────────────────────────────────────
router.get("/officers", requireRole("ADMIN"), async (_req, res) => {
  res.json({ officers: await listOfficers() });
});

router.post("/officers", requireRole("ADMIN"), async (req, res) => {
  const { name, email, dept, password } = req.body || {};
  try {
    const out = await createOfficer({ name, email, dept, password });
    res.status(201).json({ ok: true, ...out });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.put("/officers/:id", requireRole("ADMIN"), async (req, res) => {
  try {
    res.json(await setOfficerDisabled(req.params.id, !!req.body?.disabled));
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

export default router;
