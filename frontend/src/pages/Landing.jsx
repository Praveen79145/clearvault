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
    "Workflow-based routing",
    "Each clearance automatically reaches the departments required for that request.",
  ],
  [
    "shield",
    "Secure digital approval",
    "Officer approvals are digitally signed and protected against tampering.",
  ],
  [
    "activity",
    "Live status tracking",
    "Students can see the approval status of every department in real time.",
  ],
  [
    "qr-code",
    "Certificate verification",
    "Generated certificates can be verified using a QR code.",
  ],
  [
    "lock",
    "Role-based access",
    "Each officer can access only the department and requests assigned to them.",
  ],
  [
    "file-text",
    "Complete audit trail",
    "Every approval, rejection and status change is recorded for verification.",
  ],
];

const HERO_FEATURES = [
  ["file-text", "Faster", "Clearances"],
  ["shield", "Secure &", "Tamper-Proof"],
  ["users", "All Departments", "in One Place"],
  ["leaf", "A Paperless,", "Greener Campus"],
];

const DEMO_STUDENTS = [
  ["Aarav Kumar · student", "r220101@rguktrkv.ac.in", "student123"],
  ["Bhavana Reddy · student", "r220102@rguktrkv.ac.in", "student123"],
  ["Chaitanya N · student", "r220103@rguktrkv.ac.in", "student123"],
  ["Divya Shetty · student", "r220104@rguktrkv.ac.in", "student123"],
  ["Eesha Patel · student", "r220105@rguktrkv.ac.in", "student123"],
  ["Farhan Mohammed · student", "r220106@rguktrkv.ac.in", "student123"],
  ["Gayatri Thampi · student", "r220107@rguktrkv.ac.in", "student123"],
  ["Harish Varma · student", "r220108@rguktrkv.ac.in", "student123"],
  ["Indra Kumar · student", "r220109@rguktrkv.ac.in", "student123"],
  ["Jaya Lal · student", "r220110@rguktrkv.ac.in", "student123"],
];

