import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, fullDate } from "../api.js";
import Icon from "../icons.jsx";
import Logo from "../components/Logo.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";

export default function Verify() {
  const { code } = useParams();
  const [state, setState] = useState({ loading: true, data: null, found: false });

  useEffect(() => {
    api(`/api/verify/${code}`)
      .then((data) => setState({ loading: false, data, found: true }))
      .catch(() => setState({ loading: false, data: null, found: false }));
  }, [code]);

  return (
    <div className="min-h-screen">
      <header className="border-b border-line">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/"><Logo sub="Public verification" /></Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-14">
        {state.loading ? (
          <p className="kicker">Checking the registry…</p>
        ) : state.found ? (
          <>
            <div className="flex items-start justify-between gap-4 pb-6 border-b border-line">
              <div>
                <p className="kicker">Registry lookup · {code}</p>
                <h1 className="display text-4xl sm:text-5xl mt-3 font-semibold">Authentic document</h1>
                <p className="text-[14px] text-muted mt-3 max-w-md leading-relaxed">
                  This certificate exists in the ClearVault registry, and every departmental signature
                  below matches the record exactly as it was issued.
                </p>
              </div>
              <span className="w-12 h-12 shrink-0 rounded-full border-2 border-good grid place-items-center text-good">
                <Icon name="check" size={22} strokeWidth={2.4} />
              </span>
            </div>

            <div className="card mt-8 overflow-hidden">
              <div className="px-5 py-4 border-b border-line flex flex-wrap gap-x-10 gap-y-2">
                <div>
                  <p className="kicker !text-[9.5px]">Issued to</p>
                  <p className="font-semibold text-[15px] mt-1">{state.data.student.name}</p>
                </div>
                <div>
                  <p className="kicker !text-[9.5px]">Roll number</p>
                  <p className="font-mono text-[13px] mt-1">{state.data.student.rollNo}</p>
                </div>
                <div>
                  <p className="kicker !text-[9.5px]">Purpose</p>
                  <p className="text-[13.5px] mt-1">{state.data.purpose}</p>
                </div>
                <div>
                  <p className="kicker !text-[9.5px]">Issued</p>
                  <p className="text-[13.5px] mt-1">{fullDate(state.data.issuedAt)}</p>
                </div>
              </div>
              <table className="rule-table">
                <thead><tr><th>Department</th><th>Signed by</th><th>Date</th><th className="!text-right">Signature</th></tr></thead>
                <tbody>
                  {state.data.signoffs.map((s) => (
                    <tr key={s.dept}>
                      <td className="font-semibold">{s.dept}</td>
                      <td className="text-muted">{s.approvedBy}</td>
                      <td className="text-muted">{fullDate(s.signedAt)}</td>
                      <td className="!text-right font-mono text-[10.5px] text-good">{s.signatureHash}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-[12px] text-muted leading-relaxed mt-5">
              Signatures are HMAC-SHA256 digests of roll number, department and signing time. Any edit
              to this document — a name, a date, a single character — would make these signatures fail
              against the registry copy.
            </p>
          </>
        ) : (
          <div className="text-center py-16">
            <span className="w-12 h-12 rounded-full border-2 border-bad grid place-items-center text-bad mx-auto">
              <Icon name="x" size={22} strokeWidth={2.4} />
            </span>
            <h1 className="display text-4xl mt-6 font-semibold">Not in the registry</h1>
            <p className="text-[14px] text-muted mt-3 max-w-sm mx-auto leading-relaxed">
              No certificate matches <span className="font-mono">{code}</span>. The document may be
              forged, revoked, or the code mistyped.
            </p>
            <Link to="/" className="btn btn-primary mt-8"><Icon name="arrow-left" size={14} /> ClearVault home</Link>
          </div>
        )}
      </main>
    </div>
  );
}
