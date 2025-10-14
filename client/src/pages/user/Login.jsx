import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { sendOtpAPI, verifyOtpAPI, getMeAPI } from "../../utils/api";
import AuthForm from "../../components/AuthForm";

// ✅ Accept India (+91) and UAE (+971), return E.164
function normalizePhone(input) {
  const raw = String(input || "").replace(/\s+/g, "");
  if (raw.startsWith("+")) return raw; // already normalized
  const digits = raw.replace(/\D/g, "");

  // UAE patterns
  if (digits.startsWith("971")) return `+${digits}`;
  if (digits.startsWith("05")) return `+971${digits.slice(1)}`;
  if (digits.startsWith("5")) return `+971${digits}`;

  // India patterns
  if (digits.startsWith("91")) return `+${digits}`;
  if (/^[6-9]\d{9}$/.test(digits)) return `+91${digits}`;

  // fallback
  return `+${digits}`;
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState("phone"); // phone | code
  const [formData, setFormData] = useState({ phone: "", code: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // resend timer
  const [resendAt, setResendAt] = useState(0);
  const resendIn = Math.max(0, Math.ceil((resendAt - Date.now()) / 1000));
  useEffect(() => {
    const id = setInterval(() => {
      if (resendAt && Date.now() >= resendAt) setResendAt(0);
    }, 500);
    return () => clearInterval(id);
  }, [resendAt]);

  const onSendOtp = async () => {
    setError("");
    try {
      setBusy(true);
      const normalized = normalizePhone(formData.phone);
      if (!/^\+\d{10,15}$/.test(normalized))
        throw new Error("Please enter a valid phone number (India or UAE)");

      const res = await sendOtpAPI(normalized);
      // Show debug OTP ONLY in non-production builds
      const dbg = res?.data?.debugCode;
      if (dbg && import.meta.env.MODE !== "production") {
        setError(`OTP (dev): ${dbg}`);
      }

      // store normalized phone so verify uses the exact same value
      setFormData((f) => ({ ...f, phone: normalized }));
      setStep("code");
      setResendAt(Date.now() + 30_000);
    } catch (e) {
      setError(e?.data?.error || e?.message || "Failed to send OTP");
    } finally {
      setBusy(false);
    }
  };

  const onVerifyOtp = async () => {
    const code = String(formData.code || "").replace(/\D/g, "");
    if (code.length !== 6) return setError("Enter the 6-digit code");
    setError("");

    try {
      setBusy(true);

      // Always re-normalize just in case user went back and edited
      const phone = normalizePhone(formData.phone);
      const res = await verifyOtpAPI(phone, code);
      const { token, user } = res?.data || {};
      if (!token) throw new Error("No token");

      localStorage.setItem("pf_token", token);

      // fetch latest profile
      const me = await getMeAPI().catch(() => ({ data: {} }));
      const u = me?.data?.user || user;

      // log into context
      login(u);

      // Admin → /admin; others → profile completion or home
      if (u?.isAdmin) {
        navigate("/admin");
      } else if (!u?.profileComplete || !u?.name || !u?.location) {
        navigate("/signup?complete=1");
      } else {
        navigate("/");
      }
    } catch (e) {
      setError(e?.data?.error || e?.message || "Invalid/expired OTP");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-5">
          <AuthForm
            type="login"
            step={step}
            formData={formData}
            setFormData={setFormData}
            error={error}
            busy={busy}
            resendIn={resendIn}
            onSendOtp={onSendOtp}
            onVerifyOtp={onVerifyOtp}
            onResend={onSendOtp}
            onBackToPhone={() => setStep("phone")}
          />
        </div>
      </div>
    </div>
  );
}
