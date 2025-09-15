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

// DB
import { connectDB } from "./config/db.js";

// routes
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import categoriesRoutes from "./routes/categoriesRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import adminRoutes from "./routes/admin.js";
import offerRoutes from "./routes/offerRoutes.js";
import deliveryRoutes from "./routes/deliveryRoutes.js";
import driverRoutes from "./routes/driverRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import customersRoutes from "./routes/customersRoutes.js";

// middlewares
import errorHandler from "./middleware/errorHandler.js";
import auth from "./middleware/auth.js";
import isAdmin from "./middleware/isAdmin.js";

// --- boot ---
await connectDB();

/* ---------- OPTIONAL: run once on first boot ---------- */
if (process.env.BUILD_INDEXES === "true") {
  try {
    const { default: Product } = await import("./models/Product.js");
    // Add more models here if you want:
    // const { default: Offer } = await import("./models/offers.js");

    await Promise.all([
      Product?.syncIndexes?.(),
      // Offer?.syncIndexes?.(),
    ]);

    console.log("🔧 Indexes synced");
  } catch (e) {
    console.error("Index sync error:", e?.message || e);
  }
}

/* ---------- OPTIONAL: seed 1 sample product when empty ---------- */
if (process.env.SEED_ON_BOOT === "true") {
  try {
    const { default: Product } = await import("./models/Product.js");
    const count = await Product.estimatedDocumentCount();
    if (count === 0) {
      await Product.create({
        name: "Sample Bouquet",
        slug: "sample-bouquet",
        description: "Starter item to verify fresh DB.",
        price: 99,
        stock: 10,
        images: [],
        category: "Test",
        occasion: "Any",
        tags: ["sample"],
        isFeatured: false,
      });
      console.log("🌱 Seeded: 1 sample product");
    } else {
      console.log(`🌱 Seed skipped (products: ${count})`);
    }
  } catch (e) {
    console.error("Seed error:", e?.message || e);
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const isProd = process.env.NODE_ENV === "production";

// If you run behind a proxy (Render/NGINX), this helps correct IPs for rate limits/logging
app.set("trust proxy", 1);

// ------------------------
// CORS (MUST be before routes)
// ------------------------
const allowList = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  // ensure caches/proxies vary by Origin so the right CORS header is served
  res.setHeader("Vary", "Origin");
  next();
});

app.use(
  cors({
    origin(origin, cb) {
      // allow server-to-server tools (no Origin header)
      if (!origin) return cb(null, true);
      if (allowList.includes(origin)) return cb(null, true);
      // dev convenience: allow 127.0.0.1 variant when NODE_ENV not set
      if (
        !process.env.NODE_ENV &&
        /^http:\/\/(localhost|127\.0\.0\.1):5173$/.test(origin)
      ) {
        return cb(null, true);
      }
      return cb(new Error(`CORS: origin ${origin} not allowed`), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Make preflight succeed everywhere
app.options("*", cors());

// ------------------------
// Security / core middleware
// ------------------------
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: isProd ? true : false,
  })
);

if (!isProd) app.use(morgan("dev"));

app.use(compression());
app.use(cookieParser());

// Body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ------------------------
// Static: local uploads (if you use them alongside Cloudinary)
// ------------------------
const allowOrigin = allowList[0] || "*";
app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Access-Control-Allow-Origin", allowOrigin);
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "*");
    next();
  },
  express.static(path.join(process.cwd(), "uploads"), {
    setHeaders(res) {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.setHeader("Access-Control-Allow-Origin", allowOrigin);
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    },
  })
);

// ------------------------
// Health
// ------------------------
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ------------------------
// Canonical API mounts
// ------------------------
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/admin", auth, isAdmin, adminRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/customers", customersRoutes);
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/users", userRoutes);

// ------------------------
// Optional aliases (client sometimes calls without /api)
// ------------------------
app.use("/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/orders", orderRoutes);
app.use("/categories", categoriesRoutes);
app.use("/admin", auth, isAdmin, adminRoutes);
app.use("/offers", offerRoutes);
app.use("/deliveries", deliveryRoutes);
app.use("/drivers", driverRoutes);
app.use("/users", userRoutes);
app.use("/customers", customersRoutes);

// ------------------------
// Root
// ------------------------
app.get("/", (_req, res) => {
  res
    .type("text/plain")
    .send("Paon Flowers API is running ✅  Try /api/health");
});

// ------------------------
// Errors (keep last)
// ------------------------
app.use(errorHandler);

// ------------------------
// Start
// ------------------------
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 API running on port ${PORT}`);
});
