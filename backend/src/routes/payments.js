import crypto from "crypto";
import { Router } from "express";
import { requireRole } from "../auth.js";
import { getStudentDues, createPaymentRecord, findPaymentByOrder, markPaymentPaid } from "../store.js";
import { deptById, normDept } from "../departments.js";

const router = Router();
const keyId = () => process.env.RAZORPAY_KEY_ID;
const keySecret = () => process.env.RAZORPAY_KEY_SECRET;

const configured = () => {
  if (!keyId() || !keySecret()) throw Object.assign(new Error("Payments are not configured. Contact the administrator."), { status: 503 });
};
const razorpay = async (path, options = {}) => {
  configured();
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...options,
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId()}:${keySecret()}`).toString("base64")}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(body?.error?.description || "Razorpay could not process this request."), { status: 502 });
  return body;
};

router.post("/create-order", requireRole("STUDENT"), async (req, res, next) => {
  try {
    const dept = normDept(String(req.body?.department || "").toUpperCase());
    const department = deptById(dept);
    if (!department?.id || department.id !== dept) return res.status(400).json({ error: "Unknown department." });
    const record = await getStudentDues(req.user.id, dept);
    if (!record || record.dues.status !== "DUES_FOUND" || record.dues.total <= 0)
      return res.status(400).json({ error: "There are no payable dues for this department." });

    const amount = Math.round(Number(record.dues.total) * 100); // Razorpay uses paise
    const order = await razorpay("/orders", {
      method: "POST",
      body: JSON.stringify({ amount, currency: "INR", receipt: `cv_${Date.now().toString(36)}_${dept.toLowerCase()}`, notes: { student_id: req.user.id, department: dept } }),
    });
    await createPaymentRecord({
      studentId: req.user.id, dept, amount: record.dues.total,
      duesRecordId: record.clearance?.id || `student:${req.user.id}:${dept}`,
      razorpayOrderId: order.id,
    });
    res.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: keyId(), department: { id: dept, name: department.name, short: department.short } });
  } catch (error) { next(error); }
});

router.post("/verify", requireRole("STUDENT"), async (req, res, next) => {
  try {
    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body || {};
    if (![orderId, paymentId, signature].every((v) => typeof v === "string" && v)) return res.status(400).json({ error: "Incomplete payment verification data." });
    configured();
    const payment = await findPaymentByOrder(orderId);
    if (!payment || payment.studentId !== req.user.id) return res.status(404).json({ error: "Payment order not found." });
    if (payment.paymentStatus === "PAID") return res.status(409).json({ error: "This payment has already been processed." });
    const expected = crypto.createHmac("sha256", keySecret()).update(`${orderId}|${paymentId}`).digest("hex");
    if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected)))
      return res.status(400).json({ error: "Payment signature verification failed." });

    // Confirm Razorpay itself associates this payment with our order and amount.
    const remote = await razorpay(`/payments/${encodeURIComponent(paymentId)}`);
    if (remote.order_id !== orderId || Number(remote.amount) !== Math.round(payment.amount * 100) || !["authorized", "captured"].includes(remote.status))
      return res.status(400).json({ error: "Payment details could not be validated." });
    const saved = await markPaymentPaid({ razorpayOrderId: orderId, razorpayPaymentId: paymentId });
    res.json({ ok: true, payment: { id: saved.id, status: saved.paymentStatus, department: saved.dept, paidAt: saved.paidAt } });
  } catch (error) { next(error); }
});

export default router;
