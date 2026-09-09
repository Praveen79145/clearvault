import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, relTime, fullDate } from "../api.js";
import Icon, { DEPT_ICON } from "../icons.jsx";
import Shell from "../components/Shell.jsx";

const OV = {
  IN_PROGRESS: ["badge-ink", "In progress"],
  ACTION_REQUIRED: ["badge-wait", "Action required"],
  COMPLETED: ["badge-good", "Completed"],
  CANCELLED: ["badge-bad", "Cancelled"],
};
const ACTION_LABEL = {
  REQUEST_CREATED: "Filed clearance request",
  REQUEST_CANCELLED: "Request cancelled by student",
  CLEARANCE_CLEARED: "Cleared with signature",
  CLEARANCE_APPROVED: "Approved with signature",
  CLEARANCE_REJECTED: "Rejected with comment",
  CLEARANCE_REAPPLIED: "Re-applied after resolving",
  CERTIFICATE_ISSUED: "Certificate issued",
  OFFICER_CREATED: "Officer account created",
  OFFICER_DISABLED: "Officer account disabled",
  OFFICER_ENABLED: "Officer account enabled",
};

/** Officer administration — create, assign office, disable/enable */
function OfficerPanel({ deptOptions }) {
  const [officers, setOfficers] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", dept: "FINANCE", password: "staff123" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgBad, setMsgBad] = useState(false);

  const load = useCallback(async () => {
    try { setOfficers((await api("/api/admin/officers")).officers); } catch { /* noop */ }
  }, []);
  useEffect(() => { load(); }, [load]);

  const create = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg("");
    try {
      await api("/api/admin/officers", { method: "POST", body: form });
      setMsg(`Officer account created: ${form.email} → ${form.dept}`);
      setMsgBad(false);
      setForm({ ...form, name: "", email: "" });
      load();
    } catch (err) { setMsg(err.message); setMsgBad(true); }
    setBusy(false);
  };

  const toggle = async (o) => {
    await api(`/api/admin/officers/${o.id}`, { method: "PUT", body: { disabled: !o.disabled } });
    load();
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="card p-0 overflow-hidden mt-6">
      <div className="px-5 pt-4 pb-3 flex items-baseline justify-between border-b border-line">
        <p className="kicker">Officer management</p>
        <p className="kicker !text-[9.5px]">{officers ? `${officers.length} officer accounts` : "loading…"}</p>
      </div>

      <div className="grid lg:grid-cols-5">
        {/* Create form */}
        <form onSubmit={create} className="lg:col-span-2 p-5 space-y-3 lg:border-r border-line">
          <p className="text-[13px] font-semibold flex items-center gap-2">
            <Icon name="user-plus" size={14} className="text-brand" /> Create officer account
          </p>
          <div>
            <label className="field">Full name</label>
            <input className="input" value={form.name} onChange={set("name")} placeholder="e.g. Dr. K. Varma" required />
          </div>
          <div>
            <label className="field">Campus email</label>
            <input className="input" type="email" value={form.email} onChange={set("email")} placeholder="physics@campus.edu" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field">Assigned office</label>
              <select className="input" value={form.dept} onChange={set("dept")}>
                {deptOptions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="field">Temporary password</label>
              <input className="input" value={form.password} onChange={set("password")} required />
            </div>
          </div>
          {msg && (
            <p className={`text-[12.5px] font-medium flex items-center gap-2 ${msgBad ? "text-bad" : "text-good"}`}>
              <Icon name={msgBad ? "alert" : "check"} size={13} /> {msg}
            </p>
          )}
          <button className="btn btn-primary w-full" disabled={busy}>
            {busy ? "Creating…" : "Create & assign office"}
          </button>
          <p className="kicker !text-[9px] leading-relaxed">
            Officer identity derives from the assigned office — dashboards, queues and authorization boundaries follow automatically.
          </p>
        </form>

        {/* Officers table */}
        <div className="lg:col-span-3 overflow-x-auto">
          <table className="rule-table min-w-[560px]">
            <thead>
              <tr><th>Officer</th><th>Office</th><th>Status</th><th className="!text-right">Control</th></tr>
            </thead>
            <tbody>
              {(officers || []).map((o) => (
                <tr key={o.id} className={o.disabled ? "opacity-50" : ""}>
                  <td>
                    <p className="font-semibold text-[13px]">{o.name}</p>
                    <p className="font-mono text-[11px] text-muted">{o.email}</p>
                  </td>
                  <td>
                    <p className="text-[12.5px] flex items-center gap-2">
                      <Icon name={DEPT_ICON[o.dept]} size={13} className="text-brand" /> {o.deptName}
                      <span className="text-muted">· {o.officerTitle}</span>
                    </p>
                  </td>
                  <td>
                    {o.disabled
                      ? <span className="badge badge-bad">Disabled</span>
                      : <span className="badge badge-good">Active</span>}
                  </td>
                  <td className="!text-right">
                    <button onClick={() => toggle(o)}
                      className={`btn btn-sm ${o.disabled ? "btn-outline" : "btn-bad-outline"}`}>
                      <Icon name={o.disabled ? "check" : "slash"} size={12} />
                      {o.disabled ? " Enable" : " Disable"}
                    </button>
                  </td>
                </tr>
              ))}
              {officers && officers.length === 0 && (
                <tr><td colSpan={4} className="!py-10 text-center text-[13px] text-muted">No officer accounts yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [audit, setAudit] = useState([]);
  const poll = useRef(false);

  const load = useCallback(async () => {
    try {
      const [s, a] = await Promise.all([api("/api/admin/stats"), api("/api/admin/audit")]);
      setStats(s); setAudit(a.audit);
    } catch { /* guarded below */ }
  }, []);

  useEffect(() => {
    api("/api/auth/me").then((d) => {
      if (d.user.role !== "ADMIN") return navigate("/login");
      setUser(d.user); load();
    }).catch(() => navigate("/login"));
    if (!poll.current) {
      poll.current = true;
      const t = setInterval(load, 6000);
      return () => clearInterval(t);
    }
  }, [navigate, load]);

  if (!user || !stats) return null;
  const { totals, deptStats, recentRequests } = stats;
  const bottleneck = deptStats.reduce((a, b) => (b.pending > a.pending ? b : a), deptStats[0]);

  const kpis = [
    ["Files received", totals.requests],
    ["Certificates issued", totals.completed],
    ["In progress", totals.inProgress],
    ["Awaiting student", totals.actionRequired],
    ["Avg. clearance", `${totals.avgHours}h`],
    ["Registered users", totals.students + totals.staff],
  ];

  return (
    <Shell user={user} roleLabel="Administrator">
      <div className="pb-6 border-b border-line flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker">Registrar's office · Live registry</p>
          <h1 className="display text-3xl sm:text-4xl mt-2 font-semibold">Clearance registry</h1>
        </div>
        <p className="kicker !text-[10px] flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-good pulse-dot" /> Refreshing every 6s
        </p>
      </div>

      {/* KPI strip — ruled cells, no cards-in-cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 border border-line rounded-[10px] bg-surface mt-6 overflow-hidden">
        {kpis.map(([label, value], i) => (
          <div key={label} className={`p-4 sm:p-5 ${i > 0 ? "border-l border-line" : ""} max-xl:[&:nth-child(4)]:border-l-0 max-sm:[&:nth-child(odd)]:border-l-0 max-sm:[&:nth-child(n+3)]:border-t max-xl:[&:nth-child(n+4)]:border-t max-xl:[&:nth-child(n+4)]:border-line max-sm:[&:nth-child(n+3)]:border-line`}>
            <p className="display text-[26px] font-semibold tabular-nums">{value}</p>
            <p className="kicker !text-[9.5px] mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6 mt-6">
        {/* Left: departments + recent files */}
        <div className="lg:col-span-3 space-y-6">
          <div className="card p-0 overflow-hidden">
            <div className="px-5 pt-4 pb-3 flex items-baseline justify-between">
              <p className="kicker">Office load</p>
              <p className="kicker !text-[9.5px]">Slowest desk: <span className="text-wait font-semibold">{bottleneck.name}</span></p>
            </div>
            <div className="border-t border-line divide-y divide-line">
              {deptStats.map((d) => {
                const total = d.pending + d.approved + d.rejected || 1;
                return (
                  <div key={d.id} className="px-5 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-[13.5px] font-semibold flex items-center gap-2.5">
                        <Icon name={DEPT_ICON[d.id]} size={15} className="text-brand" /> {d.name}
                        <span className="font-normal text-[11px] text-muted hidden sm:inline">· {d.officerTitle}</span>
                      </p>
                      <p className="font-mono text-[11px] text-muted tabular-nums">
                        <span className="text-good">{d.approved} ok</span> · <span className="text-bad">{d.rejected} ret</span> · <span className="text-wait">{d.pending} wait</span>
                      </p>
                    </div>
                    <div className="seg mt-2.5 !h-[7px] flex overflow-hidden">
                      <i className="h-full bg-good" style={{ width: `${(d.approved / total) * 100}%` }} />
                      <i className="h-full bg-bad" style={{ width: `${(d.rejected / total) * 100}%` }} />
                      <i className="h-full" style={{ width: `${(d.pending / total) * 100}%`, background: "color-mix(in srgb, var(--wait) 65%, transparent)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card p-0 overflow-hidden overflow-x-auto">
            <p className="kicker px-5 pt-4 pb-3">Recent files</p>
            <table className="rule-table min-w-[520px]">
              <thead><tr><th>Student</th><th>Purpose</th><th>Filed</th><th className="!text-right">Status</th></tr></thead>
              <tbody>
                {recentRequests.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <p className="font-semibold text-[13px]">{r.student.name}</p>
                      <p className="font-mono text-[11px] text-muted">{r.student.rollNo}</p>
                    </td>
                    <td className="text-[13px]">{r.purpose}</td>
                    <td className="text-[12.5px] text-muted">{relTime(r.createdAt)}</td>
                    <td className="!text-right"><span className={`badge ${OV[r.overall][0]}`}>{OV[r.overall][1]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: audit trail */}
        <div className="lg:col-span-2">
          <div className="card p-0 overflow-hidden">
            <div className="px-5 pt-4 pb-3 flex items-baseline justify-between border-b border-line">
              <p className="kicker">Audit trail</p>
              <Icon name="lock" size={13} className="text-muted" />
            </div>
            <div className="divide-y divide-line max-h-[560px] overflow-y-auto">
              {audit.map((a) => (
                <div key={a.id} className="px-5 py-3.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-[13px] font-semibold">{a.actorName}</p>
                    <p className="font-mono text-[10px] text-muted shrink-0" title={fullDate(a.createdAt)}>{relTime(a.createdAt)}</p>
                  </div>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-muted">
                    <span className="font-mono text-[10.5px] text-brand font-semibold">{ACTION_LABEL[a.action] || a.action}</span>
                    {" — "}{a.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <p className="kicker !text-[9.5px] mt-3 leading-relaxed">
            Entries are append-only — actor, office, previous → new status, comment and timestamp. Any dispute about who signed what can be settled from this register.
          </p>
        </div>
      </div>

      {/* Officer management */}
      <OfficerPanel deptOptions={deptStats} />
    </Shell>
  );
}
