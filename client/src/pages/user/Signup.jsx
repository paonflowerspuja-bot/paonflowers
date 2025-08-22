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

function normalizeUAEPhone(input) {
  const digits = (input || "").replace(/\D/g, "");
  if (digits.startsWith("971")) return `+${digits}`;
  if (digits.startsWith("05")) return `+971${digits.slice(1)}`;
  if (digits.startsWith("5")) return `+971${digits}`;
  if ((input || "").startsWith("+")) return input.replace(/\s+/g, "");
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
      const normalized = normalizeUAEPhone(formData.phone);
      if (!/^\+\d{10,15}$/.test(normalized))
        throw new Error("Please enter a valid UAE number");
      await sendOtpAPI(normalized);
      setFormData((f) => ({ ...f, phone: normalized }));
      setStep("code");
      setResendAt(Date.now() + 30_000);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to send OTP");
    } finally {
      setBusy(false);
    }
  };

  const onVerifyOtp = async () => {
    if ((formData.code || "").length !== 6)
      return setError("Enter the 6-digit code");
    setError("");
    try {
      setBusy(true);
      const { data } = await verifyOtpAPI(formData.phone, formData.code);
      const { token, user } = data || {};
      if (!token) throw new Error("No token");
      localStorage.setItem("pf_token", token);

      if (user?.profileComplete && user?.name && user?.location) {
        login(user);
        navigate("/");
      } else {
        setStep("details");
      }
    } catch (e) {
      setError(e?.response?.data?.message || "Invalid/expired OTP");
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
      const { data } = await getMeAPI();
      login(data?.user);
      navigate("/");
    } catch (e) {
      setError(e?.response?.data?.message || "Could not save details");
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
