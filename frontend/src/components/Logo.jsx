// Wordmark — square checkmark seal + serif name. No decoration beyond geometry.
export default function Logo({ size = 22, sub }) {
  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <svg width={size + 4} height={size + 4} viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <rect x="1" y="1" width="26" height="26" className="fill-ink" rx="4" />
        <path d="M7.5 14.5 12 19 20.5 9.5" stroke="#f7f5ef" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="leading-none">
        <span className="display block" style={{ fontSize: size * 0.86, fontWeight: 650 }}>
          ClearVault
        </span>
        {sub && <span className="kicker block mt-1" style={{ fontSize: 9 }}>{sub}</span>}
      </span>
    </span>
  );
}
