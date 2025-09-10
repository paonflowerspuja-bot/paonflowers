const BASE = (import.meta.env.VITE_API_URL || "http://localhost:8080").replace(/\/+$/, "") + "/api";
export const api = {
  async get(p, init) {
    const r = await fetch(`${BASE}${p}`, init);
    if (!r.ok) throw await r.json();
    return r.json();
  },
  async post(p, data) {
    const r = await fetch(`${BASE}${p}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }, // no auth for now
      body: JSON.stringify(data),
    });
    if (!r.ok) throw await r.json();
    return r.json();
  },
  async put(p, data) {
    const r = await fetch(`${BASE}${p}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!r.ok) throw await r.json();
    return r.json();
  },
  async patch(p, data) {
    const r = await fetch(`${BASE}${p}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!r.ok) throw await r.json();
    return r.json();
  },
  async del(p) {
    const r = await fetch(`${BASE}${p}`, { method: "DELETE" });
    if (!r.ok) throw await r.json();
    return r.json();
  },
};
