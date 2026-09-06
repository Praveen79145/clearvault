import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import Logo from "../components/Logo.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";
import Icon from "../icons.jsx";

const STEPS = [
  {
    n: "01",
    t: "Raise one request",
    d: "Log in with your campus ID and choose the clearance you need.",
  },
  {
    n: "02",
    t: "Offices review",
    d: "Your request is automatically routed to the required departments.",
  },
  {
    n: "03",
    t: "Digital approval",
    d: "Officers verify your dues and digitally approve or reject the request.",
  },
  {
    n: "04",
    t: "Certificate issued",
    d: "Once every required approval is complete, your certificate is generated.",
  },
];

const FEATURES = [
  [
    "zap",
    "One request, one track",
    "Students submit their clearance from one place and follow the status of each department.",
  ],
  [
    "shield",
    "Review and approve securely",
    "Authorities can review requests, approve decisions, and manage follow-ups efficiently.",
  ],
  [
    "activity",
    "Live status tracking",
    "Students and officers can see where each request stands at every stage of the process.",
  ],
  [
    "qr-code",
    "Digitally issued certificates",
    "Certificates are generated and verified with a secure digital record.",
  ],
  [
    "lock",
    "Transparent accountability",
    "Every approval and decision is recorded clearly for review and accountability.",
  ],
  [
    "file-text",
    "Clear institutional records",
    "Approvals are documented in a complete, traceable record that supports university oversight.",
  ],
];

const HERO_FEATURES = [
  ["file-text", "Faster", "Clearances"],
  ["shield", "Secure &", "Tamper-Proof"],
  ["users", "All Departments", "in One Place"],
  ["leaf", "A Paperless,", "Greener Campus"],
];

