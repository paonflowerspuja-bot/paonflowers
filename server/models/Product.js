// server/models/Product.js
import mongoose from "mongoose";

export const FLOWER_TYPES = [
  "Hydrangeia",
  "Rose",
  "Lemonium",
  "Lilly",
  "Tulip",
  "Foliage",
];

export const FLOWER_COLORS = ["Red", "Pink", "White", "Yellow"];

export const OCCASIONS = [
  "Birthday",
  "Valentine Day",
  "Graduation Day",
  "New Baby",
  "Mother's Day",
  "Bridal Boutique",
  "Eid",
];

export const COLLECTIONS = ["Summer Collection", "Balloons", "Teddy Bear"];

const ImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String }, // Cloudinary public_id (optional)
  },
  { _id: false }
);

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, index: true, unique: true, sparse: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true },
    stock: { type: Number, default: 100 },

    images: [ImageSchema],
    tags: [{ type: String, index: true }],

    flowerType: {
      type: String,
      enum: FLOWER_TYPES,
      index: true,
      default: null,
    },
    flowerColor: {
      type: String,
      enum: FLOWER_COLORS,
      index: true,
      default: null,
    },
    occasion: { type: String, enum: OCCASIONS, index: true, default: null },
    collection: { type: String, enum: COLLECTIONS, index: true, default: null },

    isFeatured: { type: Boolean, default: false, index: true },
    discount: { type: Number, default: 0 }, // percent
    offerId: { type: mongoose.Schema.Types.ObjectId, ref: "Offer" },
  },
  { timestamps: true, suppressReservedKeysWarning: true }
);

ProductSchema.index({ name: "text", description: "text", tags: "text" });

const Product = mongoose.model("Product", ProductSchema);
export default Product;
