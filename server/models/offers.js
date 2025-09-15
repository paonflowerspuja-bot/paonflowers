import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },

    // discount fields
    discountType: { type: String, enum: ["percent", "flat"], required: true },
    amount: { type: Number, required: true, min: 0 },

    // explicit product price shown on offer
    price: { type: Number, required: true, min: 0 },

    // optional link to a product (kept optional)
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", index: true },

    // image uploaded to Cloudinary via /api/uploads/offer
    banner: { url: String, public_id: String },

    // visibility window
    startsAt: { type: Date, default: () => new Date() },
    endsAt: { type: Date, required: true },

    active: { type: Boolean, default: true },

    // optional flags/extra
    isFeatured: { type: Boolean, default: false },
    images: [{ url: String }],
    categories: [String],
  },
  { timestamps: true }
);

// TTL auto-delete after endsAt passes
offerSchema.index({ endsAt: 1 }, { expireAfterSeconds: 0 });

offerSchema.pre("validate", function (next) {
  if (this.endsAt && this.startsAt && this.endsAt <= this.startsAt) {
    return next(new Error("endsAt must be after startsAt"));
  }
  next();
});

offerSchema.pre("save", function (next) {
  const now = new Date();
  if (this.startsAt && this.endsAt) {
    this.active = this.startsAt <= now && now <= this.endsAt;
  }
  next();
});

export default mongoose.model("Offer", offerSchema);
