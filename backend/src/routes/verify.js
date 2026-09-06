import { Router } from "express";
import { verifyCertificate } from "../store.js";

const router = Router();

/** PUBLIC endpoint — this is what the QR code on certificates points to */
router.get("/:code", async (req, res) => {
  const data = await verifyCertificate(req.params.code);
  if (!data) return res.status(404).json({ valid: false });
  res.json({ valid: true, ...data });
});

export default router;