const DEMO_OFFICERS = [
  ["Finance Officer", "finance@campus.edu"],
  ["Library Officer", "library@campus.edu"],
  ["Hostel Warden", "hostel@campus.edu"],
  ["Sports Officer", "sports@campus.edu"],
  ["Physics Lab Officer", "physics@campus.edu"],
  ["Chemistry Lab Officer", "chemistry@campus.edu"],
  ["Dean", "dean@campus.edu"],
  ["Administrative Officer", "ao@campus.edu"],
  ["Director", "director@campus.edu"],
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-surface text-ink">
      {/* =========================================================
          HEADER
          EXACTLY ONE THEME TOGGLE + ONE HEADER SIGN-IN
      ========================================================= */}
      <header className="relative z-50 border-b border-line bg-surface/95 backdrop-blur-md">
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
      </header>

      {/* =========================================================
          HERO
      ========================================================= */}
      <section className="relative min-h-[calc(100svh-70px)] overflow-hidden">
        {/* Campus background */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url(/campus-bg.png)",
            backgroundSize: "cover",
            backgroundPosition: "center center",
            backgroundRepeat: "no-repeat",
          }}
          aria-hidden="true"
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
          <div className="pt-20 sm:pt-24 md:pt-28 max-w-[610px]">
            <p className="kicker">
              Office of the Registrar · RGUKT RK Valley
            </p>

            <h1 className="display mt-5 text-[44px] leading-[1.02] sm:text-[58px] md:text-[68px]">
              Clear your dues
              <br />
              without leaving
              <br />
              <em className="text-brand not-italic">
                your desk.
              </em>
            </h1>

            <p className="mt-6 max-w-[560px] text-[15px] sm:text-[16px] leading-relaxed text-muted">
              ClearVault replaces the paper no-dues process with one
              digital platform for Finance, Library, Hostel, Sports,
              Labs, Dean, AO and Director approvals.
            </p>

            {/* Hero buttons */}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/login"
                className="btn btn-brand !px-6 !py-3"
              >
                Sign in to the portal
                <Icon name="arrow-right" size={15} />
              </Link>

              <Link
                to="/verify/CV-26-R4J8KX"
                className="btn btn-outline !px-5 !py-3"
                style={{
                  background: "rgba(255,255,255,0.82)",
                  backdropFilter: "blur(5px)",
                }}
              >
                <Icon name="qr-code" size={15} />
                Verify a sample certificate
              </Link>
            </div>
          </div>

          {/* Hero features */}
          <div className="pb-10 sm:pb-12 md:pb-14 pt-14">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-7 max-w-[700px]">
              {HERO_FEATURES.map(([icon, l1, l2]) => (
                <div
                  key={`${icon}-${l1}`}
                  className="flex flex-col gap-2"
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
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          PROCESS
      ========================================================= */}
      <section className="border-b border-line bg-surface">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
          <p className="kicker">The process</p>

          <h2 className="display text-3xl sm:text-4xl mt-3">
            Four steps. Zero queues.
          </h2>

          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
            {STEPS.map((step) => (
              <div
                key={step.n}
                className="border-t-2 border-line-strong pt-4"
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
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          FEATURES
      ========================================================= */}
      <section className="border-b border-line bg-surface">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
          <p className="kicker">Capabilities</p>

          <h2 className="display text-3xl sm:text-4xl mt-3">
            Built for digital campus governance.
          </h2>

          <div className="mt-10 grid md:grid-cols-2 gap-x-10">
            {FEATURES.map(([icon, title, description]) => (
              <div
                key={title}
                className="flex gap-4 py-5 border-b border-line"
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
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          DEMO ACCOUNTS
      ========================================================= */}
      <section className="border-b border-line bg-surface">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
          <p className="kicker">Try it now</p>

          <h2 className="display text-3xl sm:text-4xl mt-3">
            Demo accounts
          </h2>

          <p className="text-sm text-muted mt-3 max-w-lg">
            The registry includes demo students, approval officers
            and an administrator for testing the complete workflow.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mt-8 items-start">
            {/* Students */}
            <div className="card overflow-hidden">
              <p className="kicker px-5 pt-4 pb-3">
                Students
              </p>

              <div className="border-t border-line divide-y divide-line">
                {DEMO_STUDENTS.map(([role, email, password]) => (
                  <div
                    key={email}
                    className="flex items-center gap-4 px-5 py-3.5"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[13.5px]">
                        {role}
                      </p>

                      <p className="font-mono text-[12px] text-muted">
                        {email} · {password}
                      </p>
                    </div>

                    <Link
                      to={`/login?email=${encodeURIComponent(
                        email
                      )}&pw=${password}`}
                      className="btn btn-outline btn-sm"
                    >
                      Continue
                      <Icon name="arrow-right" size={13} />
                    </Link>
                  </div>
                ))}

                {/* Admin */}
                <div className="flex items-center gap-4 px-5 py-3.5">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[13.5px]">
                      Administrator
                    </p>

                    <p className="font-mono text-[12px] text-muted">
                      admin@campus.edu · admin123
                    </p>
                  </div>

                  <Link
                    to={`/login?email=${encodeURIComponent(
                      "admin@campus.edu"
                    )}&pw=admin123`}
                    className="btn btn-outline btn-sm"
                  >
                    Continue
                    <Icon name="arrow-right" size={13} />
                  </Link>
                </div>
              </div>
            </div>

            {/* Officers */}
            <div className="card overflow-hidden">
              <p className="kicker px-5 pt-4 pb-3">
                Approval offices
              </p>

              <div className="border-t border-line divide-y divide-line">
                {DEMO_OFFICERS.map(([role, email]) => (
                  <div
                    key={email}
                    className="flex items-center gap-4 px-5 py-3.5"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[13.5px]">
                        {role}
                      </p>

                      <p className="font-mono text-[12px] text-muted">
                        {email}
                      </p>
                    </div>

                    <Link
                      to={`/login?email=${encodeURIComponent(
                        email
                      )}&pw=staff123`}
                      className="btn btn-outline btn-sm"
                    >
                      Continue
                      <Icon name="arrow-right" size={13} />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

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