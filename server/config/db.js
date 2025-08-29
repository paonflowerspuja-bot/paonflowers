// db.js (or wherever you connect)
import mongoose from "mongoose";

const isProd = process.env.NODE_ENV === "production";
const uri =
  process.env.MONGODB_URI ||
  (!isProd ? "mongodb://127.0.0.1:27017/paonflowers" : null);

if (isProd && !uri) {
  throw new Error("MONGODB_URI is required in production");
}

export async function connectDB() {
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
    autoIndex: false,
  });
  console.log("✅ MongoDB connected");
}
