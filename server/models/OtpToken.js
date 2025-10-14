// server/models/OtpToken.js
import mongoose from "mongoose";

const otpTokenSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, index: true },
    code: { type: String, required: true }, // keep as STRING
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// Latest token per phone
otpTokenSchema.index({ phone: 1, createdAt: -1 });

// TTL index so docs are removed automatically when expiresAt passes
otpTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("OtpToken", otpTokenSchema);
