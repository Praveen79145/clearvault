import { Router } from "express";
import { requireRole } from "../auth.js";
import { notificationsFor, markNotificationsRead } from "../store.js";

const router = Router();

router.get("/", requireRole("STUDENT", "STAFF", "ADMIN"), async (req, res) => {
  res.json(await notificationsFor(req.user.id));
});

router.put("/read-all", requireRole("STUDENT", "STAFF", "ADMIN"), async (req, res) => {
  await markNotificationsRead(req.user.id);
  res.json({ ok: true });
});

export default router;
