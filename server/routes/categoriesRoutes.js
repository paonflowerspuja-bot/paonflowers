import { Router } from "express";
import Product from "../models/Product.js";
const r = Router();

r.get("/", async (_, res, next) => {
  try {
    const [categories, occasions] = await Promise.all([
      Product.distinct("category"),
      Product.distinct("occasion"),
    ]);
    res.json({
      categories: (categories || []).filter(Boolean),
      occasions: (occasions || []).filter(Boolean),
    });
  } catch (e) {
    next(e);
  }
});

export default r;
