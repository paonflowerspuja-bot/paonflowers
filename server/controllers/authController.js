// controllers/authController.js
import jwt from "jsonwebtoken";
import OtpToken from "../models/OtpToken.js";
import User from "../models/User.js";
import { sendOtpViaSms, checkOtpViaTwilioVerify } from "../config/sms.js";

const JWT_SECRET = process.env.JWT_SECRET || "change_me";
const OTP_TTL_MINUTES = Number(process.env.OTP_TTL_MINUTES || 10);
const OTP_MAX_PER_HOUR = Number(process.env.OTP_MAX_PER_HOUR || 5);
const ADMIN_PHONE_ENV = process.env.ADMIN_PHONE || "";

const DRY = String(process.env.SMS_DRY_RUN).toLowerCase() === "true";
const isUsingTwilioVerify = () =>
  !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_VERIFY_SERVICE_SID
  ) && !DRY;

const normalizePhone = (raw) =>
  String(raw || "")
    .replace(/[^\d+]/g, "")
    .replace(/^00/, "+");

const sign = (user) =>
  jwt.sign({ id: user._id, isAdmin: !!user.isAdmin }, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || "7d",
  });

// POST /api/auth/send-otp  { phone }
export const sendOtp = async (req, res) => {
  const phone = normalizePhone(req.body?.phone);
  if (!phone.startsWith("+")) {
    return res
      .status(400)
      .json({ error: "Phone must be in E.164 format, e.g. +9715xxxxxxx" });
  }

  const since = new Date(Date.now() - 60 * 60 * 1000);
  const countLastHour = await OtpToken.countDocuments({
    phone,
    createdAt: { $gte: since },
  });
  if (countLastHour >= OTP_MAX_PER_HOUR) {
    return res.status(429).json({ error: "Too many OTP requests. Try later." });
  }

  if (!isUsingTwilioVerify()) {
    const code = String(Math.floor(100000 + Math.random() * 900000)); // string
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    // remove old tokens for this phone
    await OtpToken.deleteMany({ phone });
    await OtpToken.create({ phone, code, expiresAt });

    console.log(
      `🔐 DEV OTP → phone=${phone} code=${code} exp=${expiresAt.toISOString()}`
    );

    return res.json({
      ok: true,
      message: "OTP created (dev)",
      debugCode: code,
      phone, // helpful to compare in UI/Network tab
    });
  }

  await sendOtpViaSms(phone);
  return res.json({ ok: true, message: "OTP sent" });
};

// POST /api/auth/verify-otp  { phone, code }
export const verifyOtp = async (req, res) => {
  const phone = normalizePhone(req.body?.phone);
  const code = String(req.body?.code || "").trim();

  if (!phone.startsWith("+") || code.length !== 6) {
    return res
      .status(400)
      .json({ error: "Phone and 6-digit code are required" });
  }

  if (!isUsingTwilioVerify()) {
    // Look up latest token for this phone
    const tok = await OtpToken.findOne({ phone }).sort({ createdAt: -1 });

    // Debug visibility
    console.log(
      `🔎 OTP VERIFY (dev) phone=${phone} code=${code} found=${
        tok ? `${tok.code}@${tok.createdAt.toISOString()}` : "none"
      } exp=${tok?.expiresAt?.toISOString()} now=${new Date().toISOString()}`
    );

    if (!tok) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }
    if (tok.expiresAt < new Date()) {
      console.log("⏰ OTP expired");
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }
    if (String(tok.code) !== code) {
      console.log("❌ OTP code mismatch");
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // Success → clean all tokens for this phone
    await OtpToken.deleteMany({ phone });
  } else {
    const approved = await checkOtpViaTwilioVerify(phone, code);
    if (!approved)
      return res.status(400).json({ error: "Invalid or expired OTP" });
  }

  const isAdminPhone =
    normalizePhone(ADMIN_PHONE_ENV) &&
    normalizePhone(ADMIN_PHONE_ENV) === phone;

  let user = await User.findOne({ phone });
  if (!user) {
    user = await User.create({
      phone,
      name: "User",
      isAdmin: !!isAdminPhone,
    });
  } else if (isAdminPhone && !user.isAdmin) {
    user.isAdmin = true;
    await user.save();
  }

  const token = sign(user);
  return res.json({
    ok: true,
    token,
    user: {
      id: user._id,
      phone: user.phone,
      name: user.name,
      isAdmin: !!user.isAdmin,
    },
  });
};

// GET /api/auth/me
export const me = async (req, res) => {
  const user = req.user;
  return res.json({
    ok: true,
    user: {
      id: user._id,
      phone: user.phone,
      name: user.name,
      isAdmin: !!user.isAdmin,
    },
  });
};
