import express from "express";
import Product from "../models/Product.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search = "",
      category,
      occasion,
      badge, // if you ever add it
      priceMin,
      priceMax,
      inStock,
      sort = "featured",
    } = req.query;

    // Accept both ?isFeatured=1 and legacy ?featured=1
    const featuredParam = req.query.isFeatured ?? req.query.featured;

    // after your schema
    productSchema.index({
      isFeatured: 1,
      price: 1,
      stock: 1,
      category: 1,
      createdAt: -1,
    });

    const filter = {};
    if (search) filter.$text = { $search: search };
    if (category) filter.category = category;
    if (occasion) filter.occasion = occasion;
    if (featuredParam === "1" || featuredParam === "true")
      filter.isFeatured = true;
    if (inStock === "1") filter.stock = { $gt: 0 };
    if (priceMin || priceMax) {
      filter.price = {};
      if (priceMin) filter.price.$gte = Number(priceMin);
      if (priceMax) filter.price.$lte = Number(priceMax);
    }

    const sortMap = {
      "price-asc": { price: 1 },
      "price-desc": { price: -1 },
      "name-asc": { name: 1 },
      "name-desc": { name: -1 },
      featured: { isFeatured: -1, createdAt: -1 },
    };

    const [items, total] = await Promise.all([
      Product.find(filter)
        .sort(sortMap[sort] || sortMap.featured)
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
