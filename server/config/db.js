// server/config/db.js
import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI missing in .env at project root");
    process.exit(1);
  }
  await mongoose.connect(uri, { dbName: "paonflowers" });
  console.log("✅ MongoDB connected");
}
