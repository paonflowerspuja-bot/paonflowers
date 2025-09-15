// server/middleware/isAdmin.js
const BYPASS_AUTH =
  String(process.env.SKIP_AUTH || "").toLowerCase() === "true";

export default function isAdmin(req, res, next) {
  if (BYPASS_AUTH) return next(); // allow everything in bypass mode
  if (req.user?.isAdmin === true) return next();
  if (req.user?.role === "admin") return next();
  return res.status(403).json({ error: "Admin access only" });
}
