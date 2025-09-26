// client/src/utils/api.js
import axios from "axios";

const RAW = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8080"
)
  .toString()
  .trim();

export const API_BASE = RAW.replace(/\/+$/, "");

/**
 * Default API client:
 * - Good for JSON requests (GET/POST/PATCH without files)
 * - 15s timeout (keeps UI snappy for product listing)
 */
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    // intentionally minimal; axios sets Accept by default
  },
});

/**
 * Upload API client:
 * - Intended ONLY for FormData/file uploads
 * - No default Content-Type (lets axios set multipart boundary automatically)
 * - 30s timeout to tolerate larger images / slower networks
 */
export const uploadApi = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
  timeout: 30000, // <- longer for uploads
  // no default headers here on purpose
});

// ----- Shared interceptors (token & 401 handling) -----
const attachAuth = (instance) => {
  instance.interceptors.request.use((config) => {
    try {
      const token = localStorage.getItem("pf_token");
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch {}
    return config;
  });

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

export default api;

// ---- tiny helpers (unchanged from your file) ----
export const apiPath = (p = "") =>
  `${API_BASE}${p.startsWith("/") ? "" : "/"}${p}`;

export const imgUrl = (url) =>
  /^(https?:|data:|blob:|\/\/)/i.test(url || "")
    ? url
    : `${API_BASE}${url?.startsWith("/") ? "" : "/"}${url || ""}`;

// ---- existing auth/profile APIs (kept as-is using json api) ----
export const sendOtpAPI = (phone) => api.post("/api/auth/send-otp", { phone });
export const verifyOtpAPI = (phone, code) =>
  api.post("/api/auth/verify-otp", { phone, code });
export const getMeAPI = () => api.get("/api/auth/me");
export const updateProfileAPI = (payload) =>
  api.patch("/api/auth/profile", payload);

// ---- OPTIONAL convenience helpers for uploads ----
// Use these only where you POST/PATCH FormData (e.g., product create/update).
// They ensure the 30s timeout and proper FormData handling without global header issues.
export const postMultipart = (url, formData, config = {}) =>
  uploadApi.post(url, formData, {
    // DO NOT set Content-Type here; axios will set multipart boundary automatically
    ...config,
  });

export const patchMultipart = (url, formData, config = {}) =>
  uploadApi.patch(url, formData, {
    // same note as above
    ...config,
  });
