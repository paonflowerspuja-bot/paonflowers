// server/middleware/multer.js
import multer from "multer";
import path from "path";
import { v4 as uuid } from "uuid";
import { promises as fsp } from "fs";
import { v2 as cloudinary } from "cloudinary";

// ---------- Multer (memory) with image-only filter ----------
const storage = multer.memoryStorage();

function imageOnlyFilter(_req, file, cb) {
  if (!file?.mimetype?.startsWith?.("image/")) {
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

// ---------- Cloudinary (optional) ----------
const cloudEnabled =
  !!process.env.CLOUDINARY_CLOUD_NAME &&
  !!process.env.CLOUDINARY_API_KEY &&
  !!process.env.CLOUDINARY_API_SECRET;

if (cloudEnabled) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

// ---------- Helper: upload buffer to Cloudinary ----------
async function uploadToCloudinary(buffer, filename = "upload") {
  const folder = process.env.CLOUDINARY_FOLDER || "paonflowers/products";
  return new Promise((resolve, reject) => {
    const opts = {
      folder,
      resource_type: "image",
      use_filename: true,
      unique_filename: true,
      filename_override: filename,
    };
    const stream = cloudinary.uploader.upload_stream(opts, (err, res) =>
      err ? reject(err) : resolve(res)
    );
    stream.end(buffer);
  });
}

// ---------- Helper: save buffer locally under /uploads ----------
async function saveLocally(buffer, originalname = "") {
  const root = path.join(process.cwd(), "uploads"); // server.js already serves this
  try {
    await fsp.access(root);
  } catch {
    await fsp.mkdir(root, { recursive: true });
  }
  const ext = path.extname(originalname || "").toLowerCase() || ".jpg";
  const filename = `${uuid()}${ext}`;
  const full = path.join(root, filename);
  await fsp.writeFile(full, buffer);
  return { url: `/uploads/${filename}`, publicId: undefined };
}

// ---------- Collector middleware ----------
export const collectAllFiles = async (req, _res, next) => {
  try {
    // Gather all possible multer shapes
    const buckets = [];
    if (req.file) buckets.push(req.file);
    if (req.files) {
      if (Array.isArray(req.files)) buckets.push(...req.files);
      else {
        for (const arr of Object.values(req.files)) {
          if (Array.isArray(arr)) buckets.push(...arr);
        }
      }
    }

    const out = [];
    for (const f of buckets) {
      // If already uploaded earlier in the pipeline and has url/public_id, keep it
      const preUrl =
        f.url || f.secure_url || f.cloudinaryUrl || f.location || f.path;
      const prePid = f.publicId || f.public_id;

      if (preUrl) {
        out.push({ url: preUrl, publicId: prePid });
        continue;
      }

      // Otherwise upload now (Cloudinary preferred)
      if (cloudEnabled) {
        const uploaded = await uploadToCloudinary(
          f.buffer,
          f.originalname || "image"
        );
        out.push({
          url: uploaded.secure_url || uploaded.url,
          publicId: uploaded.public_id,
        });
      } else {
        const saved = await saveLocally(f.buffer, f.originalname);
        out.push(saved);
      }
    }

    // Uniform place the controller reads from:
    req.filesCollected = out; // [{ url, publicId }]
    next();
  } catch (err) {
    next(err);
  }
};

export default upload;
