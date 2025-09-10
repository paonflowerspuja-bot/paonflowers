// server/server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import compression from "compression";
import path from "path";
import { fileURLToPath } from "url";

import { connectDB } from "./config/db.js";
import errorHandler from "./middleware/errorHandler.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import categoriesRoutes from "./routes/categoriesRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import adminRoutes from "./routes/admin.js";
import auth, { isAdmin } from "./middleware/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Connect to Atlas ---
await connectDB();

const app = express();

// --- Core middleware ---
app.use(helmet());
app.use(
  cors({
    origin: (process.env.CORS_ORIGIN || "").split(",") || "*",
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());

// --- Static files ---
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// --- Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/admin", auth, isAdmin, adminRoutes);

app.get("/api/health", (_, res) => res.json({ ok: true }));

app.get("/", (req, res) => {
  res
    .type("text/plain")
    .send("Paon Flowers API is running ✅  Try /api/health");
});

// --- Error handler ---
app.use(errorHandler);

// --- Start server ---
const PORT = process.env.PORT || 8080;
app.listen(PORT, () =>
  console.log(`🚀 API running on port ${PORT} | DB: ${process.env.MONGO_URI}`)
);
