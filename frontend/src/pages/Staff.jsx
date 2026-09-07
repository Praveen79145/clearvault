import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, relTime, fullDate } from "../api.js";
import Icon, { DEPT_ICON } from "../icons.jsx";
import Shell from "../components/Shell.jsx";
const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

/** Department-specific dues record — the snapshot frozen on this clearance. */
function DuesPanel({ dues }) {
  if (!dues) return null;
  const hasDues = dues.status === "DUES_FOUND";
  return (
    <div className="border border-line rounded-[10px] overflow-hidden">
      <div className="px-4 py-2.5 border-b border-line bg-paper flex items-center justify-between gap-3">
        <p className="kicker !text-[10px]">Department dues record</p>
        {hasDues ? (
          <span className="badge badge-bad">DUES FOUND</span>
        ) : (
          <span className="badge badge-good">NO DUES</span>
        )}
      </div>
      <ul className="divide-y divide-line">
        {(dues.lines || []).map((l, i) => (
          <li key={i} className="flex items-baseline justify-between gap-4 px-4 py-3">
            <span>
              <span className={`flex items-center gap-2 text-[13px] font-medium ${l.amount > 0 ? "" : "text-muted"}`}>
                {l.amount > 0
                  ? <Icon name="alert" size={12} className="text-bad shrink-0" />
                  : <Icon name="check" size={12} strokeWidth={2.6} className="text-good shrink-0" />}
                {l.label}
              </span>
              {l.detail && <span className="block text-[12px] text-muted mt-0.5 ml-5">{l.detail}</span>}
            </span>
            <span className={`font-mono text-[12.5px] shrink-0 ${l.amount > 0 ? "font-semibold text-bad" : "text-muted"}`}>
              {l.value ?? (l.amount > 0 ? inr(l.amount) : "₹0")}
            </span>
          </li>
        ))}
        <li className="flex items-baseline justify-between gap-4 px-4 py-3 bg-paper">
          <span className="text-[12px] font-semibold uppercase tracking-wide text-muted">Total pending</span>
          <span className={`font-mono text-[14px] font-semibold ${hasDues ? "text-bad" : "text-good"}`}>{inr(dues.total)}</span>
        </li>
      </ul>
      {dues.waived ? (
        <p className="px-4 py-2.5 text-[12px] text-wait border-t border-line bg-wait/5 flex items-center gap-2">
          <Icon name="pen-line" size={12} />
          Waived on record by {dues.waived.by} · {fullDate(dues.waived.at)}
        </p>
      ) : dues.checkedAt ? (
        <p className="px-4 py-2.5 text-[11px] font-mono text-muted border-t border-line">
          Snapshot taken {fullDate(dues.checkedAt)} — stored with this request
        </p>
      ) : null}
    </div>
  );
}

/** Signature explainer shown at the moment of signing */
function SignOffNote() {
  return (
    <div className="mt-5 border border-line rounded-lg p-4 bg-paper">
      <p className="kicker !text-[10px] mb-1.5">Digital sign-off</p>
      <p className="text-[13px] leading-relaxed text-muted">
        An HMAC-SHA256 signature is generated from the roll number, office and exact time of approval.
        It is printed on the student's certificate and can never be re-created from altered data.
      </p>
    </div>
  );
}

