import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, fullDate } from "../api.js";
import Icon from "../icons.jsx";
import Shell from "../components/Shell.jsx";
import CancelModal from "../components/CancelModal.jsx";

const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const OV = {
  IN_PROGRESS: ["badge-wait", "In progress"],
  ACTION_REQUIRED: ["badge-bad", "Action required"],
  COMPLETED: ["badge-good", "Completed"],
  CANCELLED: ["badge-bad", "Cancelled"],
};
const CANCELLABLE = (overall) => overall === "IN_PROGRESS" || overall === "ACTION_REQUIRED";

function CardSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-8">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-48 rounded-[10px] border border-line bg-surface animate-pulse" />
      ))}
    </div>
  );
}

/** Compact strip of the offices a request-type is routed to (data-driven) */
function OfficesStrip({ requires }) {
  const shown = requires.slice(0, 4);
  const rest = requires.length - shown.length;
  return (
    <div className="mt-3 flex items-center gap-1.5" title={requires.map((d) => d.name).join(", ")}>
      {shown.map((d) => (
        <span key={d.id} className="w-6 h-6 border border-line rounded grid place-items-center text-muted" title={d.name}>
          <Icon name={d.icon} size={11} />
        </span>
      ))}
      {rest > 0 && <span className="font-mono text-[10px] font-semibold text-muted pl-0.5">+{rest}</span>}
      <span className="font-mono text-[10px] text-muted ml-auto pl-2">
        {requires.length} {requires.length === 1 ? "office" : "offices"}
      </span>
    </div>
  );
}

const line = (dues, label) => (dues?.lines || []).find((item) => item.label === label);
const lineValue = (dues, label) => {
  const item = line(dues, label);
  if (item?.value !== undefined) return String(item.value) === "0" ? null : item.value;
  return item?.amount > 0 ? inr(item.amount) : null;
};

function dueRows(department) {
  const { id, dues } = department;
  if (id === "FINANCE") return [
    ["Tuition fee", lineValue(dues, "Tuition fee")],
    ["Scholarship dues", lineValue(dues, "Scholarship due")],
  ];
  if (id === "LIBRARY") return [
    // Derive books pending count from the canonical `books` array when present.
    ["Books pending", department?.books ? (() => { const c = (department.books || []).filter((b) => !b.status || b.status === "PENDING").length; return c === 0 ? null : String(c); })() : lineValue(dues, "Books pending")],
    ["Library fine", lineValue(dues, "Library fine")],
  ];
  if (id === "HOSTEL") return [
    ["Room / hostel dues", lineValue(dues, "Hostel dues")],
    ["Mess dues", lineValue(dues, "Mess dues")],
    ["Paybill / assets", lineValue(dues, "Paybill")],
  ];
  return (dues?.lines || []).map((item) => [item.label, item.value ?? (item.amount > 0 ? inr(item.amount) : null)]);
}

const loadRazorpay = () => new Promise((resolve, reject) => {
  if (window.Razorpay) return resolve();
  const script = document.createElement("script");
  script.src = "https://checkout.razorpay.com/v1/checkout.js";
  script.onload = () => resolve();
  script.onerror = () => reject(new Error("Could not load secure payment checkout. Please try again."));
  document.head.appendChild(script);
});

