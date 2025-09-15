// client/src/utils/api.js
import axios from "axios";

const RAW =
  (import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:8080")
    .toString()
    .trim();

export const API_BASE = RAW.replace(/\/+$/, "");

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    // ❌ removed "X-Requested-With": "XMLHttpRequest"
    // "Accept" is fine to omit (axios already sends it as a CORS-safelisted header)
  },
});

api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("pf_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {}
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      try { localStorage.removeItem("pf_token"); } catch {}
      window.dispatchEvent(new Event("pf:unauthorized"));
    }
    return Promise.reject(err);
  }
);

export default api;

export const apiPath = (p = "") => `${API_BASE}${p.startsWith("/") ? "" : "/"}${p}`;
export const imgUrl = (url) => (/^(https?:|data:|blob:|\/\/)/i.test(url || "")) ? url : `${API_BASE}${url?.startsWith("/") ? "" : "/"}${url || ""}`;

export const sendOtpAPI = (phone) => api.post("/api/auth/send-otp", { phone });
export const verifyOtpAPI = (phone, code) => api.post("/api/auth/verify-otp", { phone, code });
export const getMeAPI = () => api.get("/api/auth/me");
export const updateProfileAPI = (payload) => api.patch("/api/auth/profile", payload);
