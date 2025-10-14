// server/middleware/rateLimit.js
import { rateLimit } from "express-rate-limit";

export const otpSendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: +process.env.OTP_MAX_PER_HOUR || 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many OTP requests. Try again later." },
});
