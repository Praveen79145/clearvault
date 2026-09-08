import Icon from "../icons.jsx";

/**
 * DepartmentTracker
 * Displays a horizontal step-by-step department workflow tracker.
 * Shows department names, status indicators, and visual connectors.
 */
export default function DepartmentTracker({ clearances, requestType, overall, compact = false }) {
  if (!clearances || clearances.length === 0) {
    return null;
  }

  // Map status to display info
  const statusInfo = (status) => {
    switch (status) {
      case "APPROVED":
        return { label: "Approved", color: "text-good", bg: "bg-good/10", icon: "check", dotClass: "bg-good" };
      case "REJECTED":
        return { label: "Rejected", color: "text-bad", bg: "bg-bad/10", icon: "x", dotClass: "bg-bad" };
      case "PENDING":
        return { label: "Pending", color: "text-wait", bg: "bg-wait/10", icon: "clock", dotClass: "bg-wait" };
      default:
        return { label: "Pending", color: "text-wait", bg: "bg-wait/10", icon: "circle", dotClass: "bg-wait" };
    }
  };

  if (compact) {
    const items = [];
    let foundActive = false;
    
    for (let i = 0; i < clearances.length; i++) {
       const c = clearances[i];
       let s = c.status;
       if (s === "REJECTED") {
           foundActive = true; 
       } else if (s === "PENDING") {
           if (!foundActive && overall !== "CANCELLED") {
               s = "CURRENT";
               foundActive = true;
           }
       }
       const deptShort = (c.deptName || "").replace(/( Office| Lab)$/, "");
       items.push({ id: c.id, name: deptShort, visualStatus: s, originalStatus: c.status });
    }
    
    // Append terminal Certificate step for applicable forms
    if (requestType === "study-certificate" || requestType === "no-due-certificate") {
         let s = "PENDING";
         if (overall === "COMPLETED") s = "COMPLETED";
         else if (!foundActive && overall !== "CANCELLED") {
             s = "CURRENT";
             foundActive = true;
         }
         items.push({ id: "cert-step", name: "Certificate", visualStatus: s });
    }

    const getCompactVisual = (vStatus) => {
        switch(vStatus) {
           case "APPROVED": return { label: "Approved", icon: <Icon name="check" size={11} className="text-good" />, bg: "bg-good/10", color: "text-good" };
           case "REJECTED": return { label: "Action Req", icon: <Icon name="x" size={10} className="text-bad" />, bg: "bg-bad/10", color: "text-bad" };
           case "CURRENT": return { label: "Under Review", icon: <div className="w-1.5 h-1.5 rounded-full bg-wait" />, bg: "bg-wait/10", color: "text-wait" };
           case "COMPLETED": return { label: "Ready", icon: <Icon name="check" size={11} className="text-brand" />, bg: "bg-brand/10", color: "text-brand" };
           case "PENDING":
           default: return { label: "Pending", icon: <div className="w-1.5 h-1.5 rounded-full border border-current opacity-40" />, bg: "bg-transparent", color: "text-muted" };
        }
    };

    return (
      <div className="flex items-start overflow-x-auto pb-2 pt-1 scrollbar-hide">
        {items.map((item, idx) => {
          const vis = getCompactVisual(item.visualStatus);
          return (
            <div key={item.id} className="flex items-start">
              <div className="flex flex-col items-center">
                {/* Stage Headline — Inter body weight, same as card body text */}
                <div className="flex items-center gap-1.5 whitespace-nowrap px-1">
                  <span className="text-[13px] font-medium text-ink leading-none">{item.name}</span>
                  <div className={`w-4 h-4 rounded-full grid place-items-center shrink-0 ${vis.bg}`}>
                    {vis.icon}
                  </div>
                </div>
                {/* Status label — kicker/badge mono style, matching .badge and .kicker */}
                <span
                  className={`font-mono text-[10px] font-semibold uppercase tracking-[0.12em] mt-1.5 ${vis.color}`}
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {vis.label}
                </span>
              </div>

              {/* Connecting rule — matches .rule-table separator weight */}
              {idx < items.length - 1 && (
                <div className="w-6 sm:w-8 h-[1px] bg-line-strong mt-[9px] mx-1 shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Full vertical/detailed version for RequestView
  return (
    <div className="card p-6 mt-6">
      <p className="kicker mb-5">Department Approval Workflow</p>
      
      <div className="space-y-4">
        {clearances.map((c, idx) => {
          const status = statusInfo(c.status);
          const deptShort = (c.deptName || "").replace(/( Office| Lab)$/, "");

          return (
            <div key={c.id}>
              {/* Step row */}
              <div className="flex items-start gap-4">
                {/* Status indicator */}
                <div className="flex flex-col items-center pt-1">
                  <div
                    className={`w-8 h-8 rounded-full border-2 border-line-strong grid place-items-center shrink-0 ${status.bg}`}
                    title={`${deptShort}: ${status.label}`}
                  >
                    {c.status === "APPROVED" ? (
                      <Icon name="check" size={16} className="text-good" />
                    ) : c.status === "REJECTED" ? (
                      <Icon name="x" size={16} className="text-bad" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-wait animate-pulse" />
                    )}
                  </div>
                  {/* Connector line */}
                  {idx < clearances.length - 1 && (
                    <div className="w-0.5 bg-line-strong mt-2" style={{ height: "60px" }} aria-hidden="true" />
                  )}
                </div>

                {/* Department info */}
                <div className="flex-1 pt-1.5 pb-2">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <p className="font-semibold text-[14px]">{deptShort}</p>
                    <span className={`badge !text-[9px] ${status.color} bg-transparent border border-current`}>
                      {status.label}
                    </span>
                  </div>
                  <p className="kicker !text-[8.5px] mt-1">{c.officerTitle}</p>

                  {/* Status details */}
                  <div className="mt-2 text-[13px] text-muted leading-relaxed">
                    {c.status === "APPROVED" && (
                      <>
                        <p className="text-good font-medium">✓ Cleared</p>
                        <p className="text-[12px] mt-1">
                          Approved by <b className="text-ink">{c.approvedBy}</b>
                        </p>
                        {c.remarks && (
                          <p className="text-[12.5px] mt-1 italic text-ink">&ldquo;{c.remarks}&rdquo;</p>
                        )}
                      </>
                    )}
                    {c.status === "REJECTED" && (
                      <>
                        <p className="text-bad font-medium">⚠ Due / Action Required</p>
                        <p className="text-[12px] mt-1">
                          Returned by <b className="text-ink">{c.approvedBy || "Officer"}</b>
                        </p>
                        {c.remarks && (
                          <p className="text-bad text-[12.5px] mt-1 font-medium">&ldquo;{c.remarks}&rdquo;</p>
                        )}
                      </>
                    )}
                    {c.status === "PENDING" && (
                      <p className="flex items-center gap-2 text-muted">
                        <span className="w-1.5 h-1.5 rounded-full bg-wait" /> Under review
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
