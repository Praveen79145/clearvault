import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, fullDate } from "../api.js";
import Icon, { DEPT_ICON } from "../icons.jsx";
import Shell from "../components/Shell.jsx";
import CancelModal from "../components/CancelModal.jsx";

const META = {
  PENDING: { badge: "badge-wait", label: "Pending" },
  APPROVED: { badge: "badge-good", label: "Cleared" },
  REJECTED: { badge: "badge-bad", label: "Rejected" },
};
const OVERALL = {
  IN_PROGRESS: { badge: "badge-wait", label: "In progress" },
  ACTION_REQUIRED: { badge: "badge-bad", label: "Action required" },
  COMPLETED: { badge: "badge-good", label: "Certificate issued" },
  CANCELLED: { badge: "badge-bad", label: "Cancelled" },
};
/** Cancellable states (maps to the spec's DRAFT / SUBMITTED / PENDING / UNDER_REVIEW) */
const CANCELLABLE = (overall) => overall === "IN_PROGRESS" || overall === "ACTION_REQUIRED";

function Segments({ clearances }) {
  return (
    <div className="flex gap-1.5 mt-5" role="img" aria-label="Office progress">
      {clearances.map((c) => (
        <div key={c.id}
          className={`seg flex-1 ${c.status === "APPROVED" ? "seg-good" : c.status === "REJECTED" ? "seg-bad" : "seg-wait"}`}
          title={`${c.deptName}: ${META[c.status].label}`}>
          <i />
        </div>
      ))}
    </div>
  );
}

