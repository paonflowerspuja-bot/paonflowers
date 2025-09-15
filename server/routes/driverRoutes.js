// server/routes/driverRoutes.js
import { Router } from "express";
import auth from "../middleware/auth.js";
import isAdmin from "../middleware/isAdmin.js";
import User from "../models/User.js";

const router = Router();

/**
 * GET /api/drivers  (admin)
 * Also available at /drivers (alias mounted in server.js)
 * Supports ?q= search, ?limit=, ?page=, ?sort=
 */
router.get("/", auth, isAdmin, async (req, res, next) => {
  try {
    const { q, page = "1", limit = "50", sort = "name" } = req.query;

    const nPage = Math.max(1, Number(page) || 1);
    const nLimit = Math.max(1, Math.min(Number(limit) || 50, 100));
    const skip = (nPage - 1) * nLimit;

    const filter = {
      $or: [{ role: "driver" }, { isDriver: true }], // support either field
    };

    if (q) {
      const rx = new RegExp(String(q).trim(), "i");
      filter.$and = [{ $or: [{ name: rx }, { phone: rx }, { email: rx }] }];
    }

    const [items, total] = await Promise.all([
      User.find(filter)
        .sort(String(sort).replace(",", " "))
        .skip(skip)
        .limit(nLimit)
        .select("_id name phone email role isDriver createdAt"),
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

export default router;
