import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { api } from "../api.js";
import Icon from "../icons.jsx";

/**
 * Cancellation confirmation dialog — spec-compliant two-step:
 * "Cancel this request?" → optional reason → [Keep Request] / [Cancel Request].
 * The destructive action is visually distinct (solid red).
 */
export default function CancelModal({ request, onClose, onDone }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const reduceMotion = useReducedMotion();

  const submit = async () => {
    setBusy(true); setErr("");
    try {
      await api(`/api/requests/${request.id}/cancel`, { method: "POST", body: { reason: reason.trim() } });
      onDone();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/55"
        onClick={() => !busy && onClose()}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <motion.div
          className="card w-full max-w-md p-0 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          initial={reduceMotion ? false : { opacity: 0, scale: 0.97, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.97, y: 8 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="px-6 pt-5 pb-4 border-b border-line flex items-center justify-between">
            <p className="display text-xl font-semibold">Cancel this request?</p>
            <button onClick={onClose} className="text-muted hover:text-ink transition" aria-label="Close">
              <Icon name="x" size={17} />
            </button>
          </div>
          <div className="p-6">
            <p className="text-[13.5px] leading-relaxed text-muted">
              Are you sure you want to cancel <b className="text-ink">{request.purpose}</b>
              {" "}<span className="font-mono text-[11px]">#{request.id.slice(-8).toUpperCase()}</span>?
              This action will stop the current clearance workflow. Approvals already recorded stay on
              the ledger for audit, but no further sign-offs — and no certificate — can follow.
            </p>

            <div className="mt-5">
              <label className="field">
                Reason for cancellation <span className="text-muted normal-case tracking-normal font-normal">(optional)</span>
              </label>
              <textarea className="input" rows={2} value={reason} onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. I submitted the request by mistake" />
              <p className="kicker !text-[9px] mt-1.5">Stored with the cancellation record — visible to officers and the audit trail.</p>
            </div>

            {err && <p className="mt-3 text-[13px] font-medium text-bad flex items-center gap-2"><Icon name="alert" size={15} />{err}</p>}

            <div className="flex gap-2.5 mt-6">
              <button onClick={onClose} disabled={busy} className="btn btn-outline flex-1">Keep request</button>
              <button onClick={submit} disabled={busy}
                className="btn flex-1 !bg-bad !text-white hover:brightness-110 border-transparent">
                {busy ? "Cancelling…" : <><Icon name="x" size={14} /> Cancel request</>}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
