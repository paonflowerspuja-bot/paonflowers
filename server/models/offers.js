// import mongoose from "mongoose";

// const OfferSchema = new mongoose.Schema(
//   {
//     title: { type: String, required: true, trim: true },
//     description: { type: String, default: "" },
//     code: {
//       type: String,
//       required: true,
//       unique: true,
//       uppercase: true,
//       trim: true,
//     },
//     discountType: { type: String, enum: ["percent", "flat"], default: "percent" },
//     discountValue: { type: Number, required: true, min: 0 },
//     minSubtotal: { type: Number, default: 0, min: 0 },
//     active: { type: Boolean, default: true },
//     startsAt: { type: Date },
//     endsAt: { type: Date },
//   },
//   { timestamps: true }
// );

// export default mongoose.model("Offer", OfferSchema);
