// server/routes/productRoutes.js
import { Router } from "express";
import auth from "../middleware/auth.js";
import isAdmin from "../middleware/isAdmin.js";
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";

// ✅ use the new memory-based multer + collector (Cloudinary pipeline)
import { productImages, collectAllFiles } from "../middleware/multer.js";

const router = Router();

// Public
router.get("/", listProducts);
router.get("/:slug", getProduct);

// Admin
router.post("/", auth, isAdmin, productImages, collectAllFiles, createProduct);
router.patch("/:id", auth, isAdmin, productImages, collectAllFiles, updateProduct);
router.delete("/:id", auth, isAdmin, deleteProduct);

export default router;
