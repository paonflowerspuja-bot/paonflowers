// server/controllers/productController.js
import { z } from "zod";
import mongoose from "mongoose";
import Product, {
  FLOWER_TYPES,
  FLOWER_COLORS,
  OCCASIONS,
  COLLECTIONS,
} from "../models/Product.js";
import slugify from "slugify";
import { uploadBuffer, deleteByPublicId } from "../utils/cloudinary.js";

/* -------------------- helpers -------------------- */
// Ensure unique slug by appending -2, -3, ... if needed
async function ensureUniqueSlug(baseSlug, excludeId = null) {
  const MAX = 120;
  let base = String(baseSlug || "").slice(0, MAX);
  if (!base) base = Math.random().toString(36).slice(2, 10); // fallback
  let candidate = base;
  let n = 2;
  const exists = async (slug) => {
    const q = excludeId ? { slug, _id: { $ne: excludeId } } : { slug };
    return !!(await Product.exists(q));
  };
  while (await exists(candidate)) {
    const suffix = `-${n++}`;
    const keep = Math.max(0, MAX - suffix.length);
    candidate = base.slice(0, keep) + suffix;
  }
  return candidate;
}

const arrayFromMaybeCSV = (v) =>
  Array.isArray(v)
    ? v
    : typeof v === "string"
    ? v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : v == null
    ? []
    : [v];

