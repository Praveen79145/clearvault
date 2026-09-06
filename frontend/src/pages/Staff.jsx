import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, relTime, fullDate } from "../api.js";
import Icon, { DEPT_ICON } from "../icons.jsx";
import Shell from "../components/Shell.jsx";
const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

/** Student dossier — what this office must verify before signing */
function Dossier({ item, deptInfo }) {
  const dues = item.dues || [];
  return (
    <div className="mt-5 border border-line rounded-[10px] overflow-hidden">
      <p className="kicker !text-[10px] px-4 py-2.5 border-b border-line bg-paper">Officer dossier · {deptInfo.name}</p>
      <div className="divide-y divide-line">
        <div className="px-4 py-3">
          <p className="font-mono text-[10px] font-semibold text-muted mb-1.5">RECORDED DUES FOR YOUR OFFICE</p>
          {dues.length === 0 ? (
            <p className="text-[12.5px] text-muted italic">Nothing on record — no dues flagged for this office.</p>
          ) : (
            <ul className="space-y-1.5">
              {dues.map((d, i) => (
                <li key={i} className="flex items-baseline justify-between gap-3 text-[13px]">
                  <span className="flex items-center gap-2"><Icon name="alert" size={12} className="text-bad shrink-0" />{d.label}</span>
                  <span className="font-mono text-[12px] font-semibold text-bad">{inr(d.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="px-4 py-3">
          <p className="font-mono text-[10px] font-semibold text-muted mb-1.5">VERIFICATION CHECKLIST</p>
          <ul className="space-y-1.5">
            {deptInfo.checks.map((c, i) => (
              <li key={i} className="flex items-center gap-2 text-[12.5px] text-muted">
                <span className="w-3.5 h-3.5 border border-line-strong rounded-[3px] grid place-items-center text-good shrink-0">
                  <Icon name="check" size={9} strokeWidth={2.6} />
                </span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function DecisionModal({ item, action, deptInfo, onClose, onDone }) {
  const [remarks, setRemarks] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const approve = action === "APPROVE";

  const submit = async () => {
    if (!approve && !remarks.trim()) {
      setErr("A comment is mandatory — the student must see exactly what to fix.");
      return;
    }
    setBusy(true); setErr("");
    try {
      await api(`/api/dept/clearances/${item.id}`, { method: "PUT", body: { action, remarks: remarks.trim() } });
      onDone(approve);
    } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/55" onClick={() => !busy && onClose()}>
      <div className="card w-full max-w-md p-0 overflow-hidden max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-5 pb-4 border-b border-line flex items-center justify-between">
          <p className="display text-xl font-semibold">{approve ? "Approve & sign" : "Reject with comment"}</p>
          <button onClick={onClose} className="text-muted hover:text-ink transition" aria-label="Close">
            <Icon name="x" size={17} />
          </button>
        </div>
        <div className="p-6">
          <p className="text-[14px] font-semibold">{item.student.name} <span className="font-mono text-[11px] text-muted font-normal ml-1.5">{item.student.rollNo}</span></p>
          <p className="text-[13px] text-muted mt-0.5">{item.request.purpose} · submitted {relTime(item.request.createdAt)}</p>

          <Dossier item={item} deptInfo={deptInfo} />

          {approve ? (
            <div className="mt-5 border border-line rounded-lg p-4 bg-paper">
              <p className="kicker !text-[10px] mb-1.5">Digital sign-off</p>
              <p className="text-[13px] leading-relaxed text-muted">
                An HMAC-SHA256 signature is generated from the roll number, office and exact time of approval.
                It is printed on the student's certificate and can never be re-created from altered data.
              </p>
            </div>
          ) : (
            <div className="mt-5">
              <label className="field">Comment for the student <span className="text-bad normal-case tracking-normal">(required — shown verbatim)</span></label>
              <textarea className="input" rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Semester fee instalment of ₹2,500 pending. Pay at the Accounts counter, then re-apply online." />
            </div>
          )}

          {err && <p className="mt-3 text-[13px] font-medium text-bad flex items-center gap-2"><Icon name="alert" size={15} />{err}</p>}

          <div className="flex gap-2.5 mt-6">
            <button onClick={onClose} disabled={busy} className="btn btn-outline flex-1">Cancel</button>
            <button onClick={submit} disabled={busy || (!approve && !remarks.trim())} className={`btn flex-1 ${approve ? "btn-good" : "btn-primary"}`}>
              {busy ? "Recording…" : approve ? <><Icon name="pen-line" size={14} /> Sign & clear</> : <><Icon name="x" size={14} /> Reject &amp; return</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Staff() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [queue, setQueue] = useState([]);
  const [deptInfo, setDeptInfo] = useState(null); // { name, officerTitle, checks, icon } from backend
  const [tab, setTab] = useState("PENDING");
  const [decision, setDecision] = useState(null); // {item, action}
  const [toast, setToast] = useState("");
  const poll = useRef(false);

  const load = useCallback(async () => {
    try {
      const d = await api("/api/dept/clearances");
      setQueue(d.queue);
      setDeptInfo(d.deptInfo);
    } catch { /* session lost */ }
  }, []);

  useEffect(() => {
    api("/api/auth/me").then((d) => {
      if (d.user.role !== "STAFF") return navigate("/login");
      setUser(d.user); load();
    }).catch(() => navigate("/login"));
    if (!poll.current) {
      poll.current = true;
      const t = setInterval(load, 5000);
      return () => clearInterval(t);
    }
  }, [navigate, load]);

  if (!user) return null;
  const officeName = deptInfo?.name || user.dept;
  const officerTitle = deptInfo?.officerTitle || "Officer";
  // Cancelled requests leave the active queue entirely (backend filters them) —
  // anything cancelled that appears here is read-only history.
  const pending = queue.filter((c) => c.status === "PENDING" && !c.requestCancelled);
  const history = queue.filter((c) => c.status !== "PENDING" || c.requestCancelled);
  const rows = tab === "PENDING" ? pending : history;

  const flashDone = (approved) => {
    setDecision(null);
    setToast(approved ? "Cleared — digital signature recorded on the ledger." : "Returned to the student with your comment.");
    load();
    setTimeout(() => setToast(""), 5000);
  };

  return (
    <Shell user={user} roleLabel={officerTitle}>
      <div className="flex flex-wrap items-end justify-between gap-4 pb-6 border-b border-line">
        <div className="flex items-center gap-4">
          <span className="w-11 h-11 border border-line-strong rounded-md grid place-items-center text-brand">
            <Icon name={DEPT_ICON[user.dept]} size={20} />
          </span>
          <div>
            <p className="kicker">{officerTitle} · approval console</p>
            <h1 className="display text-3xl sm:text-4xl mt-1 font-semibold">{officeName}</h1>
          </div>
        </div>
        <div className="flex gap-1 border border-line rounded-lg p-1">
          {[["PENDING", `Pending · ${pending.length}`], ["HISTORY", "Ledger"]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-3.5 py-1.5 rounded-md text-[12.5px] font-semibold transition ${tab === key ? "bg-ink text-paper" : "text-muted hover:text-ink"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-[12.5px] text-muted mt-3 leading-relaxed flex items-center gap-2">
        <Icon name="shield" size={14} className="text-brand shrink-0" />
        You can act only on files routed to the <b>{officeName}</b>. Any cross-office attempt is rejected by the server.
      </p>

      {toast && (
        <div className="mt-4 border border-good/40 bg-good/5 rounded-[10px] px-4 py-3 text-[13.5px] font-medium text-good flex items-center gap-2.5">
          <Icon name="check" size={15} /> {toast}
        </div>
      )}

      <div className="card mt-6 overflow-hidden overflow-x-auto">
        <table className="rule-table min-w-[680px]">
          <thead>
            <tr>
              <th>Student</th><th>Purpose</th><th>Filed</th><th>Status</th><th className="!text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={5} className="!py-14 text-center">
                <Icon name="inbox" size={26} className="mx-auto text-muted" />
                <p className="text-[13.5px] text-muted mt-3">
                  {tab === "PENDING"
                    ? `Nothing awaits the ${officerTitle} right now. New files appear here automatically.`
                    : "No decisions on the ledger yet."}
                </p>
              </td></tr>
            )}
            {rows.map((c) => (
              <tr key={c.id}>
                <td>
                  <p className="font-semibold text-[13.5px]">{c.student.name}</p>
                  <p className="font-mono text-[11px] text-muted">{c.student.rollNo}</p>
                  {(c.dues || []).length > 0 && (
                    <p className="font-mono text-[10px] text-bad mt-1 flex items-center gap-1">
                      <Icon name="alert" size={10} /> {c.dues.length} due{c.dues.length > 1 ? "s" : ""} on record
                    </p>
                  )}
                </td>
                <td className="text-[13px]">{c.request.purpose}</td>
                <td className="text-[13px] text-muted" title={fullDate(c.request.createdAt)}>{relTime(c.request.createdAt)}</td>
                <td>
                  {c.requestCancelled ? (
                    <>
                      <span className="badge badge-bad">Request cancelled</span>
                      <p className="text-[11.5px] text-muted mt-1.5 max-w-[240px]">
                        by the student{c.cancellationReason ? <> — “{c.cancellationReason}”</> : ""}
                      </p>
                    </>
                  ) : c.status === "PENDING" ? (
                    <span className="badge badge-wait"><span className="sr-only">pending</span>Pending</span>
                  ) : c.status === "APPROVED" ? (
                    <>
                      <span className="badge badge-good">Cleared</span>
                      <p className="font-mono text-[10px] text-good mt-1.5">SIGN {c.signatureHash}</p>
                    </>
                  ) : (
                    <>
                      <span className="badge badge-bad">Rejected</span>
                      <p className="text-[11.5px] text-bad mt-1.5 max-w-[240px]">&ldquo;{c.remarks}&rdquo;</p>
                    </>
                  )}
                </td>
                <td className="!text-right">
                  {c.requestCancelled ? (
                    <span className="font-mono text-[10px] text-muted">READ-ONLY · WORKFLOW STOPPED</span>
                  ) : c.status === "PENDING" && (
                    <span className="inline-flex gap-2">
                      <button className="btn btn-good btn-sm" onClick={() => setDecision({ item: c, action: "APPROVE" })}>
                        <Icon name="pen-line" size={13} /> Review &amp; clear
                      </button>
                      <button className="btn btn-bad-outline btn-sm" onClick={() => setDecision({ item: c, action: "REJECT" })}>
                        Reject
                      </button>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="kicker !text-[9.5px] mt-4 text-center">
        Every decision is signed, timestamped and written to the institutional audit trail — actor, office, status and comment.
      </p>

      {decision && deptInfo && (
        <DecisionModal item={decision.item} action={decision.action} deptInfo={deptInfo}
          onClose={() => setDecision(null)} onDone={flashDone} />
      )}
    </Shell>
  );
}