function DuesDetails({ department, student, onClose, onPaid }) {
  const outstanding = department.clearanceStatus !== "APPROVED" && department.dues.status === "DUES_FOUND";
  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [showBooks, setShowBooks] = useState(false);
  const pay = async () => {
    setPaying(true); setPaymentError("");
    try {
      const order = await api("/api/payments/create-order", { method: "POST", body: { department: department.id } });
      await loadRazorpay();
      const checkout = new window.Razorpay({
        key: order.keyId, amount: order.amount, currency: order.currency, order_id: order.orderId,
        name: "ClearVault", description: `${order.department.short} Department dues`,
        prefill: { name: student.name || "", email: student.email || "" }, theme: { color: "#167c6b" },
        handler: async (response) => {
          try {
            await api("/api/payments/verify", { method: "POST", body: response });
            await onPaid(); onClose();
          } catch (error) { setPaymentError(error.message); }
          finally { setPaying(false); }
        },
        modal: { ondismiss: () => { setPaying(false); setPaymentError("Payment was not completed. Your dues are still pending."); } },
      });
      checkout.on("payment.failed", () => { setPaying(false); setPaymentError("Payment was not completed. Your dues are still pending."); });
      checkout.open();
    } catch (error) { setPaymentError(error.message); setPaying(false); }
  };
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/55" onClick={onClose}>
      <div className="card w-full max-w-md p-0 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-line flex items-center justify-between">
          <div><p className="display text-xl font-semibold">{department.short} dues</p><p className="kicker !text-[9px] mt-1">Current department record</p></div>
          <button onClick={onClose} aria-label="Close dues details" className="text-muted hover:text-ink"><Icon name="x" size={17} /></button>
        </div>
        <div className="p-5">
          <div className="divide-y divide-line border border-line rounded-lg overflow-hidden">
            {dueRows(department).map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 px-4 py-3 text-[13px]">
                {/* Make Books pending row clickable to show expanded book details */}
                {label === "Books pending" ? (
                  <button onClick={() => setShowBooks((s) => !s)} className="w-full text-left flex items-center justify-between gap-4">
                    <span className="text-muted">{label}</span>
                    <span className={value ? "font-mono font-semibold text-bad" : "text-good font-medium"}>{value || "0"}</span>
                  </button>
                ) : (
                  <>
                    <span className="text-muted">{label}</span>
                    <span className={value ? "font-mono font-semibold text-bad" : "text-good font-medium"}>{value || "Cleared"}</span>
                  </>
                )}
              </div>
            ))}

            {/* If the books row is toggled, render per-book details from dummy data (or real source) */}
            {showBooks && (
              <div className="px-4 py-3 bg-paper text-[13px]">
                <h4 className="font-semibold mb-2">Pending books</h4>
                {/* derive rollNo */}
                {(() => {
                  const books = department.books || [];
                  const pendingBooks = (books || []).filter((b) => !b.status || b.status === "PENDING");
                  const booksAmount = pendingBooks.reduce((s, b) => s + Number(b.amount || 0), 0);
                  const fineLine = line( department.dues, "Library fine");
                  const fine = Number(fineLine?.amount || 0);
                  return (
                    <div>
                      {pendingBooks.length === 0 ? (
                        <p className="text-[13px] text-muted">No pending books</p>
                      ) : (
                        <div className="space-y-3">
                          {pendingBooks.map((b, i) => (
                            <div key={i} className="border border-line rounded p-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-semibold">{b.name}</div>
                                  <div className="text-[13px] text-muted">Book ID: {b.id}</div>
                                </div>
                                <div className="font-mono text-[14px] font-semibold">{inr(b.amount)}</div>
                              </div>
                              <div className="mt-2 text-[13px] text-muted flex gap-6">
                                <div>Issue date: {b.issueDate}</div>
                                <div>Due date: {b.dueDate}</div>
                              </div>
                            </div>
                          ))}

                          <div className="mt-3 flex justify-between font-semibold">
                            <div>Books amount</div>
                            <div className="font-mono">{inr(booksAmount)}</div>
                          </div>
                          <div className="flex justify-between text-[13px] mt-1">
                            <div>Library fine</div>
                            <div className="font-mono">{inr(fine)}</div>
                          </div>
                          <div className="mt-3 border-t border-line pt-3 flex justify-between text-[15px] font-semibold">
                            <div>Total library dues</div>
                            <div className="font-mono">{inr(booksAmount + fine)}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="flex justify-between gap-4 px-4 py-3 bg-paper text-[13px] font-semibold">
              <span>Total</span><span className={outstanding ? "font-mono text-bad" : "text-good"}>{outstanding ? inr(department.dues.total) : "No dues"}</span>
            </div>
          </div>
          {department.officerDescription && (
            <p className="mt-4 border border-line rounded-lg bg-paper px-4 py-3 text-[12.5px] text-muted"><b className="text-ink">Officer note:</b> {department.officerDescription}</p>
          )}
          <p className={`mt-4 text-[13px] font-semibold ${outstanding ? "text-bad" : "text-good"}`}>
            Status: {outstanding ? "Pending" : "Cleared"}
          </p>
          {outstanding && (
            <button onClick={pay} disabled={paying} className="btn btn-brand w-full mt-5 justify-center">
              {paying ? "Preparing secure payment…" : <>Pay {inr(department.dues.total)} <Icon name="arrow-right" size={14} /></>}
            </button>
          )}
          {paymentError && <p className="mt-3 text-[12.5px] text-bad flex gap-2"><Icon name="alert" size={14} />{paymentError}</p>}
        </div>
      </div>
    </div>
  );
}

function PendingDues({ departments, onDetails }) {
  const pending = departments.filter((d) => d.clearanceStatus !== "APPROVED" && d.dues.status === "DUES_FOUND");
  const total = pending.reduce((sum, d) => sum + Number(d.dues.total || 0), 0);
  return (
    <section className="mt-7">
      <div className="flex flex-wrap gap-3 items-end justify-between">
        <div><h2 className="display text-2xl font-semibold">Your pending dues</h2><p className="text-[13px] text-muted mt-1">See what is outstanding across each department before starting a clearance request.</p></div>
        <p className="font-mono text-[10px] text-muted">LIVE STUDENT LEDGER</p>
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-4">
        {departments.map((d) => {
          const outstanding = d.clearanceStatus !== "APPROVED" && d.dues.status === "DUES_FOUND";
          const rows = dueRows(d).filter(([, value]) => value);
          return <div key={d.id} className="card p-4 shadow-sm">
            <div className="flex justify-between items-start gap-2"><div className="flex items-center gap-2"><span className="w-7 h-7 rounded border border-line grid place-items-center text-brand"><Icon name={d.icon} size={13} /></span><p className="font-semibold text-[13px]">{d.short}</p></div>
              {outstanding ? <span className="badge badge-bad">Pending</span> : <span className="badge badge-good"><Icon name="check" size={11} /> Cleared</span>}
            </div>
            {outstanding ? <div className="mt-3 space-y-1.5">{rows.map(([label, value]) => <p key={label} className="flex justify-between gap-2 text-[11.5px] text-muted"><span>{label}</span><b className="font-mono text-bad">{value}</b></p>)}</div> : <p className="mt-4 text-[12px] text-good flex gap-1.5 items-center"><Icon name="check" size={12} /> No dues</p>}
            {outstanding && <p className="font-mono text-[12px] font-semibold text-bad mt-3 pt-2.5 border-t border-line">Total {inr(d.dues.total)}</p>}
            <button onClick={() => onDetails(d)} className="mt-3 text-[12px] font-semibold text-brand inline-flex items-center gap-1 hover:underline">View details <Icon name="arrow-right" size={12} /></button>
          </div>;
        })}
      </div>
      <p className="mt-3 text-[12.5px] text-muted"><b className={pending.length ? "text-ink" : "text-good"}>{pending.length} department{pending.length === 1 ? " has" : "s have"} pending dues</b>{pending.length ? <> · <span className="font-mono font-semibold text-bad">{inr(total)} total outstanding</span></> : " · all shown departments are clear"}</p>
    </section>
  );
}

export default function Student() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [types, setTypes] = useState(null);      // null = loading
  const [requests, setRequests] = useState(null);
  const [dues, setDues] = useState(null);
  const [details, setDetails] = useState(null);
  const [loadErr, setLoadErr] = useState("");
  const [cancelTarget, setCancelTarget] = useState(null); // { id, purpose }
  const poll = useRef(false);

  const load = useCallback(async () => {
    const [t, l, d] = await Promise.all([api("/api/request-types"), api("/api/requests/list"), api("/api/student/dues")]);
    setTypes(t.types);
    setRequests(l.requests);
    setDues(d.departments);
    setLoadErr("");
  }, []);

  useEffect(() => {
    api("/api/auth/me")
      .then((d) => {
        if (d.user.role !== "STUDENT") return navigate("/login");
        setUser(d.user);
        load().catch(() => setLoadErr("Couldn't load the request catalog. Check your connection and retry."));
      })
      .catch(() => navigate("/login"));
    if (!poll.current) {
      poll.current = true;
      const t = setInterval(() => load().catch(() => {}), 8000);
      return () => clearInterval(t);
    }
  }, [navigate, load]);

  if (!user) return null;

  // Latest request per type (list comes newest-first) — cancelled filings are history,
  // never the "active" one a card continues to.
  const latestByType = {};
  (requests || []).forEach((r) => { if (!latestByType[r.type] && r.overall !== "CANCELLED") latestByType[r.type] = r; });
  const titleFor = (r) => (types || []).find((t) => t.id === r.type)?.title || r.purpose;

  return (
    <Shell user={user} roleLabel={user.rollNo || "Student"}>
      {/* ── Student introduction ───────────────────────────────── */}
      <div className="pb-6 border-b border-line">
        <p className="kicker">Student services</p>
        <h1 className="display text-3xl sm:text-4xl mt-2 font-semibold">Clearances &amp; campus services</h1>
        <p className="text-[14px] text-muted mt-2 max-w-xl leading-relaxed">
          Review your department records first, then select the clearance service you need.
        </p>
      </div>

      {loadErr && (
        <div className="mt-6 border border-bad/40 bg-bad/5 rounded-[10px] p-4 text-[13px] font-medium text-bad flex items-center gap-2.5">
          <Icon name="alert" size={16} /> {loadErr}
        </div>
      )}

      {dues === null && !loadErr && <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-7">{[0, 1, 2, 3].map((i) => <div key={i} className="h-36 rounded-[10px] border border-line bg-surface animate-pulse" />)}</div>}
      {dues && <PendingDues departments={dues} onDetails={setDetails} />}

      {/* ── Request selection ─────────────────────────────────── */}
      <div className="mt-10 pt-8 border-t border-line">
        <p className="kicker">Student services</p>
        <h2 className="display text-3xl sm:text-4xl mt-2 font-semibold">Choose a request</h2>
        <p className="text-[14px] text-muted mt-2 max-w-xl leading-relaxed">
          Every request states exactly which offices must clear it — from a single desk to all nine.
          Each office reviews your file in parallel and signs with a cryptographic signature.
        </p>
      </div>

      {types === null && !loadErr && <CardSkeleton />}

      {types && types.length === 0 && (
        <div className="card mt-6 p-12 text-center">
          <Icon name="inbox" size={26} className="mx-auto text-muted" />
          <p className="font-semibold mt-3">No requests are currently available.</p>
          <p className="text-[13px] text-muted mt-1">Please check again later or contact the registrar's office.</p>
        </div>
      )}

      {types && types.length > 0 && (
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
          {types.map((t, i) => {
            const existing = latestByType[t.id];
            return (
              <Link key={t.id} to={`/student/request/${t.id}`} className="req-card group">
                <div className="flex items-center justify-between">
                  <span className="w-10 h-10 border border-line-strong rounded-md grid place-items-center text-brand">
                    <Icon name={t.icon} size={18} />
                  </span>
                  {existing ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="font-mono text-[10px] font-semibold text-muted tabular-nums">
                        {existing.cleared}/{existing.total} cleared
                      </span>
                      <span className={`badge ${OV[existing.overall][0]}`}>{OV[existing.overall][1]}</span>
                    </span>
                  ) : (
                    <span className="font-mono text-[10px] font-semibold text-muted">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  )}
                </div>
                <h3 className="display text-xl mt-4 font-semibold leading-snug">{t.title}</h3>
                <p className="text-[13px] text-muted mt-1.5 leading-relaxed flex-1">{t.blurb}</p>
                {t.requires && <OfficesStrip requires={t.requires} />}
                <p className="mt-3 pt-3 border-t border-line text-[13px] font-semibold inline-flex items-center gap-1.5">
                  {existing ? "Continue request" : "Start request"}
                  <Icon name="arrow-right" size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </p>
              </Link>
            );
          })}
        </div>
      )}

      {/* ── Existing requests ─────────────────────────────────── */}
      <div className="mt-12">
        <div className="flex items-baseline justify-between pb-3 border-b border-line">
          <h2 className="display text-2xl font-semibold">Your requests</h2>
          {requests && <p className="kicker !text-[9.5px]">{requests.length} on record</p>}
        </div>

        {requests !== null && requests.length === 0 && (
          <p className="text-[13.5px] text-muted py-6">
            You haven't filed any requests yet. Pick a card above to begin.
          </p>
        )}

        {requests && requests.length > 0 && (
          <div className="card mt-5 overflow-hidden">
            <div className="divide-y divide-line">
              {requests.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-4">
                  <Link to={`/student/request/${r.type}`}
                    className="flex flex-wrap items-center gap-x-5 gap-y-2 flex-1 min-w-[260px] hover:opacity-80 transition">
                    <div className="min-w-[190px]">
                      <p className="font-semibold text-[14px]">{titleFor(r)}</p>
                      <p className="font-mono text-[11px] text-muted mt-0.5">#{r.id.slice(-8).toUpperCase()}</p>
                      {r.overall === "CANCELLED" && r.cancellationReason && (
                        <p className="text-[11.5px] text-muted mt-1 italic">Reason: {r.cancellationReason}</p>
                      )}
                    </div>
                    <p className="flex-1 text-[12.5px] text-muted">Filed {fullDate(r.createdAt)}</p>
                    <span className="font-mono text-[10.5px] font-semibold text-muted tabular-nums border border-line rounded px-2 py-0.5">
                      {r.cleared}/{r.total} offices cleared
                    </span>
                  </Link>
                  <span className="inline-flex items-center gap-3">
                    <span className={`badge ${OV[r.overall][0]}`}>{OV[r.overall][1]}</span>
                    {CANCELLABLE(r.overall) && (
                      <button
                        onClick={() => setCancelTarget({ id: r.id, purpose: titleFor(r) })}
                        className="btn btn-bad-outline btn-sm">
                        <Icon name="x" size={12} /> Cancel
                      </button>
                    )}
                    <Link to={`/student/request/${r.type}`} aria-label="View request">
                      <Icon name="arrow-right" size={15} className="text-muted hover:text-ink transition" />
                    </Link>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {cancelTarget && (
        <CancelModal request={cancelTarget} onClose={() => setCancelTarget(null)} onDone={() => { setCancelTarget(null); load(); }} />
      )}
      {details && <DuesDetails department={details} student={user} onClose={() => setDetails(null)} onPaid={load} />}
    </Shell>
  );
}
