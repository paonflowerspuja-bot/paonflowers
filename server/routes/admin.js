// server/routes/admin.js
import { Router } from "express";
import Offer from "../models/offers.js";
import Product from "../models/Product.js";

// Orders are optional — try to load; if missing, we'll still serve metrics
let Order = null;
try {
  const mod = await import("../models/Order.js");
  Order = mod.default;
} catch {
  // No Order model found; orders metrics will be omitted gracefully
}

const router = Router();

/**
 * GET /api/admin/metrics
 * Query: ?limit=5
 *
 * Returns:
 * {
 *   ok: true,
 *   counts: { products, offers, activeOffers, orders },
 *   latest: { products: [...], offers: [...], orders: [...] },
 *   // Back-compat:
 *   latestProducts: [...],
 *   latestOffers: [...],
 *   latestOrders: [...]
 * }
 */
router.get("/metrics", async (req, res, next) => {
  try {
    const limit = Math.max(1, Math.min(Number(req.query.limit) || 5, 50));
    const now = new Date();

    const activeOfferFilter = {
      active: true,
      $and: [
        { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
        { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] },
      ],
    };

    const [productCount, offerCount, activeOfferCount] = await Promise.all([
      Product.countDocuments({}),
      Offer.countDocuments({}),
      Offer.countDocuments(activeOfferFilter),
    ]);

    const [latestProducts, latestOffers] = await Promise.all([
      Product.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .select("name slug price images createdAt")
        .lean(),
      Offer.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .select("title discountType amount price active startsAt endsAt banner.url createdAt product")
        .populate("product", "name slug images price")
        .lean(),
    ]);

    // Orders are optional — compute if model exists
    let orderCount = 0;
    let latestOrders = [];
    if (Order) {
      orderCount = await Order.countDocuments({});
      latestOrders = await Order.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .select("orderNumber status total createdAt")
        .lean();
    }

    res.json({
      ok: true,
      counts: {
        products: productCount,
        offers: offerCount,
        activeOffers: activeOfferCount,
        orders: orderCount,
      },
      latest: {
        products: latestProducts,
        offers: latestOffers,
        orders: latestOrders,
      },
      // Backward compatibility for UIs that read these top-level keys:
      latestProducts,
      latestOffers,
      latestOrders,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
