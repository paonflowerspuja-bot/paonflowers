import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { sendOtpAPI, verifyOtpAPI, getMeAPI } from "../../utils/api";
import AuthForm from "../../components/AuthForm";

// Always normalize to E.164 (+971...) before calling the API
function normalizeUAEPhone(input) {
  const raw = String(input || "").replace(/\s+/g, "");
  if (raw.startsWith("+")) return raw;
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("971")) return `+${digits}`;
  if (digits.startsWith("05")) return `+971${digits.slice(1)}`;
  if (digits.startsWith("5")) return `+971${digits}`;
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
      const normalized = normalizeUAEPhone(formData.phone);
      if (!/^\+\d{10,15}$/.test(normalized))
        throw new Error("Please enter a valid UAE number");

      const res = await sendOtpAPI(normalized);
      const dbg = res?.data?.debugCode;
      if (dbg) setError(`OTP (dev): ${dbg}`); // visible during dev

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
      const phone = normalizeUAEPhone(formData.phone);
      console.log("VERIFY payload →", { phone, code }); // diag

      const res = await verifyOtpAPI(phone, code);
      const { token, user } = res?.data || {};
      if (!token) throw new Error("No token");

      localStorage.setItem("pf_token", token);

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
          {/* passing error shows dev OTP or validation message without style changes */}
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
