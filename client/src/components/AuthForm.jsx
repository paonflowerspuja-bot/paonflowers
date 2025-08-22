import React, { useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";

const EMIRATES = [
  "Dubai",
  "Abu Dhabi",
  "Sharjah",
  "Ajman",
  "Umm Al Quwain",
  "Ras Al Khaimah",
  "Fujairah",
];

function OtpBoxes({ value = "", onChange, disabled }) {
  const len = 6;
  const inputsRef = useRef([]);

  useEffect(() => {
    if (inputsRef.current[0]) inputsRef.current[0].focus();
  }, []);

  const setDigit = (i, v) => {
    const d = v.replace(/\D/g, "").slice(0, 1);
    const chars = value.split("");
    chars[i] = d || "";
    onChange(chars.join(""));
    if (d && i < len - 1) inputsRef.current[i + 1]?.focus();
  };

  const onKeyDown = (i, e) => {
    if (e.key === "Backspace" && !value[i] && i > 0) {
      inputsRef.current[i - 1]?.focus();
    }
  };

  return (
    <div
      className="otp-row"
      style={{ display: "flex", gap: 8, justifyContent: "center" }}
    >
      {Array.from({ length: len }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (inputsRef.current[i] = el)}
          className="otp-box"
          style={{
            width: 48,
            height: 56,
            textAlign: "center",
            fontSize: 22,
            fontWeight: 600,
          }}
          maxLength={1}
          inputMode="numeric"
          value={value[i] || ""}
          onChange={(e) => setDigit(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

/**
 * Props:
 * - type: "login" | "signup"
 * - step: "phone" | "code" | "details"
 * - formData: { phone, code, name, email, location, dob }
 * - setFormData(fn)
 * - error: string
 * - busy: boolean
 * - resendIn: number (seconds)
 * - onSendOtp(), onVerifyOtp(), onResend(), onBackToPhone(), onSaveDetails()
 */
const AuthForm = ({
  type,
  step,
  formData,
  setFormData,
  error,
  busy,
  resendIn = 0,
  onSendOtp,
  onVerifyOtp,
  onResend,
  onBackToPhone,
  onSaveDetails,
}) => {
  const isLogin = type === "login";
  const maskedPhone = useMemo(() => {
    const p = (formData?.phone || "").replace(/\D/g, "");
    return p ? `+${p.slice(0, 3)} **** ${p.slice(-3)}` : "";
  }, [formData?.phone]);

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>
          {step === "details"
            ? "Complete your profile 🌸"
            : isLogin
            ? "Welcome Back 🌸"
            : "Create Account 🌸"}
        </h2>

        {/* PHONE STEP */}
        {step === "phone" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSendOtp?.();
            }}
            className="auth-form"
          >
            <label className="auth-label">Mobile number (UAE)</label>
            <div className="phone-field" style={{ display: "flex", gap: 5 }}>
              <span
                className="prefix"
                style={{
                  padding: "19px 10px",
                  background: "#ffe3ef",
                  borderRadius: 8,
                  fontWeight: 600,
                }}
              >
                +971
              </span>
              <input
                type="tel"
                placeholder="5x xxx xxxx"
                value={
                  formData?.phone?.startsWith("+971")
                    ? formData.phone.replace("+971", "")
                    : formData?.phone || ""
                }
                onChange={(e) =>
                  setFormData((f) => ({ ...f, phone: e.target.value }))
                }
                required
              />
            </div>
            {error && <div className="auth-error">{error}</div>}
            <button type="submit" disabled={busy}>
              {busy ? "Sending..." : "Send OTP"}
            </button>

            <p className="auth-switch">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <Link to={isLogin ? "/signup" : "/login"}>
                {isLogin ? "Sign up" : "Log in"}
              </Link>
            </p>
          </form>
        )}

        {/* CODE STEP */}
        {step === "code" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onVerifyOtp?.();
            }}
            className="auth-form"
          >
            <div
              className="small-note"
              style={{ marginBottom: 10, color: "#666" }}
            >
              Code sent to <strong>{maskedPhone}</strong>
            </div>

            <OtpBoxes
              value={formData?.code || ""}
              onChange={(v) => setFormData((f) => ({ ...f, code: v }))}
              disabled={busy}
            />

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" disabled={busy}>
              {busy ? "Verifying..." : "Verify & Continue"}
            </button>

            <div
              className="code-actions"
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 8,
              }}
            >
              <button
                type="button"
                className="link-btn"
                onClick={() => onResend?.()}
                disabled={resendIn > 0}
              >
                {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend OTP"}
              </button>
              <button
                type="button"
                className="link-btn"
                onClick={() => onBackToPhone?.()}
              >
                Change number
              </button>
            </div>

            <p className="auth-switch" style={{ marginTop: 12 }}>
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <Link to={isLogin ? "/signup" : "/login"}>
                {isLogin ? "Sign up" : "Log in"}
              </Link>
            </p>
          </form>
        )}

        {/* DETAILS STEP (SIGNUP completion) */}
        {step === "details" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSaveDetails?.();
            }}
            className="auth-form"
          >
            <input
              type="text"
              placeholder="Full Name"
              value={formData?.name || ""}
              onChange={(e) =>
                setFormData((f) => ({ ...f, name: e.target.value }))
              }
              required
            />
            <input
              type="email"
              placeholder="Email (optional)"
              value={formData?.email || ""}
              onChange={(e) =>
                setFormData((f) => ({ ...f, email: e.target.value }))
              }
            />
            <select
              value={formData?.location || ""}
              onChange={(e) =>
                setFormData((f) => ({ ...f, location: e.target.value }))
              }
              required
            >
              <option value="" disabled>
                Choose Emirate
              </option>
              {EMIRATES.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
            <input
              type="date"
              placeholder="Date of birth (optional)"
              value={formData?.dob || ""}
              onChange={(e) =>
                setFormData((f) => ({ ...f, dob: e.target.value }))
              }
            />

            {error && <div className="auth-error">{error}</div>}
            <button type="submit" disabled={busy}>
              {busy ? "Saving..." : "Save & Continue"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthForm;
