// controllers/uploadController.js
import cloudinary from "../utils/cloudinary.js";
import streamifier from "streamifier";

const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER || "paonflowers";

const streamUpload = (buffer, folder, filename) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        resource_type: "image",
        context: filename ? { alt: filename } : undefined,
        // You can add transformations if you want standardized sizes/thumbnails, e.g.:
        // transformation: [{ width: 1600, height: 1600, crop: "limit" }],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });

export const uploadSingleImage = async (req, res, next) => {
  try {
    if (!req.file)
      return res
        .status(400)
        .json({ error: "No image file provided (field: 'image')." });

    const folder = CLOUDINARY_FOLDER;
    const filename = req.body.filename || req.file.originalname;

    const result = await streamUpload(req.file.buffer, folder, filename);
    const payload = {
      public_id: result.public_id,
      url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };

    return res.status(201).json({ ok: true, asset: payload });
  } catch (err) {
    return next(err);
  }
};

export const uploadMultipleImages = async (req, res, next) => {
  try {
    if (!req.files?.length)
      return res
        .status(400)
        .json({ error: "No image files provided (field: 'images')." });

    const folder = CLOUDINARY_FOLDER;

    const uploads = await Promise.all(
      req.files.map((f) => streamUpload(f.buffer, folder, f.originalname))
    );

    const assets = uploads.map((r) => ({
      public_id: r.public_id,
      url: r.secure_url,
      width: r.width,
      height: r.height,
      format: r.format,
      bytes: r.bytes,
    }));

    return res.status(201).json({ ok: true, assets });
  } catch (err) {
    return next(err);
  }
};

export const deleteImage = async (req, res, next) => {
  try {
    const { public_id } = req.body;
    if (!public_id)
      return res.status(400).json({ error: "public_id is required" });

    const result = await cloudinary.uploader.destroy(public_id, {
      resource_type: "image",
    });
    return res.json({ ok: true, result });
  } catch (err) {
    return next(err);
  }
};