export default function RequestView() {
  const { type } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [catalog, setCatalog] = useState(null);       // request-type registry from API
  const [detail, setDetail] = useState(null);         // { request, overall, clearances }
  const [state, setState] = useState("loading");      // loading | start | tracking | unavailable | foreign
  const [previousCancelled, setPreviousCancelled] = useState(null); // an earlier cancelled filing of this type
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [activeElsewhere, setActiveElsewhere] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [startOver, setStartOver] = useState(false);        // re-file from a cancelled filing
  const poll = useRef(false);

  const typeDef = catalog?.find((t) => t.id === type) || null;

  const load = useCallback(async () => {
    const [t, l] = await Promise.all([api("/api/request-types"), api("/api/requests/list")]);
    setCatalog(t.types);
    const ofType = l.requests.filter((r) => r.type === type); // newest-first
    setPreviousCancelled(ofType.find((r) => r.overall === "CANCELLED") || null);
    const mine = ofType[0] || null; // newest of the type — INCLUDING cancelled (shown read-only)
    if (!mine) {
      setDetail(null);
      setState(t.types.some((x) => x.id === type) ? "start" : "unavailable");
      return;
    }
    try {
      setDetail(await api(`/api/requests/${mine.id}`));
      setState("tracking");
    } catch (e) {
      setState(e.status === 403 ? "foreign" : "unavailable");
    }
  }, [type]);

  useEffect(() => {
    api("/api/auth/me")
      .then((d) => {
        if (d.user.role !== "STUDENT") return navigate("/login");
        setUser(d.user);
        load().catch(() => setState("unavailable"));
      })
      .catch(() => navigate("/login"));
    if (!poll.current) {
      poll.current = true;
      const t = setInterval(() => load().catch(() => {}), 5000);
      return () => clearInterval(t);
    }
  }, [navigate, load]);

  const start = async () => {
    setBusy(true); setErr(""); setActiveElsewhere(null);
    try {
      await api("/api/requests", { method: "POST", body: { type } });
      setStartOver(false);
      load();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
      if (/active clearance request/i.test(e.message)) {
        api("/api/requests/list").then((l) =>
          setActiveElsewhere(l.requests.find((r) => r.overall !== "COMPLETED" && r.overall !== "CANCELLED") || null));
      }
    }
  };

  const reapply = async (id) => { await api(`/api/clearances/${id}/reapply`, { method: "POST" }); load(); };

  // After a successful cancellation: refresh state — the Cancel button
  // disappears because the request is no longer in a cancellable state.
  const cancelled = () => { setConfirming(false); load(); };

  if (!user) return null;

  const BackLink = (
    <Link to="/student" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-ink transition">
      <Icon name="arrow-left" size={14} /> All request types
    </Link>
  );

  /* ── Loading ─────────────────────────────────────────────────── */
  if (state === "loading")
    return (
      <Shell user={user} roleLabel={user.rollNo || "Student"}>
        <div className="h-6 w-40 bg-surface border border-line rounded animate-pulse" />
        <div className="h-40 card mt-6 animate-pulse" />
      </Shell>
    );

  /* ── Unknown request type (direct URL, tampered or removed) ──── */
  if (state === "unavailable")
    return (
      <Shell user={user} roleLabel={user.rollNo || "Student"}>
        {BackLink}
        <div className="card max-w-lg mx-auto mt-10 p-10 text-center">
          <Icon name="alert" size={26} className="mx-auto text-wait" />
          <h1 className="display text-2xl mt-4 font-semibold">That request isn't available</h1>
          <p className="text-[13.5px] text-muted mt-2 leading-relaxed">
            <span className="font-mono text-[12px]">/student/request/{type}</span> doesn't match a
            service the registrar currently offers (or it moved).
          </p>
          <Link to="/student" className="btn btn-primary mt-6">Browse available requests</Link>
        </div>
      </Shell>
    );

  /* ── Belongs to someone else — never expose it ───────────────── */
  if (state === "foreign")
    return (
      <Shell user={user} roleLabel={user.rollNo || "Student"}>
        {BackLink}
        <div className="card max-w-lg mx-auto mt-10 p-10 text-center">
          <Icon name="lock" size={26} className="mx-auto text-bad" />
          <h1 className="display text-2xl mt-4 font-semibold">Not linked to your account</h1>
          <p className="text-[13.5px] text-muted mt-2 leading-relaxed">
            This request belongs to another student. For privacy, its contents aren't shown here.
          </p>
          <Link to="/student" className="btn btn-primary mt-6">Back to my requests</Link>
        </div>
      </Shell>
    );

  /* ── No active request of this type → start panel (offices come from the API) */
  if ((state === "start" || startOver) && typeDef)
    return (
      <Shell user={user} roleLabel={user.rollNo || "Student"}>
        {BackLink}
        <div className="max-w-xl mx-auto mt-8">
          <span className="w-12 h-12 border border-line-strong rounded-md grid place-items-center text-brand">
            <Icon name={typeDef.icon} size={22} />
          </span>
          <p className="kicker mt-5">New request</p>
          <h1 className="display text-3xl sm:text-4xl mt-2 font-semibold">{typeDef.title}</h1>
          <p className="text-[14px] text-muted leading-relaxed mt-3">{typeDef.blurb}</p>

          {previousCancelled && (
            <p className="mt-4 text-[12.5px] text-muted border border-line rounded-[10px] px-4 py-3 flex items-center gap-2.5">
              <Icon name="x" size={13} className="text-bad shrink-0" />
              A previous filing of this type was cancelled on {fullDate(previousCancelled.cancelledAt)} — it stays
              on record and is never overwritten. This will be a new request with a new ID.
            </p>
          )}

          <div className="card p-6 mt-7">
            <div className="flex items-baseline justify-between mb-4">
              <p className="kicker">Mandatory approvals — {typeDef.requires.length} of 9 offices</p>
            </div>
            <div className="space-y-3">
              {typeDef.requires.map((d) => (
                <div key={d.id} className="flex items-center gap-3 text-[13.5px]">
                  <span className="w-8 h-8 border border-line rounded-md grid place-items-center text-brand shrink-0">
                    <Icon name={d.icon} size={15} />
                  </span>
                  <span><b>{d.name}</b> <span className="text-muted">· signed by the {d.officerTitle}</span></span>
                </div>
              ))}
            </div>
            <p className="text-[12.5px] text-muted mt-5 leading-relaxed border-t border-line pt-4">
              {typeDef.requires.length === 1
                ? "This request goes to a single office. The moment it is cleared, your certificate is issued."
                : `These offices receive your file at the same time and review it in parallel. Only after every one of the ${typeDef.requires.length} mandatory approvals is cleared does your certificate get issued — no exceptions.`}
              {" "}You can cancel the request yourself while it is still under review.
            </p>

            {err && (
              <div className="mt-4 text-[13px] font-medium text-bad leading-relaxed">
                <p className="flex items-center gap-2"><Icon name="alert" size={15} /> {err}</p>
                {activeElsewhere && (
                  <Link to={`/student/request/${activeElsewhere.type}`} className="inline-flex items-center gap-1.5 mt-2 font-semibold text-ink underline underline-offset-2">
                    Open your active request <Icon name="arrow-right" size={13} />
                  </Link>
                )}
              </div>
            )}

            <button onClick={start} disabled={busy} className="btn btn-brand w-full mt-5 !py-3">
              <Icon name="send" size={15} /> {busy ? `Routing to ${typeDef.requires.length} office(s)…` : `Submit ${typeDef.title}`}
            </button>
            <p className="kicker !text-[9.5px] mt-4 text-center">One active request at a time · no duplicate filings</p>
          </div>
        </div>
      </Shell>
    );

  /* ── Tracking an existing request ────────────────────────────── */
  const { request, clearances, overall } = detail;
  const cleared = clearances.filter((c) => c.status === "APPROVED").length;
  const isCancelled = overall === "CANCELLED";

  return (
    <Shell user={user} roleLabel={user.rollNo || "Student"}>
      {BackLink}

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-6 border-b border-line mt-4">
        <div>
          <p className="kicker">Request {request.id.slice(-8).toUpperCase()} · {fullDate(request.createdAt)}</p>
          <h1 className="display text-3xl sm:text-4xl mt-2 font-semibold">{request.purpose}</h1>
        </div>
        <span className={`badge ${OVERALL[overall].badge} !text-[11px] !px-3 !py-1.5`}>
          {OVERALL[overall].label}
        </span>
      </div>

      {/* Progress */}
      <div className={`card p-6 mt-6 ${isCancelled ? "opacity-60" : ""}`}>
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-[14px] font-semibold">
            {cleared} of {clearances.length} mandatory approvals cleared
          </p>
          <p className="kicker !text-[10px]">{isCancelled ? "workflow stopped" : "updates automatically"}</p>
        </div>
        <Segments clearances={clearances} />
        <div className="flex justify-between mt-2.5">
          {clearances.map((c) => (
            <p key={c.id} className="flex-1 text-left kicker !text-[9px] px-0.5 first:pl-0 truncate">{deptShort(c)}</p>
          ))}
        </div>
      </div>

      {/* Cancelled banner — read-only outcome */}
      {isCancelled && (
        <div className="mt-4 border border-bad/40 bg-bad/5 rounded-[10px] p-5">
          <div className="flex gap-3">
            <Icon name="x" size={17} className="text-bad shrink-0 mt-0.5" />
            <div>
              <p className="text-[14.5px] font-semibold text-bad">Request cancelled</p>
              <p className="text-[13px] text-muted mt-1 leading-relaxed">
                Cancelled by {request.cancelledBy || "the student"} on {fullDate(request.cancelledAt)}.
                {" "}The clearance workflow is stopped — no further approvals can be recorded and no certificate will be issued for this filing.
              </p>
              {request.cancellationReason && (
                <p className="text-[13px] mt-2 text-ink">
                  <span className="text-muted">Reason:</span> &ldquo;{request.cancellationReason}&rdquo;
                </p>
              )}
              <p className="text-[12.5px] text-muted mt-3 border-t border-line pt-3">
                This filing stays in the registry for audit. Need the same clearance again?{" "}
                <button onClick={() => setStartOver(true)} className="font-semibold text-ink underline underline-offset-2">
                  File a new request
                </button>{" "}— you'll get a fresh request ID.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cancel action — only while the workflow is still open */}
      {CANCELLABLE(overall) && (
        <div className="card mt-4 p-5 flex flex-wrap items-center justify-between gap-4 border-bad/30">
          <div>
            <p className="text-[13.5px] font-semibold">Need to withdraw this filing?</p>
            <p className="text-[12.5px] text-muted mt-0.5">
              Cancelling stops the clearance workflow. Approvals already recorded stay on the ledger.
            </p>
          </div>
          <button className="btn btn-bad-outline btn-sm" onClick={() => setConfirming(true)}>
            <Icon name="x" size={13} /> Cancel request
          </button>
        </div>
      )}

      {/* Action-required banner */}
      {overall === "ACTION_REQUIRED" && (
        <div className="mt-4 border border-bad/40 bg-bad/5 rounded-[10px] p-4 flex gap-3">
          <Icon name="alert" size={17} className="text-bad shrink-0 mt-0.5" />
          <div>
            <p className="text-[14px] font-semibold text-bad">An office has returned your file</p>
            <p className="text-[13px] text-muted mt-0.5 leading-relaxed">
              Read the officer's comment below, settle the due at that office, then re-apply — only that office reviews you again.
              Your certificate stays withheld until every mandatory approval is cleared.
            </p>
          </div>
        </div>
      )}

      {/* Certificate CTA */}
      {overall === "COMPLETED" && (
        <div className="mt-4 border border-good/40 bg-good/5 rounded-[10px] p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-3.5 items-center">
            <span className="w-10 h-10 rounded-full border border-good/50 grid place-items-center text-good"><Icon name="grad-cap" size={19} /></span>
            <div>
              <p className="text-[14.5px] font-semibold text-good">Every mandatory approval cleared — certificate issued</p>
              <p className="font-mono text-[11.5px] text-muted mt-0.5">Certificate No. {request.certificateCode}</p>
            </div>
          </div>
          <Link to={`/certificate/${request.id}`} className="btn btn-brand">
            <Icon name="download" size={15} /> View &amp; download
          </Link>
        </div>
      )}

      {/* Department ledger */}
      <div className="card mt-6 overflow-hidden">
        <p className="kicker px-5 pt-4 pb-3">Office ledger {isCancelled && "— frozen at cancellation"}</p>
        <div className="border-t border-line divide-y divide-line">
          {clearances.map((c) => (
            <div key={c.id} className="px-5 py-4 flex flex-wrap items-center gap-x-5 gap-y-3">
              <span className="w-9 h-9 shrink-0 border border-line-strong rounded-md grid place-items-center text-brand">
                <Icon name={c.deptIcon || DEPT_ICON[c.dept]} size={16} />
              </span>
              <div className="min-w-[130px]">
                <p className="font-semibold text-[14px]">{c.deptName}</p>
                <p className="kicker !text-[9px] mt-0.5">{c.officerTitle}</p>
              </div>

              <div className="flex-1 min-w-[220px] text-[13px] text-muted">
                {c.status === "APPROVED" && (
                  <>
                    <p>Cleared by <b className="text-ink">{c.approvedBy}</b> · {fullDate(c.signedAt)}</p>
                    <p className="font-mono text-[10.5px] text-good mt-1">SIGN {c.signatureHash}</p>
                    {c.remarks && (
                      <p className="mt-2 text-[13px] text-good">Approved — No dues found. <span className="font-medium">“{c.remarks}”</span></p>
                    )}
                  </>
                )}
                {c.status === "REJECTED" && (
                  <div>
                    <p className="text-[13px] text-bad font-semibold">Rejected — Dues found.</p>
                    <p className="text-[13px] text-bad mt-1">&ldquo;{c.remarks}&rdquo;</p>
                    {c.approvedBy && <p className="text-[12px] text-muted mt-1">— {c.approvedBy}</p>}
                  </div>
                )}
                {c.status === "PENDING" && !isCancelled && (
                  <p className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-wait pulse-dot" /> Awaiting review
                  </p>
                )}
                {c.status === "PENDING" && isCancelled && (
                  <p className="italic">Never decided — cancelled before this office reviewed it</p>
                )}
              </div>

              <div className="flex items-center gap-3 ml-auto">
                <span className={`badge ${META[c.status].badge}`}>{META[c.status].label}</span>
                {c.status === "REJECTED" && !isCancelled && (
                  <button onClick={() => reapply(c.id)} className="btn btn-outline btn-sm">
                    <Icon name="refresh" size={13} /> Re-apply
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {confirming && (
        <CancelModal request={request} onClose={() => setConfirming(false)} onDone={cancelled} />
      )}
    </Shell>
  );
}

const deptShort = (c) => (c.deptName || "").replace(/( Office| Lab)$/, "");