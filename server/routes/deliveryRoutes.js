// server/routes/deliveryRoutes.js
import { Router } from "express";
import auth from "../middleware/auth.js";
import isAdmin from "../middleware/isAdmin.js";
import Order from "../models/Order.js";

const router = Router();

/**
 * GET /api/deliveries  (admin)
 * Also available at /deliveries (alias mounted in server.js)
 * Query:
 *   page=1&limit=10&sort=-createdAt
 *   start=ISODate   end=ISODate  (filters window)
 *   status=pending|out_for_delivery|delivered|... (optional)
 */
router.get("/", auth, isAdmin, async (req, res, next) => {
  try {
    const {
      page = "1",
      limit = "10",
      sort = "-createdAt",
      start,
      end,
      status,
    } = req.query;

    const nPage = Math.max(1, Number(page) || 1);
    const nLimit = Math.max(1, Math.min(Number(limit) || 10, 50));
    const skip = (nPage - 1) * nLimit;

    const filter = {};

    // date window: try common fields used for delivery date; fallback to createdAt
    if (start || end) {
      const startDate = start ? new Date(start) : new Date(0);
      const endDate = end
        ? new Date(end)
        : new Date(Date.now() + 365 * 24 * 3600 * 1000);

      // match if ANY of these date fields fall in range
      filter.$or = [
        { "delivery.date": { $gte: startDate, $lt: endDate } },
        { deliveryDate: { $gte: startDate, $lt: endDate } },
        { createdAt: { $gte: startDate, $lt: endDate } },
      ];
    }

    if (status) {
      filter.status = status;
    }

    // Keep it schema-safe: don’t populate unknown paths
    const [items, total] = await Promise.all([
      Order.find(filter)
        .sort(String(sort).replace(",", " "))
        .skip(skip)
        .limit(nLimit)
        .select(
          "_id createdAt status pricing user " +
            "delivery deliveryDate shipping shippingAddress"
        ),
      Order.countDocuments(filter),
    ]);

    res.json({
      items,
      pagination: {
        page: nPage,
        limit: nLimit,
        total,
        pages: Math.ceil(total / nLimit),
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
