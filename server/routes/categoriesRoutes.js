// server/routes/categoriesRoutes.js
import { Router } from "express";
import {
  FLOWER_TYPES,
  FLOWER_COLORS,
  OCCASIONS,
  COLLECTIONS,
} from "../models/Product.js";

const router = Router();

// GET /api/categories
router.get("/", async (_req, res) => {
  res.json({
    types: FLOWER_TYPES,
    colors: FLOWER_COLORS,
    occasions: OCCASIONS,
    collections: COLLECTIONS,
  });
});

export default router;
