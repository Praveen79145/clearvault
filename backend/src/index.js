import "./env.js"; // must load before anything reads process.env
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import googleRoutes from "./routes/google.js";
import requestRoutes from "./routes/requests.js";
import deptRoutes from "./routes/dept.js";
import notificationRoutes from "./routes/notifications.js";
import adminRoutes from "./routes/admin.js";
import verifyRoutes from "./routes/verify.js";
import paymentRoutes from "./routes/payments.js";

const app = express();
app.use(express.json());

const LOCAL_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"];
const EXTRA_ORIGINS = [process.env.FRONTEND_URL, process.env.CLIENT_URL].filter(Boolean).map((value) => value.replace(/\/$/, ""));
const ALLOWED_ORIGINS = [...new Set([...LOCAL_ORIGINS, ...EXTRA_ORIGINS])];
const corsOptions = {
  origin(origin, callback) {
    const normalizedOrigin = origin ? origin.replace(/\/$/, "") : "";
    const allowed = !origin || ALLOWED_ORIGINS.includes(normalizedOrigin);
    if (allowed) {
      if (origin) console.log(`[cors] allowed origin: ${origin}`);
      callback(null, origin || true);
      return;
    }
    console.warn(`[cors] blocked origin: ${origin}`);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use((req, _res, next) => {
  console.log(`[auth] ${req.method} ${req.path} origin=${req.headers.origin || "same-origin"}`);
  next();
});

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "clearvault-api" }));

app.use("/api/auth", authRoutes);
app.use("/api/auth/google", googleRoutes); // /api/auth/google · /api/auth/google/callback
app.use("/api", requestRoutes);          // /api/requests  /api/clearances/:id/reapply
app.use("/api/dept", deptRoutes);        // /api/dept/clearances
app.use("/api/payments", paymentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/verify", verifyRoutes);    // public certificate verification

app.use((_req, res) => res.status(404).json({ error: "Not found" }));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("[api]", err.message);
  res.status(err.status || 500).json({ error: err.status ? err.message : "Internal server error" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => console.log(`[api] ClearVault backend → http://0.0.0.0:${PORT}`));
