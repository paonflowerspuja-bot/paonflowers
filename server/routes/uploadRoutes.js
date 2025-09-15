// server/routes/uploadRoutes.js
import { Router } from "express";
import upload, { productImages, collectAllFiles } from "../middleware/multer.js";
import auth from "../middleware/auth.js";
import isAdmin from "../middleware/isAdmin.js";
import { uploadSingle, uploadMultiple, deleteImage } from "../controllers/uploadController.js";

// --- NEW: Cloudinary + memory multer for offer banners ---
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Configure Cloudinary (safe to call here)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const router = Router();

/**
 * Existing endpoints (unchanged)
 */
router.post(
  "/single",
  auth,
  isAdmin,
  productImages,
  collectAllFiles,
  uploadSingle
);

router.post(
  "/multiple",
  auth,
  isAdmin,
  productImages,
  collectAllFiles,
  uploadMultiple
);

router.delete("/", auth, isAdmin, deleteImage);

/**
 * NEW: Upload offer banner directly to Cloudinary
 * Route: POST /api/uploads/offer
 * Form field: file (single image)
 * Response: { url, public_id, width, height, bytes, format }
 */
router.post(
  "/offer",
  auth,
  isAdmin,
  memoryUpload.single("file"),
  async (req, res, next) => {
    try {
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        return res.status(500).json({ message: "Cloudinary env vars are not configured." });
      }
      if (!req.file) {
        return res.status(400).json({ message: "file is required" });
      }

      const baseFolder = process.env.CLOUDINARY_FOLDER || "paonflowers";
      const folder = `${baseFolder}/offers`;

      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "image",
          overwrite: false,
        },
        (error, result) => {
          if (error) return next(error);
          return res.status(201).json({
            url: result.secure_url,
            public_id: result.public_id,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
            format: result.format,
          });
        }
      );

      stream.end(req.file.buffer);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
