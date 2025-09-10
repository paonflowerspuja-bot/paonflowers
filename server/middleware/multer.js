// middleware/multer.js
import multer from "multer";

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    return cb(
      new Error("Unsupported file type. Allowed: jpg, png, webp, gif, avif")
    );
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

// Optional middleware to catch Multer errors and make them pretty
export const multerErrorHandler = (err, req, res, next) => {
  if (
    err instanceof multer.MulterError ||
    err.message?.includes("Unsupported")
  ) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
};
