// client/src/utils/api.js
import axios from "axios";

// Host only (no /api yet)
export const API_HOST = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8080"
).replace(/\/+$/, "");

// Axios instance -> prefix with /api
const api = axios.create({
  baseURL: `${API_HOST}/api`,
  withCredentials: false,
});

// Attach token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("pf_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// helpers
// Use this for building non-/api URLs, e.g. /uploads/...
export const apiPath = (p = "") => `${API_HOST}${p}`;
export const imgUrl = (url) =>
  url?.startsWith("http") ? url : `${API_HOST}${url || ""}`;

// auth APIs
export const sendOtpAPI = (phone) => api.post("/auth/send-otp", { phone });
export const verifyOtpAPI = (phone, code) =>
  api.post("/auth/verify-otp", { phone, code });
export const getMeAPI = () => api.get("/auth/me");
export const updateProfileAPI = (payload) =>
  api.patch("/auth/profile", payload);

export default api;
