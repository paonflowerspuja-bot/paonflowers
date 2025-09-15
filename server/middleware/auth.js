// server/middleware/auth.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "change_me";

// DEV BYPASS FLAGS
const BYPASS_AUTH =
  String(process.env.SKIP_AUTH || "").toLowerCase() === "true";
const DEV_AS_ADMIN =
  String(process.env.DEV_AS_ADMIN ?? "true").toLowerCase() === "true";

const normalizePhone = (raw) =>
  String(raw || "")
    .replace(/[^\d+]/g, "")
    .replace(/^00/, "+");

export default async function auth(req, res, next) {
  try {
    if (BYPASS_AUTH) {
      const phone = normalizePhone(process.env.ADMIN_PHONE) || "+971000000000";
      if (!global.__AUTH_BYPASS_LOGGED) {
        console.log(
          `🔓 SKIP_AUTH active → all requests authenticated as ${
            DEV_AS_ADMIN ? "ADMIN" : "USER"
          } (${phone})`
        );
        global.__AUTH_BYPASS_LOGGED = true;
      }
      req.user = {
        _id: "dev-user",
        phone,
        name: "Dev User",
        isAdmin: !!DEV_AS_ADMIN, // boolean style
        role: DEV_AS_ADMIN ? "admin" : "user", // string style
      };
      return next();
    }

    // normal JWT path
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) throw new Error("Missing token");

    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) throw new Error("User not found");

    // Ensure both shapes exist on real users too
    req.user = {
      ...user.toObject(),
      isAdmin: !!user.isAdmin || user.role === "admin",
      role: user.role || (user.isAdmin ? "admin" : "user"),
    };
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}
