import express from "express";
import Product from "../models/Product.js";
const router = express.Router();

// PATCH /api/admin/products/:id/feature  { isFeatured: true|false }
router.patch("/products/:id/feature", async (req, res) => {
  const { id } = req.params;
  const { isFeatured } = req.body;
  const updated = await Product.findByIdAndUpdate(
    id,
    { isFeatured: !!isFeatured },
    { new: true }
  ).lean();
  res.json(updated);
});

export default router;
