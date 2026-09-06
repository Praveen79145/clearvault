import { Link } from "react-router-dom";
import Logo from "../components/Logo.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";
import Icon from "../icons.jsx";

const STEPS = [
  { n: "01", t: "Raise one request", d: "Log in with your campus ID and pick the clearance you need — semester sign-off, hostel vacating, transcript or graduation." },
  { n: "02", t: "Offices review in parallel", d: "The offices your request requires — anywhere from one to all nine — receive your file at once. Nobody waits on anyone." },
  { n: "03", t: "Signed, not stamped", d: "Every officer sign-off produces an HMAC signature bound to your roll number and timestamp. Rejections arrive with the officer's exact comment." },
  { n: "04", t: "Certificate issues itself", d: "Only when every mandatory approval is cleared does the registry mint your QR-verifiable No-Dues Certificate — automatically." },
];

const FEATURES = [
  ["zap", "Workflow-based routing", "Each request type carries its own mandatory offices — semester needs only Finance, graduation needs all nine."],
  ["shield", "Cryptographic sign-off", "HMAC-SHA256 signatures replace ink stamps. Altered records stop matching their signature."],
  ["activity", "Live status tracker", "Students see every office's decision the moment it happens — with a live audit trail behind it."],
  ["qr-code", "Public verification", "Anyone can scan a certificate's QR and confirm authenticity against the registry."],
  ["lock", "Role-locked consoles", "Officers see only their own office's queue and can never touch another office's file. Enforced server-side."],
  ["file-text", "Full audit trail", "Every decision logs actor, office, previous and new status, comment and timestamp — nothing happens silently."],
];

const DEMO_STUDENTS = [
  ["Ananya Verma · student", "ananya@campus.edu", "student123"],
  ["Rohan Mehta · certificate ready", "rohan@campus.edu", "student123"],
  ["Karan Patel · 3/9 cleared", "karan@campus.edu", "student123"],
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
    <div className="min-h-screen">
      {/* Masthead */}
      <header className="border-b border-line">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Logo sub="Registrar e-Clearance" />
          <nav className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/login" className="btn btn-primary btn-sm">
              Sign in <Icon name="arrow-right" size={14} />
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-line">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <p className="kicker">Office of the Registrar · Digital Campus Governance</p>
          <h1 className="display mt-5 text-[42px] leading-[1.04] sm:text-6xl md:text-7xl">
            Clear your dues<br />without leaving <em className="text-brand not-italic">your desk.</em>
          </h1>
          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-muted">
            ClearVault replaces the paper no-dues run — Finance, Library, Hostel, Sports, the labs,
            the Dean, the AO and the Director — with one digital file, parallel officer approvals,
            and a cryptographically verifiable certificate.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/login" className="btn btn-primary">Sign in to the portal <Icon name="arrow-right" size={15} /></Link>
            <Link to="/verify/CV-26-R4J8KX" className="btn btn-outline">
              <Icon name="qr-code" size={15} /> Verify a sample certificate
            </Link>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="border-b border-line">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
          <p className="kicker">The process</p>
          <h2 className="display text-3xl sm:text-4xl mt-3">Four steps. Zero queues.</h2>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
            {STEPS.map((s) => (
              <div key={s.n} className="border-t-2 border-line-strong pt-4">
                <p className="font-mono text-[11px] font-semibold text-brand">{s.n}</p>
                <p className="display text-lg mt-1.5 font-semibold">{s.t}</p>
                <p className="text-[13px] leading-relaxed text-muted mt-2">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features as ruled rows */}
      <section className="border-b border-line">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
          <p className="kicker">Capabilities</p>
          <h2 className="display text-3xl sm:text-4xl mt-3">Built like infrastructure, <br className="hidden sm:block" />not paperwork.</h2>
          <div className="mt-10 grid md:grid-cols-2 gap-x-10">
            {FEATURES.map(([icon, t, d]) => (
              <div key={t} className="flex gap-4 py-5 border-b border-line">
                <span className="mt-0.5 w-9 h-9 shrink-0 border border-line-strong rounded-md grid place-items-center text-brand">
                  <Icon name={icon} size={17} />
                </span>
                <div>
                  <p className="font-semibold text-[14.5px]">{t}</p>
                  <p className="text-[13px] leading-relaxed text-muted mt-1">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo accounts */}
      <section className="border-b border-line">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
          <p className="kicker">Try it now</p>
          <h2 className="display text-3xl sm:text-4xl mt-3">Demo accounts</h2>
          <p className="text-sm text-muted mt-3 max-w-lg">
            The registry is pre-seeded with students, nine approval offices and one administrator.
            Officer accounts are all <span className="font-mono text-[12.5px]">staff123</span> — click any row to continue as that user.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mt-8 items-start">
            <div className="card overflow-hidden">
              <p className="kicker px-5 pt-4 pb-3">Students</p>
              <div className="border-t border-line divide-y divide-line">
                {DEMO_STUDENTS.map(([role, email, pw]) => (
                  <div key={email} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[13.5px]">{role}</p>
                      <p className="font-mono text-[12px] text-muted">{email} · {pw}</p>
                    </div>
                    <Link to={`/login?email=${encodeURIComponent(email)}&pw=${pw}`} className="btn btn-outline btn-sm">
                      Continue <Icon name="arrow-right" size={13} />
                    </Link>
                  </div>
                ))}
                <div className="flex items-center gap-4 px-5 py-3.5">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[13.5px]">Administrator</p>
                    <p className="font-mono text-[12px] text-muted">admin@campus.edu · admin123</p>
                  </div>
                  <Link to={`/login?email=${encodeURIComponent("admin@campus.edu")}&pw=admin123`} className="btn btn-outline btn-sm">
                    Continue <Icon name="arrow-right" size={13} />
                  </Link>
                </div>
              </div>
            </div>

            <div className="card overflow-hidden">
              <p className="kicker px-5 pt-4 pb-3">Approval offices</p>
              <div className="border-t border-line divide-y divide-line">
                {DEMO_OFFICERS.map(([role, email]) => (
                  <div key={email} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[13.5px]">{role}</p>
                      <p className="font-mono text-[12px] text-muted">{email}</p>
                    </div>
                    <Link to={`/login?email=${encodeURIComponent(email)}&pw=staff123`} className="btn btn-outline btn-sm">
                      Continue <Icon name="arrow-right" size={13} />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <Logo size={16} />
          <p className="font-mono text-[11px] text-muted">
            Automated No-Dues &amp; Digital Clearance · HMAC-SHA256 · QR-verifiable
          </p>
        </div>
      </footer>
    </div>
  );
}
