import jwt from "jsonwebtoken";
import OtpToken from "../models/OtpToken.js";
import User from "../models/User.js";
import { sendOtpViaSms, checkOtpViaTwilioVerify } from "../config/sms.js";

const JWT_SECRET = process.env.JWT_SECRET || "change_me";
const OTP_TTL_MINUTES = Number(process.env.OTP_TTL_MINUTES || 10);
const OTP_MAX_PER_HOUR = Number(process.env.OTP_MAX_PER_HOUR || 5);

const IS_PROD = String(process.env.NODE_ENV).toLowerCase() === "production";
const FORCE_TWILIO = String(process.env.FORCE_TWILIO || "").toLowerCase() === "true";
const DRY = String(process.env.SMS_DRY_RUN).toLowerCase() === "true";
const ALLOW_DEV_OTP = String(process.env.ALLOW_DEV_OTP || "").toLowerCase() === "true";

const ADMIN_PHONES = String(process.env.ADMIN_PHONE || "")
  .split(",")
  .map((s) =>
    String(s || "")
      .trim()
      .replace(/[^\d+]/g, "")
      .replace(/^00/, "+")
  )
  .filter(Boolean);

const hasTwilioEnv =
  !!process.env.TWILIO_ACCOUNT_SID &&
  !!process.env.TWILIO_AUTH_TOKEN &&
  !!process.env.TWILIO_VERIFY_SERVICE_SID;

const isUsingTwilioVerify = () => (FORCE_TWILIO ? true : (hasTwilioEnv && !DRY));

const normalizePhone = (raw) =>
  String(raw || "")
    .trim()
    .replace(/[^\d+]/g, "")
    .replace(/^00/, "+");

const sign = (user) =>
  jwt.sign({ id: user._id, isAdmin: !!user.isAdmin }, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || "7d",
  });

/* -------- helpers -------- */
function parseDateFlex(input) {
  if (!input) return null;
  const s = String(input).trim();

  // ISO / browser date input "YYYY-MM-DD"
  let d = new Date(s);
  if (!isNaN(d.getTime())) return d;

  // Accept "DD/MM/YYYY"
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const [dd, mm, yyyy] = s.split("/");
    const iso = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}T00:00:00Z`;
    const d2 = new Date(iso);
    if (!isNaN(d2.getTime())) return d2;
  }

  return null;
}

/* -------- OTP + AUTH -------- */

export const sendOtp = async (req, res) => {
  try {
    const phone = normalizePhone(req.body?.phone);
    if (!phone.startsWith("+") || phone.length < 8) {
      return res.status(400).json({ error: "Phone must be E.164 format, e.g. +9715xxxxxxx" });
    }

    const since = new Date(Date.now() - 60 * 60 * 1000);
    const countLastHour = await OtpToken.countDocuments({
      phone,
      createdAt: { $gte: since },
    });
    if (countLastHour >= OTP_MAX_PER_HOUR) {
      return res.status(429).json({ error: "Too many OTP requests. Try again later." });
    }

    const useTwilio = isUsingTwilioVerify();
    if (!useTwilio) {
      if (IS_PROD || !ALLOW_DEV_OTP) {
        return res.status(500).json({
          error: "OTP service not configured for SMS. Please contact support (Twilio not active).",
        });
      }

      const code = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

      await OtpToken.deleteMany({ phone });
      await OtpToken.create({ phone, code, expiresAt });

      console.log(`🔐 [DEV OTP] → ${phone}: ${code}`);
      return res.json({ ok: true, message: "OTP generated (dev)", debugCode: code, phone });
    }

    await sendOtpViaSms(phone);
    return res.json({ ok: true, message: "OTP sent" });
  } catch (e) {
    console.error("sendOtp error:", e);
    return res.status(500).json({ error: e?.message || "Failed to send OTP" });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const phone = normalizePhone(req.body?.phone);
    const code = String(req.body?.code || "").trim();

    if (!phone.startsWith("+") || code.length !== 6) {
      return res.status(400).json({ error: "Phone and 6-digit code are required" });
    }

    if (!isUsingTwilioVerify()) {
      if (IS_PROD || !ALLOW_DEV_OTP) {
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }

      const tok = await OtpToken.findOne({ phone }).sort({ createdAt: -1 });
      if (!tok || tok.expiresAt < new Date() || String(tok.code) !== code) {
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }
      await OtpToken.deleteMany({ phone });
    } else {
      const approved = await checkOtpViaTwilioVerify(phone, code);
      if (!approved) return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    const isAdminPhone = ADMIN_PHONES.includes(phone);
    let user = await User.findOne({ phone });
    if (!user) {
      user = await User.create({ phone, name: "User", isAdmin: !!isAdminPhone });
    } else if (isAdminPhone && !user.isAdmin) {
      user.isAdmin = true;
      await user.save();
    }

    const profileComplete =
      !!(user?.name && String(user.name).trim()) &&
      !!(user?.location && String(user.location).trim());

    const token = sign(user);
    return res.json({
      ok: true,
      token,
      user: {
        id: user._id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        location: user.location,
        dob: user.dob,
        isAdmin: !!user.isAdmin,
        profileComplete,
      },
    });
  } catch (e) {
    console.error("verifyOtp error:", e);
    return res.status(500).json({ error: "Failed to verify OTP" });
  }
};

export const me = async (req, res) => {
  try {
    const SKIP_AUTH = String(process.env.SKIP_AUTH || "").toLowerCase() === "true";
    const DEV_AS_ADMIN = String(process.env.DEV_AS_ADMIN || "").toLowerCase() === "true";

    if (SKIP_AUTH) {
      return res.json({
        ok: true,
        user: {
          id: "dev-user",
          phone: "+0000000000",
          name: "Dev User",
          isAdmin: !!DEV_AS_ADMIN,
          email: null,
          location: null,
          dob: null,
          profileComplete: false,
        },
      });
    }

    // 🔑 IMPORTANT: load fresh user from DB (req.user may only have id/isAdmin)
    const uid = req?.user?._id || req?.user?.id;
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    const fresh = await User.findById(uid).lean();
    if (!fresh) return res.status(404).json({ error: "User not found" });

    return res.json({
      ok: true,
      user: {
        id: fresh._id,
        phone: fresh.phone,
        name: fresh.name,
        email: fresh.email,
        location: fresh.location,
        dob: fresh.dob,
        isAdmin: !!fresh.isAdmin,
        profileComplete: !!fresh.profileComplete,
      },
    });
  } catch (e) {
    console.error("me error:", e);
    return res.status(500).json({ error: "Failed to load profile" });
  }
};

/* -------- PROFILE -------- */

export const updateProfile = async (req, res) => {
  try {
    const userId = req?.user?._id || req?.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { name, email, location, dob } = req.body || {};
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (typeof name === "string") user.name = name.trim();
    if (typeof email === "string") user.email = email.trim();
    if (typeof location === "string") user.location = location.trim();

    const parsedDob = parseDateFlex(dob);
    if (parsedDob) user.dob = parsedDob;

    const hasName = !!user.name && user.name.trim().length > 0;
    const hasLocation = !!user.location && user.location.trim().length > 0;
    user.profileComplete = hasName && hasLocation;

    await user.save();

    return res.json({
      ok: true,
      user: {
        id: user._id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        location: user.location,
        dob: user.dob,
        isAdmin: !!user.isAdmin,
        profileComplete: !!user.profileComplete,
      },
    });
  } catch (e) {
    console.error("updateProfile error:", e);
    return res.status(500).json({ error: "Failed to update profile" });
  }
};
