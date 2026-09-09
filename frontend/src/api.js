const getApiBase = () => {
  const host = typeof window !== "undefined" ? window.location.hostname : "";

  if (!host || host === "localhost" || host === "127.0.0.1") {
    const envBase = (import.meta.env.VITE_API_URL || "").trim().replace(/\/$/, "");
    if (envBase && !/^http:\/\/(localhost|127\.0\.0\.1):4000$/i.test(envBase)) return envBase;
    return "http://localhost:4000";
  }

  if (/^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(host)) {
    return `http://${host}:4000`;
  }

  const envBase = (import.meta.env.VITE_API_URL || "").trim().replace(/\/$/, "");
  if (envBase) return envBase;
  return "https://clearvault-backend.onrender.com";
};

// Use the host that is actually serving the frontend, not a fixed localhost URL.
export async function api(path, { method = "GET", body } = {}) {
  const base = getApiBase();
  const url = path.startsWith("http") ? path : `${base}${path}`;
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });
  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) throw Object.assign(new Error(data?.error || `HTTP ${res.status}`), { status: res.status });
  return data;
}

export const relTime = (iso) => {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

export const fullDate = (iso) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
