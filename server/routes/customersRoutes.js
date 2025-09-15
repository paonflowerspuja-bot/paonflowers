// server/routes/customersRoutes.js
import { Router } from "express";
import auth from "../middleware/auth.js";
import isAdmin from "../middleware/isAdmin.js";
import User from "../models/User.js";
import Order from "../models/Order.js";

const router = Router();

/**
 * GET /api/customers (admin)
 * Also available at /customers (alias in server.js)
 * Query: ?page=1&limit=10&sort=-createdAt&q=ali
 * Returns: { items, pagination }
 */
router.get("/", auth, isAdmin, async (req, res, next) => {
  try {
    const { q, page = "1", limit = "10", sort = "-createdAt" } = req.query;

    const nPage = Math.max(1, Number(page) || 1);
    const nLimit = Math.max(1, Math.min(Number(limit) || 10, 100));
    const skip = (nPage - 1) * nLimit;

    // "Customers" = not admins (and not explicit drivers)
    const filter = {
      $and: [
        { $or: [{ isAdmin: { $exists: false } }, { isAdmin: false }] },
        {
          $or: [
            { role: { $exists: false } },
            { role: { $in: ["user", null, ""] } },
          ],
        },
      ],
    };

    if (q) {
      const rx = new RegExp(String(q).trim(), "i");
      filter.$or = [{ name: rx }, { phone: rx }, { email: rx }];
    }

    const [items, total] = await Promise.all([
      User.find(filter)
        .sort(String(sort).replace(",", " "))
        .skip(skip)
        .limit(nLimit)
        .select("_id name phone email location role isAdmin createdAt"),
      User.countDocuments(filter),
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

/**
 * OPTIONAL: list a customer's orders (admin)
 * GET /api/customers/:id/orders?page=1&limit=10&sort=-createdAt
 * Returns: { items, pagination }
 */
router.get("/:id/orders", auth, isAdmin, async (req, res, next) => {
  try {
    const { page = "1", limit = "10", sort = "-createdAt" } = req.query;

    const nPage = Math.max(1, Number(page) || 1);
    const nLimit = Math.max(1, Math.min(Number(limit) || 10, 100));
    const skip = (nPage - 1) * nLimit;

    const userId = req.params.id;

    const [items, total] = await Promise.all([
      Order.find({ user: userId })
        .sort(String(sort).replace(",", " "))
        .skip(skip)
        .limit(nLimit)
        .select("_id createdAt status pricing total shipping delivery"),
      Order.countDocuments({ user: userId }),
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
