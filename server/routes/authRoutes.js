// routes/authRoutes.js
import { Router } from "express";
import auth from "../middleware/auth.js";
import { sendOtp, verifyOtp, me } from "../controllers/authController.js";

const router = Router();

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.get("/me", auth, me);

export default router;
