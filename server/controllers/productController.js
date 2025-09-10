// controllers/productController.js
import { z } from "zod";
import slugify from "slugify";
import Product from "../models/Product.js";
import cloudinary from "../utils/cloudinary.js";

/* ----------------------------- Zod Schemas ------------------------------ */

const imageSchema = z.object({
  url: z.string().url(),
  public_id: z.string().optional(),
  alt: z.string().optional(),
});

const baseSchema = z.object({
  name: z.string().min(2).optional(), // required in create handler
  slug: z.string().optional(),
  description: z.string().optional().default(""),
  price: z.number().positive().optional(), // required in create handler
  stock: z.number().int().nonnegative().optional().default(100),
  category: z.string().optional(),
  occasion: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  isFeatured: z.boolean().optional().default(false),
  images: z.array(imageSchema).optional().default([]),
});

const createSchema = baseSchema.extend({
  name: z.string().min(2),
  price: z.number().positive(),
});

const updateSchema = baseSchema.partial();

/* --------------------------- Helper Functions --------------------------- */

const toNumber = (v) =>
  v == null || v === ""
    ? undefined
    : Number.isNaN(Number(v))
    ? undefined
    : Number(v);

const toBool = (v) => {
  if (v === true || v === false) return v;
  if (typeof v === "string") {
    if (v.toLowerCase() === "true") return true;
    if (v.toLowerCase() === "false") return false;
  }
  return undefined;
};

// Accept JSON string or array/object
const parseJSONMaybe = (val, fallback) => {
  if (val == null) return fallback;
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      // allow comma-separated strings for tags
      if (fallback === undefined && val.includes(",")) {
        return val
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
      return fallback;
    }
  }
  return val;
};

/* --------------------------------- List --------------------------------- */

export const listProducts = async (req, res, next) => {
  try {
    const {
      q,
      category,
      occasion,
      min,
      max,
      featured,
      sort = "-createdAt",
      page = "1",
      limit = "12",
    } = req.query;

    const filter = {};
    if (q) filter.$text = { $search: q };
    if (category) filter.category = category;
    if (occasion) filter.occasion = occasion;

    const minN = toNumber(min);
    const maxN = toNumber(max);
    if (minN != null || maxN != null) {
      filter.price = {
        ...(minN != null ? { $gte: minN } : {}),
        ...(maxN != null ? { $lte: maxN } : {}),
      };
    }

    const isFeat = toBool(featured);
    if (typeof isFeat === "boolean") filter.isFeatured = isFeat;

    const safeSort = String(sort).split(",").join(" ");
    const skip = (toNumber(page) || 1 - 1) * (toNumber(limit) || 12);
    const lim = toNumber(limit) || 12;

    const [items, total] = await Promise.all([
      Product.find(filter).sort(safeSort).skip(skip).limit(lim),
      Product.countDocuments(filter),
    ]);

    res.json({
      items,
      pagination: {
        page: toNumber(page) || 1,
        limit: lim,
        total,
        pages: Math.ceil(total / lim),
      },
    });
  } catch (e) {
    next(e);
  }
};

/* ------------------------------- Get One -------------------------------- */

export const getProduct = async (req, res, next) => {
  try {
    const key = req.params.slug;
    const bySlug = await Product.findOne({ slug: key });
    if (bySlug) return res.json(bySlug);

    const byId = await Product.findById(key);
    if (byId) return res.json(byId);

    res.status(404).json({ message: "Product not found" });
  } catch (e) {
    next(e);
  }
};

/* -------------------------------- Create --------------------------------
   Expect the client to UPLOAD images first to /api/uploads/image(s) and
   send them here as: images: [{ url, public_id, alt? }, ...]
--------------------------------------------------------------------------- */

export const createProduct = async (req, res, next) => {
  try {
    // Normalize/parse incoming body
    const normalized = {
      ...req.body,
      price: toNumber(req.body?.price),
      stock: toNumber(req.body?.stock),
      isFeatured: toBool(req.body?.isFeatured),
      tags: parseJSONMaybe(req.body?.tags, undefined),
      images: parseJSONMaybe(req.body?.images, undefined),
    };

    const body = createSchema.parse(normalized);

    const slug = (
      body.slug || slugify(body.name, { lower: true, strict: true })
    ).slice(0, 120);

    const product = await Product.create({
      ...body,
      slug,
    });

    res.status(201).json({ ok: true, product });
  } catch (e) {
    next(e);
  }
};

/* -------------------------------- Update --------------------------------
   Supports three patterns:
   1) Replace full images array by sending `images: [{url, public_id}, ...]`
   2) Add new images via `addImages: [{url, public_id}, ...]`
   3) Remove images via `removePublicIds: ["folder/id1", "folder/id2"]`
      - If `removePublicIds` provided, we will also best-effort delete them
        from Cloudinary (requires public_id to be stored).
--------------------------------------------------------------------------- */

export const updateProduct = async (req, res, next) => {
  try {
    const id = req.params.id;
    const existing = await Product.findById(id);
    if (!existing)
      return res.status(404).json({ message: "Product not found" });

    const normalized = {
      ...req.body,
      price: toNumber(req.body?.price),
      stock: toNumber(req.body?.stock),
      isFeatured: toBool(req.body?.isFeatured),
      tags: parseJSONMaybe(req.body?.tags, undefined),
      images: parseJSONMaybe(req.body?.images, undefined),
      addImages: parseJSONMaybe(req.body?.addImages, []),
      removePublicIds: parseJSONMaybe(req.body?.removePublicIds, []),
    };

    const partial = updateSchema.parse(normalized);

    // Start from current images
    let images = existing.images || [];

    // If full images array provided, it REPLACES current images
    if (Array.isArray(partial.images)) {
      images = partial.images;
    }

    // AddImages merges/appends
    if (Array.isArray(normalized.addImages) && normalized.addImages.length) {
      images = [...images, ...normalized.addImages];
    }

    // Remove by public_id (and try to delete from Cloudinary)
    if (
      Array.isArray(normalized.removePublicIds) &&
      normalized.removePublicIds.length
    ) {
      const removeSet = new Set(normalized.removePublicIds.filter(Boolean));
      const toDelete = images.filter(
        (img) => img.public_id && removeSet.has(img.public_id)
      );
      images = images.filter(
        (img) => !(img.public_id && removeSet.has(img.public_id))
      );

      // Best-effort Cloudinary deletion (non-blocking)
      Promise.allSettled(
        toDelete.map((img) =>
          cloudinary.uploader.destroy(img.public_id, { resource_type: "image" })
        )
      ).catch(() => {});
    }

    const update = {
      ...partial,
      ...(partial.name && {
        slug: slugify(partial.name, { lower: true, strict: true }).slice(
          0,
          120
        ),
      }),
      images,
    };

    const updated = await Product.findByIdAndUpdate(id, update, { new: true });
    res.json({ ok: true, product: updated });
  } catch (e) {
    next(e);
  }
};

/* -------------------------------- Delete --------------------------------
   Deletes the product and best-effort deletes any Cloudinary images by public_id
--------------------------------------------------------------------------- */

export const deleteProduct = async (req, res, next) => {
  try {
    const doc = await Product.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: "Product not found" });

    const publicIds = (doc.images || [])
      .map((img) => img.public_id)
      .filter(Boolean);

    if (publicIds.length) {
      // Best-effort cleanup; ignore failures
      Promise.allSettled(
        publicIds.map((pid) =>
          cloudinary.uploader.destroy(pid, { resource_type: "image" })
        )
      ).catch(() => {});
    }

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};
