import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { api, fullDate } from "../api.js";
import Icon from "../icons.jsx";
import Shell from "../components/Shell.jsx";
import CancelModal from "../components/CancelModal.jsx";

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

export default function Student() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [types, setTypes] = useState(null);      // null = loading
  const [requests, setRequests] = useState(null);
  const [loadErr, setLoadErr] = useState("");
  const [cancelTarget, setCancelTarget] = useState(null); // { id, purpose }
  const poll = useRef(false);
  const reduceMotion = useReducedMotion();

  const load = useCallback(async () => {
    const [t, l] = await Promise.all([api("/api/request-types"), api("/api/requests/list")]);
    setTypes(t.types);
    setRequests(l.requests);
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
      {/* ── Request selection ─────────────────────────────────── */}
      <div className="pb-6 border-b border-line">
        <p className="kicker">Student services</p>
        <h1 className="display text-3xl sm:text-4xl mt-2 font-semibold">Choose a request</h1>
        <p className="text-[14px] text-muted mt-2 max-w-xl leading-relaxed">
          Every request states exactly which offices must clear it — from a single desk to all nine.
          Each office reviews your file in parallel and signs with a cryptographic signature.
        </p>
      </div>

      {loadErr && (
        <div className="mt-6 border border-bad/40 bg-bad/5 rounded-[10px] p-4 text-[13px] font-medium text-bad flex items-center gap-2.5">
          <Icon name="alert" size={16} /> {loadErr}
        </div>
      )}

      {types === null && !loadErr && <CardSkeleton />}

      {types && types.length === 0 && (
        <div className="card mt-8 p-12 text-center">
          <Icon name="inbox" size={26} className="mx-auto text-muted" />
          <p className="font-semibold mt-3">No requests are currently available.</p>
          <p className="text-[13px] text-muted mt-1">Please check again later or contact the registrar's office.</p>
        </div>
      )}

      {types && types.length > 0 && (
        <motion.div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-8" initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.45, ease: "easeOut" }}>
          {types.map((t, i) => {
            const existing = latestByType[t.id];
            return (
              <motion.div
                key={t.id}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.42, delay: i * 0.06, ease: "easeOut" }}
              >
                <Link to={`/student/request/${t.id}`} className="req-card group">
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
              </motion.div>
            );
          })}
        </motion.div>
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
          <motion.div className="card mt-5 overflow-hidden" initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: "easeOut" }}>
            <div className="divide-y divide-line">
              {requests.map((r, idx) => (
                <motion.div
                  key={r.id}
                  className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-4"
                  initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: idx * 0.06, ease: "easeOut" }}
                >
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
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {cancelTarget && (
        <CancelModal request={cancelTarget} onClose={() => setCancelTarget(null)} onDone={() => { setCancelTarget(null); load(); }} />
      )}
    </Shell>
  );
}
