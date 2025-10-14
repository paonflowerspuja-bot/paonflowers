import { Router } from "express";
import { sendOtp, verifyOtp, me, updateProfile } from "../controllers/authController.js";
import auth from "../middleware/auth.js";
import { otpSendLimiter } from "../middleware/rateLimit.js";

const router = Router();

/**
 * DEV flags (optional):
 * ALLOW_UNAUTH_ADMIN=true  -> allow /api/auth/admin-dev to mint a dev admin token
 * SKIP_AUTH=true           -> /me will accept an unauth dev user (for local testing)
 * DEV_AS_ADMIN=true        -> when SKIP_AUTH, the dev user is admin
 */

router.post("/send-otp", otpSendLimiter, sendOtp);
router.post("/verify-otp", verifyOtp);

// ✅ NEW: add protected profile update route
router.patch("/profile", auth, updateProfile);

// /me is protected by JWT, unless SKIP_AUTH explicitly enabled for local dev
const SKIP_AUTH = String(process.env.SKIP_AUTH || "").toLowerCase() === "true";

if (SKIP_AUTH) {
  // In dev, allow /me without JWT. Useful while wiring UI flows.
  router.get("/me", me);
} else {
  router.get("/me", auth, me);
}

export default router;
