// server/controllers/uploadController.js
import { uploadBuffer, deleteByPublicId } from "../utils/cloudinary.js";

export async function uploadSingle(req, res, next) {
  try {
    const file =
      req._allFiles?.[0] ||
      req.file ||
      (req.files?.image && req.files.image[0]) ||
      (req.files?.file && req.files.file[0]);

    if (!file?.buffer) {
      return res.status(400).json({ message: "No image provided" });
    }

    const result = await uploadBuffer(file.buffer);
    return res.json({
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    });
  } catch (e) {
    next(e);
  }
}

export async function uploadMultiple(req, res, next) {
  try {
    const files =
      req._allFiles ||
      req.files?.images ||
      req.files?.image ||
      req.files?.file ||
      [];

    if (!files.length) {
      return res.status(400).json({ message: "No images provided" });
    }

    const outs = [];
    for (const f of files) {
      const r = await uploadBuffer(f.buffer);
      outs.push({
        url: r.secure_url,
        publicId: r.public_id,
        width: r.width,
        height: r.height,
        format: r.format,
      });
    }
    return res.json({ items: outs });
  } catch (e) {
    next(e);
  }
}

export async function deleteImage(req, res, next) {
  try {
    const { publicId } = req.query;
    if (!publicId) return res.status(400).json({ message: "publicId required" });
    const result = await deleteByPublicId(publicId);
    res.json(result);
  } catch (e) {
    next(e);
  }
}
