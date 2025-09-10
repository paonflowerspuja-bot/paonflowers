// routes/uploadRoutes.js
import { Router } from "express";
import { upload } from "../middleware/multer.js";
import { multerErrorHandler } from "../middleware/multer.js";
import {
  uploadSingleImage,
  uploadMultipleImages,
  deleteImage,
} from "../controllers/uploadController.js";
import auth, { isAdmin } from "../middleware/auth.js";

const router = Router();

/**
 * Admin-only: upload 1 image
 * Body (multipart/form-data):
 *  - image: File
 *  - filename: optional text
 */

router.post(
  "/image",
  auth,
  isAdmin,
  upload.single("image"),
  uploadSingleImage,
  multerErrorHandler
);

/**
 * Admin-only: upload many images (max 10 by default; adjust in multer config if needed)
 * Body (multipart/form-data):
 *  - images: File[]
 */
router.post(
  "/images",
  auth,
  isAdmin,
  upload.array("images", 10),
  uploadMultipleImages,
  multerErrorHandler
);

/**
 * Admin-only: delete by public_id
 * Body (json):
 *  - public_id: string
 */
router.delete("/image", auth, isAdmin, deleteImage);

export default router;
