import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import QRCode from "qrcode";
import { api, fullDate } from "../api.js";
import Icon, { DEPT_ICON } from "../icons.jsx";

/** Registry stamp — circular type on a path, the way a real seal reads */
function Stamp({ size = 118 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" aria-hidden="true" className="text-[#0a513c]">
      <defs>
        <path id="stamp-arc" d="M 60,60 m -42,0 a 42,42 0 1,1 84,0 a 42,42 0 1,1 -84,0" />
      </defs>
      <circle cx="60" cy="60" r="56" stroke="currentColor" strokeWidth="2.2" />
      <circle cx="60" cy="60" r="50.5" stroke="currentColor" strokeWidth="0.9" />
      <circle cx="60" cy="60" r="31" stroke="currentColor" strokeWidth="0.9" />
      <text fill="currentColor" fontSize="8.6" fontFamily="IBM Plex Mono, monospace" fontWeight="600" letterSpacing="2.6">
        <textPath href="#stamp-arc">CLEARVAULT · REGISTRAR OF STUDENT AFFAIRS ·</textPath>
      </text>
      <path d="M47 61.5 56.5 71 74 51" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <text x="60" y="86" textAnchor="middle" fill="currentColor" fontSize="7.5" fontFamily="IBM Plex Mono, monospace" fontWeight="600" letterSpacing="2.4">
        NO DUES
      </text>
    </svg>
  );
}

export default function Certificate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [qr, setQr] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const me = await api("/api/auth/me");
        setUser(me.user);
        const d = await api("/api/requests/mine");
        if (!d.request || d.request.id !== id || d.overall !== "COMPLETED") {
          setError("Certificate is not yet available for this request.");
          return;
        }
        setData(d);
        const url = `${location.origin}/verify/${d.request.certificateCode}`;
        setQr(await QRCode.toDataURL(url, { margin: 0, width: 200, color: { dark: "#1b211d", light: "#fffefb" } }));
      } catch {
        navigate("/login");
      }
    })();
  }, [id, navigate]);

  if (error)
    return (
      <div className="min-h-screen grid place-items-center p-6 text-center">
        <div>
          <Icon name="alert" size={30} className="mx-auto text-wait" />
          <p className="mt-4 font-semibold">{error}</p>
          <button onClick={() => navigate("/student")} className="btn btn-outline mt-5"><Icon name="arrow-left" size={14} /> Back to tracker</button>
        </div>
      </div>
    );
  if (!data || !user) return null;

  const { request, clearances } = data;
  const issued = new Date(request.completedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen print-area py-8 px-4">
      {/* Toolbar */}
      <div className="no-print max-w-[880px] mx-auto mb-6 flex items-center justify-between">
        <button onClick={() => navigate("/student")} className="btn btn-outline btn-sm">
          <Icon name="arrow-left" size={14} /> Tracker
        </button>
        <div className="flex gap-2">
          <Link to={`/verify/${request.certificateCode}`} target="_blank" className="btn btn-outline btn-sm">
            <Icon name="qr-code" size={14} /> Open verify link
          </Link>
          <button onClick={() => window.print()} className="btn btn-primary btn-sm">
            <Icon name="printer" size={14} /> Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Sheet */}
      <div className="cert-sheet cert-rule-outer max-w-[880px] mx-auto rounded-sm p-[5px] shadow-xl">
        <div className="cert-rule-inner px-7 sm:px-12 py-10 sm:py-14">
          {/* Head */}
          <div className="text-center">
            <Stamp size={104} />
            <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#66716b] mt-5">
              ClearVault · Registrar of Student Affairs
            </p>
            <h1 className="display text-[#1b211d] text-4xl sm:text-[44px] mt-2" style={{ fontWeight: 650 }}>
              Certificate of No Dues
            </h1>
            <p className="font-mono text-[11px] text-[#66716b] mt-2 tabular-nums">No. {request.certificateCode}</p>
          </div>

          {/* Body copy */}
          <div className="text-center mt-9">
            <p className="text-[13px] text-[#66716b]">This is to certify that</p>
            <p className="display text-[#1b211d] text-3xl sm:text-4xl mt-2 font-semibold">{user.name}</p>
            <p className="font-mono text-[12px] text-[#66716b] mt-1.5">Roll No. {user.rollNo}</p>
            <p className="text-[13.5px] leading-relaxed text-[#3c453f] max-w-[560px] mx-auto mt-6">
              has been examined against the registers of the departments named below under the process
              tituled <b>“{request.purpose}”</b>, and stands <b>free of every due</b> to the institution
              as on the date of issue. Each department recorded its clearance digitally; the signatures
              beneath are cryptographic and verifiable.
            </p>
          </div>

          {/* Signatures table */}
          <table className="w-full border-collapse mt-10 text-[12.5px]">
            <thead>
              <tr className="text-left font-mono text-[9.5px] tracking-[0.14em] uppercase text-[#66716b]">
                <th className="border-y border-[#1b211d] py-2.5 pr-3 font-semibold">Department</th>
                <th className="border-y border-[#1b211d] py-2.5 pr-3 font-semibold">Signed by</th>
                <th className="border-y border-[#1b211d] py-2.5 pr-3 font-semibold">Date</th>
                <th className="border-y border-[#1b211d] py-2.5 font-semibold text-right">Digital signature</th>
              </tr>
            </thead>
            <tbody>
              {clearances.map((c) => (
                <tr key={c.id}>
                  <td className="border-b border-[#d9d4c4] py-2.5 pr-3 font-semibold text-[#1b211d] flex items-center gap-2">
                    <Icon name={DEPT_ICON[c.dept]} size={14} className="text-[#0a513c]" /> {c.deptName}
                  </td>
                  <td className="border-b border-[#d9d4c4] py-2.5 pr-3 display italic text-[#3c453f]">{c.approvedBy}</td>
                  <td className="border-b border-[#d9d4c4] py-2.5 pr-3 text-[#3c453f]">{fullDate(c.signedAt)}</td>
                  <td className="border-b border-[#d9d4c4] py-2.5 text-right">
                    <span className="cert-hash text-[#0a513c]">{c.signatureHash}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer row */}
          <div className="flex flex-wrap items-end justify-between gap-8 mt-12">
            <div>
              <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#66716b]">Date of issue</p>
              <p className="text-[14px] font-semibold text-[#1b211d] mt-1">{issued}</p>
              <p className="text-[11px] leading-relaxed text-[#66716b] mt-4 max-w-[300px]">
                Self-verifying document: scan the code or open{" "}
                <span className="font-mono">…/verify/{request.certificateCode}</span> to authenticate
                against the registry.
              </p>
            </div>
            {qr && (
              <div className="text-center">
                <img src={qr} alt="Verification QR code" width={92} height={92} className="border border-[#d9d4c4] p-1.5" />
                <p className="font-mono text-[8.5px] tracking-[0.22em] uppercase text-[#66716b] mt-1.5">Scan to verify</p>
              </div>
            )}
            <div className="text-center">
              <p className="display italic text-xl text-[#1b211d]">Registrar</p>
              <div className="w-40 border-t border-[#1b211d] mt-1.5 pt-1.5">
                <p className="font-mono text-[8.5px] tracking-[0.22em] uppercase text-[#66716b]">Digitally countersigned</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="no-print text-center kicker !text-[9.5px] mt-6">
        Choose “Save as PDF” in the print dialog for an archival copy.
      </p>
    </div>
  );
}