/** Detailed clearance view — opened when the officer clicks a student's file. */
function DetailModal({ item, deptInfo, onClose, onDecide }) {
  const dues = item.dues;
  const hasDues = dues?.status === "DUES_FOUND";
  const decided = item.status !== "PENDING";
  return (
    <div className="fixed inset-0 z-40 grid place-items-center p-4 bg-black/55" onClick={onClose}>
      <div className="card w-full max-w-lg p-0 overflow-hidden max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-5 pb-4 border-b border-line flex items-center justify-between">
          <div>
            <p className="display text-xl font-semibold">Clearance review</p>
            <p className="kicker !text-[9.5px] mt-1">{deptInfo.name}</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink transition" aria-label="Close">
            <Icon name="x" size={17} />
          </button>
        </div>

        <div className="p-6">
          {/* File header — who, what, when */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[15px] font-semibold">{item.student.name}
                <span className="font-mono text-[11px] text-muted font-normal ml-2">{item.student.rollNo}</span>
              </p>
              <p className="text-[13px] text-muted mt-0.5">{item.request.purpose}</p>
              <p className="font-mono text-[11px] text-muted mt-1">
                Filed {relTime(item.request.createdAt)} · {fullDate(item.request.createdAt)}
              </p>
            </div>
            <span className="w-10 h-10 shrink-0 border border-line-strong rounded-md grid place-items-center text-brand">
              <Icon name={DEPT_ICON[item.dept]} size={18} />
            </span>
          </div>

          <div className="mt-5">
            <DuesPanel dues={dues} />
          </div>

          {item.requestCancelled ? (
            <p className="mt-5 text-[12.5px] text-muted border border-line rounded-lg px-4 py-3 bg-paper">
              This request was cancelled by the student{item.cancellationReason ? <> — "{item.cancellationReason}"</> : ""}. The file is read-only.
            </p>
          ) : decided && item.status === "APPROVED" ? (
            <p className="mt-5 font-mono text-[11px] text-good border border-good/30 bg-good/5 rounded-lg px-4 py-3">
              CLEARED · SIGN {item.signatureHash} · by {item.approvedBy} · {fullDate(item.signedAt)}
            </p>
          ) : decided ? (
            <p className="mt-5 text-[12.5px] text-bad border border-bad/30 bg-bad/5 rounded-lg px-4 py-3">
              REJECTED by {item.approvedBy} — "{item.remarks}"
            </p>
          ) : hasDues ? (
            <p className="mt-5 text-[12.5px] text-bad border border-bad/30 bg-bad/5 rounded-lg px-4 py-3 flex items-start gap-2.5">
              <Icon name="lock" size={14} className="mt-0.5 shrink-0" />
              <span>
                <b>Approval is blocked while dues are outstanding.</b> Reject with the amount so the student
                can settle and re-apply — or sign only after explicitly acknowledging the settlement in the next step.
              </span>
            </p>
          ) : (
            <p className="mt-5 text-[12.5px] text-good border border-good/30 bg-good/5 rounded-lg px-4 py-3 flex items-start gap-2.5">
              <Icon name="check" size={14} strokeWidth={2.6} className="mt-0.5 shrink-0" />
              <span>
                <b>No Dues — verified clean.</b> The {deptInfo.short || item.dept.toLowerCase()} records show nothing outstanding.
                This file can be signed immediately.
              </span>
            </p>
          )}

          {/* Actions — only live, pending files */}
          {!item.requestCancelled && !decided && (
            <div className="flex gap-2.5 mt-6">
              {hasDues && (
                <button onClick={() => onDecide("REJECT")} className="btn btn-outline">
                  <Icon name="alert" size={14} /> Dues
                </button>
              )}
              {hasDues && <button onClick={() => onDecide("REJECT")} className="btn btn-bad-outline flex-1">
                <Icon name="x" size={14} /> Reject request
              </button>}
              <button onClick={() => !hasDues && onDecide("APPROVE")} className="btn btn-good flex-1" disabled={hasDues}
                title={hasDues ? "Approval blocked: outstanding dues exist. Reject with a comment instead." : "No dues — sign & clear"}>
                {hasDues ? "Approve" : <><Icon name="check" size={14} /> No Dues</>}
              </button>
            </div>
          )}
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
  const dues = item.dues;
  const hasDues = dues?.status === "DUES_FOUND" && (dues?.total || 0) > 0;

  const defaultReject = (d) => {
    const parts = (d?.lines || []).filter((l) => (l.amount || 0) > 0).map((l) => `${inr(l.amount)} ${l.label.toLowerCase()}`);
    return parts.length ? `${parts.join(" and ")} ${parts.length === 1 ? "is" : "are"} pending. Please clear the outstanding amount.` : "Outstanding department dues are pending. Please clear them and re-apply.";
  };
  const defaultApprove = () => {
    const labels = (dues?.lines || []).map((l) => l.label.toLowerCase());
    return `All ${deptInfo.short || deptInfo.name} records have been verified. No outstanding ${labels.join(" or ") || "dues"} are pending.`;
  };

  useEffect(() => {
    if (approve) setRemarks(defaultApprove());
    else setRemarks(defaultReject(dues));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, item.id]);

  const submit = async () => {
    if (!approve && !remarks.trim()) {
      setErr("A comment is mandatory — the student must see exactly what to fix.");
      return;
    }
    if (approve && hasDues) {
      setErr("Approval blocked: outstanding dues exist. Reject with a comment instead.");
      return;
    }
    setBusy(true); setErr("");
    try {
      await api(`/api/dept/clearances/${item.id}`, {
        method: "PUT",
        body: { action, remarks: remarks.trim() },
      });
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
          <p className="text-[13px] text-muted mt-0.5">{item.request.purpose} · {deptInfo.name} · submitted {relTime(item.request.createdAt)}</p>

          {/* The officer ALWAYS sees the dues again at the moment of decision */}
          <div className="mt-4"><DuesPanel dues={dues} /></div>

          {approve ? (
            <>
              <div className="mt-4">
                <label className="field">Approval note for the student</label>
                <textarea className="input" rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Describe what you verified for the student (saved and shown on their request)." />
              </div>
              <SignOffNote />
            </>
          ) : (
            <div className="mt-5">
              <label className="field">Comment for the student <span className="text-bad normal-case tracking-normal">(required — shown verbatim)</span></label>
              <textarea className="input" rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)}
                placeholder={hasDues
                  ? `e.g. Dues of ${inr(dues.total)} pending — settle at the office, then re-apply online.`
                  : "e.g. Semester fee instalment of ₹2,500 pending. Pay at the Accounts counter, then re-apply online."} />
            </div>
          )}

          {err && <p className="mt-3 text-[13px] font-medium text-bad flex items-center gap-2"><Icon name="alert" size={15} />{err}</p>}

          <div className="flex gap-2.5 mt-6">
            <button onClick={onClose} disabled={busy} className="btn btn-outline flex-1">Cancel</button>
            <button onClick={submit} disabled={busy || (!approve && !remarks.trim())}
              className={`btn flex-1 ${approve ? "btn-good" : "btn-primary"}`}>
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
  const [active, setActive] = useState(null);     // clearance opened in the detail view
  const [decision, setDecision] = useState(null); // {item, action}
  const [toast, setToast] = useState("");
  const [loadError, setLoadError] = useState("");
  const poll = useRef(false);

  const load = useCallback(async () => {
    try {
      const d = await api("/api/dept/clearances");
      setQueue(d.queue);
      setDeptInfo(d.deptInfo);
      // Keep an open detail view in sync with 5s polling
      setActive((cur) => cur ? (d.queue.find((c) => c.id === cur.id) || cur) : cur);
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
    setActive(null);
    setToast(approved ? "Cleared — digital signature recorded on the ledger." : "Returned to the student with your comment.");
    load();
    setTimeout(() => setToast(""), 5000);
  };

  // Re-fetch on open so the modal always represents this clearance ID, its
  // request, and the signed-in officer's department—not a stale table row.
  const openFile = async (id) => {
    setLoadError("");
    try {
      const d = await api(`/api/dept/clearances/${id}`);
      setActive(d.clearance);
      setDeptInfo(d.deptInfo);
    } catch (e) { setLoadError(e.message); }
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
      {loadError && <p className="mt-4 text-[13px] text-bad flex items-center gap-2"><Icon name="alert" size={15} />{loadError}</p>}

      <div className="card mt-6 overflow-hidden overflow-x-auto">
        <table className="rule-table min-w-[720px]">
          <thead>
            <tr>
              <th>Student</th><th>Purpose</th><th>Dues</th><th>Filed</th><th>Status</th><th className="!text-right">Review</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6} className="!py-14 text-center">
                <Icon name="inbox" size={26} className="mx-auto text-muted" />
                <p className="text-[13.5px] text-muted mt-3">
                  {tab === "PENDING"
                    ? `Nothing awaits the ${officerTitle} right now. New files appear here automatically.`
                    : "No decisions on the ledger yet."}
                </p>
              </td></tr>
            )}
            {rows.map((c) => (
              <tr key={c.id} className="cursor-pointer" onClick={() => openFile(c.id)}>
                <td>
                  <p className="font-semibold text-[13.5px]">{c.student.name}</p>
                  <p className="font-mono text-[11px] text-muted">{c.student.rollNo}</p>
                </td>
                <td className="text-[13px]">{c.request.purpose}</td>
                <td>
                  {c.dues ? (
                    c.dues.status === "DUES_FOUND" ? (
                      <span className="badge badge-bad">DUES {inr(c.dues.total)}</span>
                    ) : (
                      <span className="badge badge-ink">NO DUES</span>
                    )
                  ) : (
                    <span className="font-mono text-[10px] text-muted">—</span>
                  )}
                </td>
                <td className="text-[13px] text-muted" title={fullDate(c.request.createdAt)}>{relTime(c.request.createdAt)}</td>
                <td>
                  {c.requestCancelled ? (
                    <span className="badge badge-bad">Request cancelled</span>
                  ) : c.status === "PENDING" ? (
                    <span className="badge badge-wait"><span className="pulse-dot inline-block w-1.5 h-1.5 rounded-full bg-wait relative" />Pending</span>
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
                <td className="!text-right whitespace-nowrap">
                  {c.requestCancelled ? (
                    <span className="font-mono text-[10px] text-muted">READ-ONLY · WORKFLOW STOPPED</span>
                  ) : c.status === "PENDING" ? (
                    <button className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); openFile(c.id); }}>
                      Open file <Icon name="arrow-right" size={13} />
                    </button>
                  ) : (
                    <span className="font-mono text-[10px] text-muted">DECIDED</span>
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

      {active && deptInfo && !decision && (
        <DetailModal item={active} deptInfo={deptInfo} onClose={() => setActive(null)}
          onDecide={(action) => setDecision({ item: active, action })} />
      )}

      {decision && deptInfo && (
        <DecisionModal item={decision.item} action={decision.action} deptInfo={deptInfo}
          onClose={() => setDecision(null)} onDone={flashDone} />
      )}
    </Shell>
  );
}
