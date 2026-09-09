// Thin fetch wrapper — uses VITE_API_URL when provided, otherwise relies on
// Vite dev-server proxy for local development.
const API_URL = import.meta.env.VITE_API_URL || "";
export async function api(path, { method = "GET", body } = {}) {
  const url = API_URL ? `${API_URL.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}` : path;
  const credentials = API_URL ? "include" : "same-origin"; // include for cross-origin session cookies
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials,
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
