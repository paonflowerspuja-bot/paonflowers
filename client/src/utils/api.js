// client/src/utils/api.js
import axios from "axios";

export const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("pf_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("pf_token");
      window.dispatchEvent(new Event("pf:unauthorized"));
    }
    return Promise.reject(err);
  }
);

export default api;

/** Small helpers for consistent URLs */
export const apiPath = (p = "") => `${API_BASE}${p}`;
export const imgUrl = (url) =>
  url?.startsWith("http") ? url : `${API_BASE}${url || ""}`;

// ---- add below your existing code in utils/api.js ----
export const sendOtpAPI = (phone) => api.post("/api/auth/send-otp", { phone });

export const verifyOtpAPI = (phone, code) =>
  api.post("/api/auth/verify-otp", { phone, code });

export const getMeAPI = () => api.get("/api/auth/me");

export const updateProfileAPI = (payload) =>
  api.patch("/api/auth/profile", payload);