const normalizeEnum = (val, allowed) => {
  if (!val) return null;
  const s = String(val).trim();
  if (!s) return null;

  if (allowed.includes(s)) return s;

  const lower = s.toLowerCase();
  const hit = allowed.find((a) => a.toLowerCase() === lower);
  if (hit) return hit;

  const unslug = s.replace(/-/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
  const byWords = allowed.find(
    (a) => a.toLowerCase().replace(/'/g, "").replace(/\s+/g, " ") === unslug
  );
  return byWords || null;
};

const cleanValues = (arr) =>
  (arr || [])
    .filter((v) => typeof v === "string")
    .map((v) => v.trim())
    .filter(
      (v) => v && v.toLowerCase() !== "null" && v.toLowerCase() !== "undefined"
    );

function toClientProduct(doc) {
  const p = doc.toObject ? doc.toObject() : { ...doc };
  const price = Number(p.price) || 0;
  const discountPercent = Math.max(0, Number(p.discount) || 0);
  const priceFinal =
    discountPercent > 0
      ? Math.max(0, price - (price * discountPercent) / 100)
      : price;
  p.discountPercent = discountPercent;
  p.priceFinal = Number(priceFinal.toFixed(2));
  return p;
}

/* -------------------- schema -------------------- */

const createSchema = z.object({
  name: z.string().min(2),
  slug: z.string().optional(),
  description: z.string().optional().default(""),
  price: z.coerce.number().positive(),
  stock: z.coerce.number().int().nonnegative().optional().default(100),

  flowerType: z.string().optional().nullable(),
  flowerColor: z.string().optional().nullable(),
  occasion: z.string().optional().nullable(),
  collection: z.string().optional().nullable(),

  isFeatured: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((v) =>
      v === true || v === "true" || v === 1 || v === "1" ? true : false
    ),

  discount: z.coerce.number().optional().default(0),
  offerId: z.string().optional().nullable(),

  tags: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((v) => (typeof v === "string" ? arrayFromMaybeCSV(v) : v || [])),
});

/* -------------------- controllers -------------------- */

export const listProducts = async (req, res, next) => {
  try {
    const {
      q,
      category,
      occasion,
      type,
      color,
      collection,
      featured,
      offer,
      min,
      max,
      sort = "-createdAt",
      page = "1",
      limit = "12",
    } = req.query;

    const filter = {};
    if (q) filter.$text = { $search: q };

    const addIn = (field, rawValues) => {
      const cleaned = cleanValues(rawValues);
      if (!cleaned.length) return;
      (filter.$and ||= []).push({ [field]: { $in: cleaned } });
    };

    if (type) {
      const mapped = arrayFromMaybeCSV(type).map((v) =>
        normalizeEnum(v, FLOWER_TYPES)
      );
      addIn("flowerType", mapped.filter(Boolean));
    }
    if (color) {
      const mapped = arrayFromMaybeCSV(color).map((v) =>
        normalizeEnum(v, FLOWER_COLORS)
      );
      addIn("flowerColor", mapped.filter(Boolean));
    }
    if (occasion) {
      const mapped = arrayFromMaybeCSV(occasion).map((v) =>
        normalizeEnum(v, OCCASIONS)
      );
      addIn("occasion", mapped.filter(Boolean));
    }
    if (collection) {
      const mapped = arrayFromMaybeCSV(collection).map((v) =>
        normalizeEnum(v, COLLECTIONS)
      );
      addIn("collection", mapped.filter(Boolean));
    }

    if (category) {
      const c = String(category).trim();
      const tryLists = [
        { field: "flowerType", list: FLOWER_TYPES },
        { field: "flowerColor", list: FLOWER_COLORS },
        { field: "occasion", list: OCCASIONS },
        { field: "collection", list: COLLECTIONS },
      ];
      for (const { field, list } of tryLists) {
        const mapped = normalizeEnum(c, list);
        if (mapped) {
          addIn(field, [mapped]);
          break;
        }
      }
    }

    if (featured === "true" || featured === "1") filter.isFeatured = true;

    if (offer === "true" || offer === "1") {
      filter.$or = [{ discount: { $gt: 0 } }, { offerId: { $exists: true } }];
    }

    if (min || max) {
      filter.price = {
        ...(min ? { $gte: Number(min) } : {}),
        ...(max ? { $lte: Number(max) } : {}),
      };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Product.find(filter)
        .sort(String(sort).replace(",", " "))
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    res.json({
      items: items.map((doc) => toClientProduct(doc)),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (e) {
    next(e);
  }
};

export const getProduct = async (req, res, next) => {
  try {
    const bySlug = await Product.findOne({ slug: req.params.slug });
    if (bySlug) return res.json(toClientProduct(bySlug));
    const byId = await Product.findById(req.params.slug);
    if (byId) return res.json(toClientProduct(byId));
    res.status(404).json({ message: "Product not found" });
  } catch (e) {
    next(e);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const parsed = createSchema.parse({
      ...req.body,
      tags:
        typeof req.body.tags === "string"
          ? (() => {
              try {
                const j = JSON.parse(req.body.tags);
                return Array.isArray(j) ? j : arrayFromMaybeCSV(req.body.tags);
              } catch {
                return arrayFromMaybeCSV(req.body.tags);
              }
            })()
          : req.body.tags,
    });

    const payload = {
      ...parsed,
      flowerType: normalizeEnum(parsed.flowerType, FLOWER_TYPES),
      flowerColor: normalizeEnum(parsed.flowerColor, FLOWER_COLORS),
      occasion: normalizeEnum(parsed.occasion, OCCASIONS),
      collection: normalizeEnum(parsed.collection, COLLECTIONS),
      offerId:
        parsed.offerId && mongoose.Types.ObjectId.isValid(parsed.offerId)
          ? new mongoose.Types.ObjectId(parsed.offerId)
          : undefined,
    };

    const baseSlug = (
      payload.slug || slugify(payload.name, { lower: true, strict: true })
    ).slice(0, 120);
    const slug = await ensureUniqueSlug(baseSlug);

    // 🔼 Upload images to Cloudinary
    const images = [];
    const files = req._allFiles || [];
    for (const f of files) {
      const r = await uploadBuffer(f.buffer);
      images.push({ url: r.secure_url, publicId: r.public_id });
    }

    const created = await Product.create({
      ...payload,
      slug,
      images,
    });

    res.status(201).json(toClientProduct(created));
  } catch (e) {
    next(e);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const id = req.params.id;
    const existing = await Product.findById(id);
    if (!existing)
      return res.status(404).json({ message: "Product not found" });

    const tagsParsed =
      typeof req.body.tags === "string"
        ? (() => {
            try {
              const j = JSON.parse(req.body.tags);
              return Array.isArray(j) ? j : arrayFromMaybeCSV(req.body.tags);
            } catch {
              return arrayFromMaybeCSV(req.body.tags);
            }
          })()
        : req.body.tags;

    const partialSchema = createSchema.partial();
    const partial = partialSchema.parse({
      ...req.body,
      tags: tagsParsed,
    });

    const update = { ...partial };

    if ("flowerType" in partial)
      update.flowerType = normalizeEnum(partial.flowerType, FLOWER_TYPES);
    if ("flowerColor" in partial)
      update.flowerColor = normalizeEnum(partial.flowerColor, FLOWER_COLORS);
    if ("occasion" in partial)
      update.occasion = normalizeEnum(partial.occasion, OCCASIONS);
    if ("collection" in partial)
      update.collection = normalizeEnum(partial.collection, COLLECTIONS);

    if ("offerId" in partial) {
      if (!partial.offerId) {
        update.offerId = undefined;
      } else if (mongoose.Types.ObjectId.isValid(partial.offerId)) {
        update.offerId = new mongoose.Types.ObjectId(partial.offerId);
      } else {
        delete update.offerId;
      }
    }

    if (partial.name) {
      update.slug = slugify(partial.name, { lower: true, strict: true }).slice(
        0,
        120
      );
    }

    // 🔼 Upload any new images to Cloudinary, prepend them
    const files = req._allFiles || [];
    let images = existing.images || [];
    if (files.length) {
      const uploaded = [];
      for (const f of files) {
        const r = await uploadBuffer(f.buffer);
        uploaded.push({ url: r.secure_url, publicId: r.public_id });
      }
      images = [...uploaded, ...images];
      update.images = images;
    }

    const updated = await Product.findByIdAndUpdate(id, update, { new: true });
    res.json(toClientProduct(updated));
  } catch (e) {
    next(e);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const p = await Product.findById(req.params.id);
    if (!p) return res.json({ ok: true });
    // 🔽 best-effort delete assets in Cloudinary
    if (Array.isArray(p.images)) {
      for (const img of p.images) {
        if (img?.publicId) {
          try {
            await deleteByPublicId(img.publicId);
          } catch (_) {}
        }
      }
    }
    await p.deleteOne();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};
