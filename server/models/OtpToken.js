// models/OtpToken.js
import mongoose from "mongoose";

const otpTokenSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, index: true },
    code: { type: String, required: true }, // keep as STRING
    // DO NOT set index:true here — TTL is defined below
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true } // gives createdAt for sorting
);

// Latest token per phone
otpTokenSchema.index({ phone: 1, createdAt: -1 });

// TTL index so docs are removed automatically when expiresAt passes
otpTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("OtpToken", otpTokenSchema);
