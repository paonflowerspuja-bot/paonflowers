// server/models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },

    // phone is your auth identifier
    phone: { type: String, required: true, unique: true, index: true },

    // 🔹 add the profile fields you read/write elsewhere
    email: { type: String, default: "" },
    location: { type: String, default: "" }, // e.g. "Dubai"
    dob: { type: Date, default: null },

    // admin flag
    isAdmin: { type: Boolean, default: false },

    // used by your client logic to decide redirects
    profileComplete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// helpful index for admin or queries by phone
userSchema.index({ phone: 1 });

export default mongoose.model("User", userSchema);
