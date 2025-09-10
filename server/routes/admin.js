// server/routes/admin.js
import { Router } from "express";
import Product from "../models/Product.js";
import Order from "../models/Order.js";

const router = Router();

/**
 * GET /api/admin/metrics
 * Returns basic dashboard metrics.
 *
 * - productsCount: total products
 * - ordersCount: total orders
 * - revenueToday: sum of order.total for orders created today with a "successful" status
 * - lowStockCount: products with stock <= 5 (tweak threshold if you like)
 */
router.get("/metrics", async (req, res, next) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    // Adjust these statuses to match your Order schema’s “successful/paid” states
    const SUCCESS_STATUSES = ["paid", "delivered", "completed"];

    const [
      productsCount,
      ordersCount,
      revenueAgg,
      lowStockCount,
    ] = await Promise.all([
      Product.countDocuments({}),
      Order.countDocuments({}),
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfToday, $lt: startOfTomorrow },
            status: { $in: SUCCESS_STATUSES },
          },
        },
        { $group: { _id: null, revenue: { $sum: "$total" } } },
      ]),
      Product.countDocuments({ stock: { $gte: 0, $lte: 5 } }), // threshold=5
    ]);

    const revenueToday = revenueAgg?.[0]?.revenue || 0;

    res.json({
      productsCount,
      ordersCount,
      revenueToday,
      lowStockCount,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
