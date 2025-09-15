// server/middleware/multer.js
import multer from "multer";

const storage = multer.memoryStorage();

function imageOnlyFilter(_req, file, cb) {
  if (!file.mimetype?.startsWith("image/")) {
    return cb(new Error("Only image uploads are allowed"));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter: imageOnlyFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 10 }, // 10MB/file
});

// Accept common field names from forms
export const productImages = upload.fields([
  { name: "image", maxCount: 1 }, // single
  { name: "images", maxCount: 10 }, // multiple
  { name: "file", maxCount: 1 }, // some UIs send "file"
]);

// Normalize Multer's shape: expose req._allFiles as a flat array of all files (buffers)
export function collectAllFiles(req, _res, next) {
  const all = [];
  if (req.file) all.push(req.file);
  if (req.files) {
    Object.values(req.files).forEach((arr) => {
      if (Array.isArray(arr)) all.push(...arr);
    });
  }
  req._allFiles = all; // [{buffer, mimetype, originalname, ...}]
  next();
}

export default upload;
