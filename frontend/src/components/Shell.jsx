import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, relTime } from "../api.js";
import Icon from "../icons.jsx";
import Logo from "./Logo.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

function NotifBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const started = useRef(false);

  const load = useCallback(async () => {
    try {
      const d = await api("/api/notifications");
      setItems(d.notifications);
      setUnread(d.unread);
    } catch { /* logged out */ }
  }, []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [load]);

  const toggleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next && unread) {
      await api("/api/notifications/read-all", { method: "PUT" });
      setUnread(0);
      load();
    }
  };

  return (
    <div className="relative">
      <button onClick={toggleOpen} className="btn btn-outline btn-sm !px-2.5 relative" aria-label="Notifications">
        <Icon name="bell" size={15} />
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-bad text-white text-[9.5px] font-bold grid place-items-center">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="card absolute right-0 mt-2 w-[330px] z-40 max-h-[420px] overflow-y-auto !rounded-lg">
            <p className="kicker px-4 pt-3 pb-2">Notifications</p>
            <div className="border-t border-line">
              {items.length === 0 && <p className="text-sm text-muted p-4">Nothing yet.</p>}
              {items.map((n) => (
                <div key={n.id} className="px-4 py-3 border-b border-line last:border-0">
                  <p className="text-[13px] leading-snug flex gap-2.5">
                    <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${n.type === "success" ? "bg-good" : n.type === "danger" ? "bg-bad" : "bg-brand"}`} />
                    <span>{n.message}</span>
                  </p>
                  <p className="kicker mt-1.5 !text-[9.5px] pl-4">{relTime(n.createdAt)}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function Shell({ user, roleLabel, children }) {
  const navigate = useNavigate();
  const logout = async () => {
    await api("/api/auth/logout", { method: "POST" });
    navigate("/login");
  };
  const initials = user?.name?.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen">
      <header className="no-print sticky top-0 z-30 bg-paper/95 backdrop-blur border-b border-line">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <Link to="/" aria-label="Home"><Logo sub="Registrar e-Clearance" /></Link>
          <div className="flex items-center gap-2">
            <NotifBell />
            <ThemeToggle />
            <div className="hidden md:block h-5 w-px bg-line mx-1" />
            <div className="hidden md:flex items-center gap-2.5">
              <span className="text-right leading-tight">
                <span className="block text-[13px] font-semibold">{user?.name}</span>
                <span className="kicker block !text-[9.5px]">{roleLabel}</span>
              </span>
              {user?.picture ? (
                <img src={user.picture} alt="" referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full border border-line object-cover" />
              ) : (
                <span className="w-8 h-8 rounded-full bg-ink text-paper text-[11px] font-bold grid place-items-center">
                  {initials}
                </span>
              )}
            </div>
            <button onClick={logout} className="btn btn-outline btn-sm">
              <Icon name="log-out" size={14} /> <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">{children}</main>
    </div>
  );
}
