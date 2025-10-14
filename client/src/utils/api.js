// client/src/utils/api.js
import axios from "axios";

// ---------- BASE URL SETUP ----------
const RAW = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8080"
)
  .toString()
  .trim();

export const API_BASE = RAW.replace(/\/+$/, "");

// ---------- PRIMARY API CLIENT ----------
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ---------- UPLOAD CLIENT ----------
export const uploadApi = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
  timeout: 30000, // for uploads
});

// ---------- AUTH TOKEN INTERCEPTORS ----------
const attachAuth = (instance) => {
  // ✅ Always attach token from localStorage if available
  instance.interceptors.request.use((config) => {
    try {
      const token = localStorage.getItem("pf_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn("Token attach failed:", e);
    }
    return config;
  });

  // ✅ Handle unauthorized errors globally
  instance.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err?.response?.status === 401) {
        try {
          localStorage.removeItem("pf_token");
        } catch {}
        window.dispatchEvent(new Event("pf:unauthorized"));
      }
      return Promise.reject(err);
    }
  );
};

attachAuth(api);
attachAuth(uploadApi);

// ---------- EXPORT DEFAULT API INSTANCE ----------
export default api;

// ---------- PATH HELPERS ----------
export const apiPath = (p = "") =>
  `${API_BASE}${p.startsWith("/") ? "" : "/"}${p}`;

export const imgUrl = (url) =>
  /^(https?:|data:|blob:|\/\/)/i.test(url || "")
    ? url
    : `${API_BASE}${url?.startsWith("/") ? "" : "/"}${url || ""}`;

// ---------- AUTH / PROFILE ENDPOINTS ----------
export const sendOtpAPI = (phone) => api.post("/api/auth/send-otp", { phone });
export const verifyOtpAPI = (phone, code) =>
  api.post("/api/auth/verify-otp", { phone, code });

// ✅ Now always sends token via interceptor → no need to pass manually
export const getMeAPI = () => api.get("/api/auth/me");
export const updateProfileAPI = (payload) =>
  api.patch("/api/auth/profile", payload);

// ---------- OPTIONAL HELPERS FOR FILE UPLOADS ----------
export const postMultipart = (url, formData, config = {}) =>
  uploadApi.post(url, formData, {
    ...config, // no manual Content-Type
  });

export const patchMultipart = (url, formData, config = {}) =>
  uploadApi.patch(url, formData, {
    ...config,
  });
