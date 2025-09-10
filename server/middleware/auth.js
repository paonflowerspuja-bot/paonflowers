import jwt from "jsonwebtoken";
import User from "../models/User.js"; // ensure this path is correct for your project

// Dev flags from .env
const DEV_BYPASS = process.env.ALLOW_UNAUTH_ADMIN === "true";
const DEV_USER_ID_ENV = process.env.DEV_USER_ID || "000000000000000000000000"; // valid 24-hex fallback
const DEV_USER_ROLE = process.env.DEV_USER_ROLE || "admin";
const DEV_USER_PHONE = process.env.DEV_USER_PHONE || "+971000000000";
const DEV_USER_NAME = process.env.DEV_USER_NAME || "Dev Admin";

// simple 24-hex validator
const isValidObjectIdString = (s) => /^[a-f0-9]{24}$/i.test(s);

// Create the dev user once if missing
let ensuredDevUser = false;
async function ensureDevUser() {
  if (ensuredDevUser) return;

  const devId = isValidObjectIdString(DEV_USER_ID_ENV)
    ? DEV_USER_ID_ENV
    : "000000000000000000000000";

  // find or create
  const existing = await User.findById(devId).lean();
  if (!existing) {
    await User.create({
      _id: devId,           // force the known id
      name: DEV_USER_NAME,
      phone: DEV_USER_PHONE,
      role: DEV_USER_ROLE,  // admin
      isPhoneVerified: true,
    });
  }
  ensuredDevUser = true;
}

// helper to attach a safe req.user during bypass
function setDevUser(req) {
  const devId = isValidObjectIdString(DEV_USER_ID_ENV)
    ? DEV_USER_ID_ENV
    : "000000000000000000000000";

  req.user = {
    id: devId,
    role: DEV_USER_ROLE,
    phone: DEV_USER_PHONE,
    name: DEV_USER_NAME,
    _bypass: true, // in case any controller wants to know
  };
}

export async function auth(req, res, next) {
  if (DEV_BYPASS) {
    try {
      await ensureDevUser(); // make sure the user exists
      setDevUser(req);       // and attach it
      return next();
    } catch (e) {
      return res.status(500).json({ message: "Dev bypass init failed", error: String(e) });
    }
  }

  const token =
    req.headers.authorization?.split(" ")[1] || req.cookies?.token;
  if (!token) return res.status(401).json({ message: "Not authenticated" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, ... }
    next();
  } catch {
    return res.status(401).json({ message: "Invalid/Expired token" });
  }
}

export async function isAdmin(req, res, next) {
  if (DEV_BYPASS) {
    try {
      await ensureDevUser();
      setDevUser(req);
      return next();
    } catch (e) {
      return res.status(500).json({ message: "Dev bypass init failed", error: String(e) });
    }
  }

  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

export default auth;
