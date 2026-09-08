import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, fullDate } from "../api.js";
import Icon, { DEPT_ICON } from "../icons.jsx";
import Shell from "../components/Shell.jsx";

/**
 * CombinedTCGraduation
 * When user clicks "TC & Graduation Clearance", they see two independent
 * service options: PUC Transfer Certificate and Graduation Clearance.
 * Each can be started separately.
 */

const SUBTYPE_INFO = {
  tc: {
    title: "PUC Transfer Certificate",
    shortTitle: "Transfer Certificate (TC)",
    description: "Migration to another institution — full institutional clearance from all nine offices.",
    requiredInfo: [
      "Institution details",
      "Course information",
      "Academic records",
      "Institutional approval",
    ],
    icon: "file-text",
  },
  graduation: {
    title: "Graduation Clearance",
    description: "Final-year clearance — every office signs off before the certificate is issued.",
    requiredInfo: [
      "Degree verification",
      "Academic records",
      "Department certifications",
      "Final institutional approval",
    ],
    icon: "grad-cap",
  },
};

function SubtypeCard({ subtype, onStart, existing, busy }) {
  const info = SUBTYPE_INFO[subtype];
  if (!info) return null;

  return (
    <div className="card p-6 mt-5">
      <div className="flex items-start gap-4 mb-4">
        <span className="w-12 h-12 border border-line-strong rounded-lg grid place-items-center text-brand shrink-0">
          <Icon name={info.icon} size={22} />
        </span>
        <div className="flex-1">
          <h2 className="display text-xl font-semibold">{info.title}</h2>
          <p className="text-[13px] text-muted mt-1 leading-relaxed">{info.description}</p>
        </div>
      </div>

      <div className="mt-5 pt-5 border-t border-line">
        <p className="kicker mb-3">Required information</p>
        <div className="space-y-2">
          {info.requiredInfo.map((item) => (
            <div key={item} className="flex items-center gap-2.5 text-[13px]">
              <span className="w-5 h-5 rounded-full border border-line-strong grid place-items-center text-brand shrink-0">
                <Icon name="check" size={12} />
              </span>
              <span className="text-muted">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {existing && existing[subtype] && (
        <div className="mt-5 pt-5 border-t border-line">
          <p className="kicker mb-2">Your current request</p>
          <p className="text-[13px] font-semibold">{existing[subtype].id.slice(-8).toUpperCase()}</p>
          <p className="text-[12px] text-muted mt-1">Filed {fullDate(existing[subtype].createdAt)}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="font-mono text-[10.5px] font-semibold text-muted tabular-nums border border-line rounded px-2 py-0.5">
              {existing[subtype].cleared}/{existing[subtype].total} cleared
            </span>
          </div>
        </div>
      )}

      <button
        onClick={() => onStart(subtype)}
        disabled={busy}
        className="btn btn-brand w-full mt-5 !py-3 justify-center"
      >
        <Icon name="send" size={15} />
        {busy ? "Routing your request…" : (existing && existing[subtype] ? "Continue request" : "Start request")}
      </button>
    </div>
  );
}

export default function CombinedTCGraduation() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [existing, setExisting] = useState({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    api("/api/auth/me")
      .then((d) => {
        if (d.user.role !== "STUDENT") return navigate("/login");
        setUser(d.user);
        loadRequests();
      })
      .catch(() => navigate("/login"));
  }, [navigate]);

  const loadRequests = async () => {
    try {
      const list = await api("/api/requests/list");
      const requests = list.requests || [];

      // Map legacy TC and Graduation purpose strings
      const tcRequests = requests.filter(
        (r) => r.purpose === "TC / Migration Clearance" || r.type === "tc"
      );
      const gradRequests = requests.filter(
        (r) => r.purpose === "Final Year / Graduation Clearance" || r.type === "graduation"
      );

      setExisting({
        tc: tcRequests.find((r) => r.overall !== "CANCELLED") || null,
        graduation: gradRequests.find((r) => r.overall !== "CANCELLED") || null,
      });
    } catch (e) {
      console.error("Failed to load requests:", e);
    }
  };

  const startSubtype = async (subtype) => {
    setBusy(true);
    setErr("");

    try {
      // Use the original type ID for the API
      const typeId = subtype; // "tc" or "graduation"
      await api("/api/requests", { method: "POST", body: { type: typeId } });
      // Navigate to the request detail view for that subtype
      navigate(`/student/request/${typeId}`);
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  if (!user) return null;

  return (
    <Shell user={user} roleLabel={user.rollNo || "Student"}>
      <Link to="/student" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-ink transition">
        <Icon name="arrow-left" size={14} /> All request types
      </Link>

      <div className="max-w-3xl mx-auto mt-8">
        <span className="w-12 h-12 border border-line-strong rounded-md grid place-items-center text-brand">
          <Icon name="book-open" size={24} />
        </span>
        <p className="kicker mt-5">Combined service</p>
        <h1 className="display text-3xl sm:text-4xl mt-2 font-semibold">TC & Graduation Clearance</h1>
        <p className="text-[14px] text-muted leading-relaxed mt-3 max-w-2xl">
          You can apply for your PUC Transfer Certificate and Graduation Clearance independently. Each is handled as a separate request with its own tracking and approval workflow.
        </p>

        {err && (
          <div className="mt-6 border border-bad/40 bg-bad/5 rounded-[10px] p-4 text-[13px] font-medium text-bad flex items-center gap-2.5">
            <Icon name="alert" size={16} /> {err}
          </div>
        )}

        {/* Section 1: PUC Transfer Certificate */}
        <div className="mt-10 pt-8 border-t border-line">
          <p className="kicker">Service 1 of 2</p>
          <SubtypeCard
            subtype="tc"
            existing={existing}
            onStart={startSubtype}
            busy={busy}
          />
        </div>

        {/* Section 2: Graduation Clearance */}
        <div className="mt-10 pt-8 border-t border-line">
          <p className="kicker">Service 2 of 2</p>
          <SubtypeCard
            subtype="graduation"
            existing={existing}
            onStart={startSubtype}
            busy={busy}
          />
        </div>

        {/* Both in progress info */}
        {existing.tc && existing.graduation && (
          <div className="mt-10 card p-5 border-brand/30 bg-brand/5">
            <div className="flex gap-3">
              <Icon name="info" size={17} className="text-brand shrink-0 mt-0.5" />
              <div>
                <p className="text-[13.5px] font-semibold text-brand">Both requests in progress</p>
                <p className="text-[12.5px] text-muted mt-1">
                  You can work on both services in parallel. Each has its own approval workflow and tracking. Visit the Dashboard to see the status of both.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
