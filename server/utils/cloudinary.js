// server/utils/cloudinary.js
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const FOLDER = process.env.CLOUDINARY_FOLDER || "uploads";

export function uploadBuffer(buffer, opts = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: FOLDER,
        resource_type: "image",
        overwrite: false,
        transformation: [
          { quality: "auto", fetch_format: "auto" }, // compress & auto webp/jpg
          { width: 1200, crop: "limit" }, // cap width
        ],
        ...opts,
      },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

export function deleteByPublicId(publicId) {
  if (!publicId) return Promise.resolve({ result: "not_found" });
  return cloudinary.uploader.destroy(publicId);
}

export default cloudinary;
