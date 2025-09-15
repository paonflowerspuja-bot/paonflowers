// server/routes/offerRoutes.js
import { Router } from "express";
import auth from "../middleware/auth.js";
import isAdmin from "../middleware/isAdmin.js";
import Offer from "../models/offers.js";
import Product from "../models/Product.js"; // ⬅️ for auto-creating product when missing

const router = Router();

/* --------- helpers ---------- */
function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function normalize(body, partial = false) {
  const b = body || {};
  const out = {};

  if (!partial || b.title != null) out.title = String(b.title || "").trim();
  if (!partial || b.description != null) out.description = String(b.description || "");

  // discount
  if (!partial || b.discountType != null) out.discountType = b.discountType;
  if (!partial || b.amount != null || b.discountValue != null) {
    out.amount = toNum(b.amount ?? b.discountValue);
  }

  // price (explicit)
  if (!partial || b.price != null) out.price = toNum(b.price);

  // optional product
  if (!partial || "product" in b) out.product = b.product || undefined;

  // dates (accept startsAt/endsAt)
  if (!partial || b.startsAt != null) out.startsAt = b.startsAt ? new Date(b.startsAt) : undefined;
  if (!partial || b.endsAt != null) out.endsAt = b.endsAt ? new Date(b.endsAt) : undefined;

  // active toggle (optional)
  if (!partial || b.active != null)
    out.active =
      b.active === true ||
      b.active === "true" ||
      b.active === 1 ||
      b.active === "1";

  // image/banner
  if (!partial || b.banner != null) out.banner = b.banner || undefined;

  // clean undefined on partial
  if (partial) Object.keys(out).forEach((k) => out[k] === undefined && delete out[k]);
  return out;
}

const slugify = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "product";

/* ---------- PUBLIC: GET /api/offers/public ---------- */
router.get("/public", async (req, res, next) => {
  try {
    const { sort = "-isFeatured,endsAt" } = req.query;
    const now = new Date();
    const filter = {
      active: true,
      $and: [
        { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
        { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] },
      ],
    };

    const items = await Offer.find(filter)
      .populate(
        "product",
        // select the common fields your Product has; adjust if needed
        "name slug images price categories flowerType flowerColor occasion type collection isFeatured"
      )
      .sort(String(sort).replace(",", " "))
      .lean();

    res.json({
      items,
      total: items.length,
      pagination: { page: 1, limit: items.length, total: items.length, pages: 1 },
    });
  } catch (err) {
    next(err);
  }
});

/* ---------- GET /api/offers ---------- */
router.get("/", async (req, res, next) => {
  try {
    const {
      page = "1",
      limit = "10",
      sort = "-createdAt",
      q,
      active,
      public: publicOnly,
    } = req.query;

    const nPage = Math.max(1, Number(page) || 1);
    const nLimit = Math.max(1, Math.min(Number(limit) || 10, 50));
    const skip = (nPage - 1) * nLimit;

    const filter = {};
    if (q) filter.$text = { $search: q };
    if (active === "true") filter.active = true;
    if (active === "false") filter.active = false;

    if (publicOnly === "true") {
      const now = new Date();
      filter.active = true;
      filter.$and = [
        { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
        { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] },
      ];
    }

    const [items, total] = await Promise.all([
      Offer.find(filter)
        .sort(String(sort).replace(",", " "))
        .skip(skip)
        .limit(nLimit)
        .lean(),
      Offer.countDocuments(filter),
    ]);

    res.json({
      items,
      pagination: { page: nPage, limit: nLimit, total, pages: Math.ceil(total / nLimit) },
    });
  } catch (err) {
    next(err);
  }
});

/* ---------- GET /api/offers/:id ---------- */
router.get("/:id", async (req, res, next) => {
  try {
    const offer = await Offer.findById(req.params.id).lean();
    if (!offer) return res.status(404).json({ message: "Offer not found" });
    res.json(offer);
  } catch (err) {
    next(err);
  }
});