export default function Landing() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="min-h-screen bg-surface text-ink">
      {/* =========================================================
          HEADER
          EXACTLY ONE THEME TOGGLE + ONE HEADER SIGN-IN
      ========================================================= */}
      <motion.header
        className="relative z-50 border-b border-line bg-surface/95 backdrop-blur-md"
        initial={reduceMotion ? false : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: "easeOut" }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-[70px] flex items-center justify-between">
          {/* Logo */}
          <Logo sub="Registrar e-Clearance" />

          {/* Header controls - intentionally rendered only once */}
          <div className="flex items-center gap-2">
            <ThemeToggle />

            <Link
              to="/login"
              className="btn btn-primary btn-sm flex items-center gap-2"
            >
              <span>Sign in</span>
              <Icon name="arrow-right" size={14} />
            </Link>
          </div>
        </div>
      </motion.header>

      {/* =========================================================
          HERO
      ========================================================= */}
      <motion.section className="relative min-h-[calc(100svh-70px)] overflow-hidden border-0" initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, ease: "easeOut" }}>
        {/* Campus background */}
        <motion.div
          className="absolute inset-y-0"
          style={{
            left: "max(0px, calc((100vw - 72rem) / 2))",
            right: "max(0px, calc((100vw - 72rem) / 2))",
            backgroundImage: "url(/campus-bg.png)",
            backgroundSize: "cover",
            backgroundPosition: "center center",
            backgroundRepeat: "no-repeat",
          }}
          aria-hidden="true"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.75, ease: "easeOut" }}
        />

        {/* Left readability overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(248,250,247,0.98) 0%, rgba(248,250,247,0.94) 25%, rgba(248,250,247,0.78) 42%, rgba(248,250,247,0.35) 58%, rgba(248,250,247,0.05) 78%, transparent 100%)",
          }}
          aria-hidden="true"
        />

        {/* Bottom fade */}
        <div
          className="absolute inset-x-0 bottom-0 h-32"
          style={{
            background:
              "linear-gradient(to top, rgba(248,250,247,0.75), transparent)",
          }}
          aria-hidden="true"
        />

        {/* Hero content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 min-h-[calc(100svh-70px)] flex flex-col justify-between">
          {/* Main hero */}
          <motion.div className="pt-20 sm:pt-24 md:pt-28 max-w-[610px]" initial={reduceMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}>
            <p className="kicker">
              Office of the Registrar · RGUKT RK Valley
            </p>

            <h1 className="display mt-5 text-[44px] leading-[1.02] sm:text-[58px] md:text-[68px]">
              Digital clearance for students.
              <span className="block">Simpler administration for</span>
              <span className="block text-brand not-italic">
                everyone.
              </span>
            </h1>

            <p className="mt-6 max-w-[560px] text-[15px] sm:text-[16px] leading-relaxed text-muted">
              ClearVault brings student no-dues clearance into one secure
              platform, connecting students with the departments and university
              authorities responsible for their approval.
            </p>

            {/* Hero buttons */}
            <div className="mt-8 flex flex-wrap gap-3">
              <motion.div whileHover={reduceMotion ? undefined : { scale: 1.02 }} whileTap={reduceMotion ? undefined : { scale: 0.98 }}>
                <Link to="/login" className="btn btn-brand !px-6 !py-3">
                  Sign in to the portal
                  <Icon name="arrow-right" size={15} />
                </Link>
              </motion.div>

              <motion.div whileHover={reduceMotion ? undefined : { scale: 1.02 }} whileTap={reduceMotion ? undefined : { scale: 0.98 }}>
                <Link to="/verify/CV-26-R4J8KX" className="btn btn-outline !px-5 !py-3" style={{
                  background: "rgba(255,255,255,0.82)",
                  backdropFilter: "blur(5px)",
                }}>
                  <Icon name="qr-code" size={15} />
                  Verify a sample certificate
                </Link>
              </motion.div>
            </div>
          </motion.div>

          {/* Hero features */}
          <div className="pb-10 sm:pb-12 md:pb-14 pt-14">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-7 max-w-[700px]">
              {HERO_FEATURES.map(([icon, l1, l2], index) => (
                <motion.div
                  key={`${icon}-${l1}`}
                  className="flex flex-col gap-2"
                  initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.38, delay: index * 0.07, ease: "easeOut" }}
                >
                  <span className="text-brand">
                    <Icon
                      name={icon}
                      size={21}
                      strokeWidth={1.7}
                    />
                  </span>

                  <p className="text-[13px] leading-snug font-semibold text-ink">
                    {l1}
                    <br />
                    {l2}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* =========================================================
          PROCESS
      ========================================================= */}
      <motion.section className="border-b border-line bg-surface" initial={reduceMotion ? false : { opacity: 0, y: 14 }} whileInView={reduceMotion ? {} : { opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.15 }} transition={{ duration: 0.35, ease: "easeOut" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
          <p className="kicker">The process</p>

          <h2 className="display text-3xl sm:text-4xl mt-3">
            One process. Every department. No queues.
          </h2>

          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
            {STEPS.map((step, index) => (
              <motion.div
                key={step.n}
                className="border-t-2 border-line-strong pt-4"
                initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                whileInView={reduceMotion ? {} : { opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.2 }}
                transition={{ duration: 0.42, delay: index * 0.06, ease: "easeOut" }}
              >
                <p className="font-mono text-[11px] font-semibold text-brand">
                  {step.n}
                </p>

                <p className="display text-lg mt-2 font-semibold">
                  {step.t}
                </p>

                <p className="text-[13px] leading-relaxed text-muted mt-2">
                  {step.d}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* =========================================================
          FEATURES
      ========================================================= */}
      <motion.section className="border-b border-line bg-surface" initial={reduceMotion ? false : { opacity: 0, y: 14 }} whileInView={reduceMotion ? {} : { opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.15 }} transition={{ duration: 0.35, ease: "easeOut" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
          <p className="kicker">Capabilities</p>

          <h2 className="display text-3xl sm:text-4xl mt-3">
            Built for students and university administration.
          </h2>

          <div className="mt-10 grid md:grid-cols-2 gap-x-10">
            {FEATURES.map(([icon, title, description], index) => (
              <motion.div
                key={title}
                className="flex gap-4 py-5 border-b border-line"
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                whileInView={reduceMotion ? {} : { opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.2 }}
                transition={{ duration: 0.42, delay: index * 0.05, ease: "easeOut" }}
              >
                <span className="mt-0.5 w-9 h-9 shrink-0 border border-line-strong rounded-md grid place-items-center text-brand">
                  <Icon name={icon} size={17} />
                </span>

                <div>
                  <p className="font-semibold text-[14.5px]">
                    {title}
                  </p>

                  <p className="text-[13px] leading-relaxed text-muted mt-1">
                    {description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* =========================================================
          FOOTER
      ========================================================= */}
      <footer>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <Logo size={16} />

          <p className="font-mono text-[11px] text-muted">
            Automated No-Dues &amp; Digital Clearance · HMAC-SHA256 ·
            QR-verifiable
          </p>
        </div>
      </footer>
    </div>
  );
}