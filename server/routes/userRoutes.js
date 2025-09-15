// server/routes/userRoutes.js
import { Router } from "express";
import auth from "../middleware/auth.js";
import isAdmin from "../middleware/isAdmin.js";
import User from "../models/User.js";

const router = Router();

/**
 * GET /api/users  (admin)
 * Also available at /users (alias mounted in server.js)
 * Supports:
 *   ?role=driver|admin|user
 *   ?q=<search>
 *   ?page=1&limit=20&sort=-createdAt
 */
router.get("/", auth, isAdmin, async (req, res, next) => {
  try {
    const {
      role,
      q,
      page = "1",
      limit = "20",
      sort = "-createdAt",
    } = req.query;

    const nPage = Math.max(1, Number(page) || 1);
    const nLimit = Math.max(1, Math.min(Number(limit) || 20, 100));
    const skip = (nPage - 1) * nLimit;

    const filter = {};

    if (role) {
      if (role === "driver") {
        filter.$or = [{ role: "driver" }, { isDriver: true }];
      } else if (role === "admin") {
        filter.$or = [{ role: "admin" }, { isAdmin: true }];
      } else {
        filter.role = role;
      }
    }

    if (q) {
      const rx = new RegExp(String(q).trim(), "i");
      filter.$or = [{ name: rx }, { phone: rx }, { email: rx }];
    }

    const [items, total] = await Promise.all([
      User.find(filter)
        .sort(String(sort).replace(",", " "))
        .skip(skip)
        .limit(nLimit)
        .select("_id name phone email role isAdmin isDriver createdAt"),
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