/* ---------- POST /api/offers (admin) ---------- */
router.post("/", auth, isAdmin, async (req, res, next) => {
  try {
    const payload = normalize(req.body);

    // Required fields (no code in this model)
    if (!payload.title) return res.status(400).json({ message: "title is required" });
    if (!payload.discountType || !["percent", "flat"].includes(payload.discountType))
      return res.status(400).json({ message: "discountType must be 'percent' or 'flat'" });
    if (!(payload.amount > 0)) return res.status(400).json({ message: "discount amount must be > 0" });
    if (!(payload.price >= 0)) return res.status(400).json({ message: "price is required" });
    if (!payload.endsAt) return res.status(400).json({ message: "endsAt is required" });
    if (payload.startsAt && payload.endsAt && payload.endsAt <= payload.startsAt)
      return res.status(400).json({ message: "endsAt must be after startsAt" });

    // compute active from window
    const now = new Date();
    const starts = payload.startsAt || new Date();
    const ends = payload.endsAt;
    payload.startsAt = starts;
    payload.active = starts <= now && now <= ends;

    // ---- Auto-create a Product if none provided so it appears in Shop All & categories ----
    let productId = req.body.product;
    if (!productId) {
      // build unique slug
      const base = slugify(req.body.title || "offer-product");
      let slug = base;
      let attempt = 1;
      // ensure uniqueness
      // eslint-disable-next-line no-await-in-loop
      while (await Product.exists({ slug })) {
        attempt += 1;
        slug = `${base}-${attempt}`;
      }

      const images = req.body?.banner?.url ? [{ url: req.body.banner.url }] : [];

      const productDoc = await Product.create({
        name: req.body.title,
        slug,
        description: req.body.description || "",
        price: Number(req.body.price ?? req.body.amount ?? 0) || 0,
        images,
        isFeatured: false,
        // Optional pass-through taxonomy (only used if client sends them)
        flowerType: req.body.flowerType || null,
        flowerColor: req.body.flowerColor || null,
        occasion: req.body.occasion || null,
        collection: req.body.collection || null,
        tags: Array.isArray(req.body.tags) ? req.body.tags : [],
      });

      productId = productDoc._id;
    }

    payload.product = productId;

    // Create offer
    const created = await Offer.create(payload);

    // Link back to product so dashboards can join if needed
    await Product.updateOne({ _id: productId }, { $set: { offerId: created._id } });

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

/* ---------- PATCH /api/offers/:id (admin) ---------- */
router.patch("/:id", auth, isAdmin, async (req, res, next) => {
  try {
    const partial = normalize(req.body, true);

    const doc = await Offer.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Offer not found" });

    Object.assign(doc, partial);

    // validate key fields if they were provided/changed
    if (doc.discountType && !["percent", "flat"].includes(doc.discountType)) {
      return res.status(400).json({ message: "discountType must be 'percent' or 'flat'" });
    }
    if (doc.amount != null && !(doc.amount > 0)) {
      return res.status(400).json({ message: "discount amount must be > 0" });
    }
    if (doc.price == null || !(doc.price >= 0)) {
      return res.status(400).json({ message: "price is required" });
    }
    if (!doc.endsAt) return res.status(400).json({ message: "endsAt is required" });
    if (doc.startsAt && doc.endsAt && doc.endsAt <= doc.startsAt)
      return res.status(400).json({ message: "endsAt must be after startsAt" });

    const now = new Date();
    doc.active = doc.startsAt <= now && now <= doc.endsAt;

    const updated = await doc.save();
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

/* ---------- DELETE /api/offers/:id (admin) ---------- */
router.delete("/:id", auth, isAdmin, async (req, res, next) => {
  try {
    const removed = await Offer.findByIdAndDelete(req.params.id);
    if (!removed) return res.status(404).json({ message: "Offer not found" });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
