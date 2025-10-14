import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  sendOtpAPI,
  verifyOtpAPI,
  updateProfileAPI,
  getMeAPI,
} from "../../utils/api";
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

export default function Signup() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const completing = params.get("complete") === "1";

  const [step, setStep] = useState(completing ? "details" : "phone"); // phone | code | details
  const [formData, setFormData] = useState({
    phone: "",
    code: "",
    name: "",
    email: "",
    location: "",
    dob: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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
      const dbg = res?.data?.debugCode;
      if (dbg && import.meta.env.MODE !== "production") {
        setError(`OTP (dev): ${dbg}`);
      }

      setFormData((f) => ({ ...f, phone: normalized }));
      setStep("code");
      setResendAt(Date.now() + 30_000);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Failed to send OTP");
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

      const phone = normalizePhone(formData.phone);
      const res = await verifyOtpAPI(phone, code);
      const { token, user } = res?.data || {};
      if (!token) throw new Error("No token");

      localStorage.setItem("pf_token", token);

      // Admin straight to /admin
      if (user?.isAdmin) {
        login(user);
        return navigate("/admin");
      }

      if (user?.profileComplete && user?.name && user?.location) {
        login(user);
        navigate("/");
      } else {
        setStep("details");
      }
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Invalid/expired OTP");
    } finally {
      setBusy(false);
    }
  };

  const onSaveDetails = async () => {
    setError("");
    try {
      setBusy(true);
      await updateProfileAPI({
        name: formData.name,
        email: formData.email,
        location: formData.location,
        dob: formData.dob,
      });
      const res = await getMeAPI();
      const u = res?.data?.user || null;
      login(u);
      navigate(u?.isAdmin ? "/admin" : "/");
    } catch (e) {
      setError(e?.response?.data?.error || "Could not save details");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-5">
          <AuthForm
            type="signup"
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
            onSaveDetails={onSaveDetails}
          />
        </div>
      </div>
    </div>
  );
}
