// // server/routes/offerRoutes.js
// import { Router } from "express";
// import Offer from "../models/Offer.js";
// import auth, { isAdmin } from "../middleware/auth.js";

// const router = Router();

// // GET /api/offers?limit=10&page=1&sort=-createdAt
// router.get("/", async (req, res, next) => {
//   try {
//     const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
//     const page = Math.max(1, parseInt(req.query.page) || 1);
//     const sortRaw = (req.query.sort || "-createdAt").toString();
//     // sanitize simple sort: allow comma/space-separated field names with optional leading '-'
//     const sort = sortRaw
//       .split(/[,\s]+/)
//       .filter(Boolean)
//       .map((s) => s.replace(/[^a-zA-Z0-9_-]/g, ""))
//       .join(" ");

//     const q = {}; // extend with filters if you need later

//     const [items, total] = await Promise.all([
//       Offer.find(q).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
//       Offer.countDocuments(q),
//     ]);

//     res.json({
//       items,
//       total,
//       page,
//       pages: Math.max(1, Math.ceil(total / limit)),
//     });
//   } catch (err) {
//     next(err);
//   }
// });

// // POST /api/offers  (admin)
// router.post("/", auth, isAdmin, async (req, res, next) => {
//   try {
//     const payload = req.body || {};
//     const offer = await Offer.create({
//       title: payload.title,
//       description: payload.description,
//       code: payload.code,
//       discountType: payload.discountType || "percent",
//       discountValue: Number(payload.discountValue ?? 0),
//       minSubtotal: Number(payload.minSubtotal ?? 0),
//       active: !!payload.active,
//       startsAt: payload.startsAt || null,
//       endsAt: payload.endsAt || null,
//     });
//     res.status(201).json(offer);
//   } catch (err) {
//     next(err);
//   }
// });

// // PUT /api/offers/:id  (admin)
// router.put("/:id", auth, isAdmin, async (req, res, next) => {
//   try {
//     const id = req.params.id;
//     const payload = req.body || {};
//     const updated = await Offer.findByIdAndUpdate(
//       id,
//       {
//         $set: {
//           title: payload.title,
//           description: payload.description,
//           code: payload.code,
//           discountType: payload.discountType,
//           discountValue: Number(payload.discountValue),
//           minSubtotal: Number(payload.minSubtotal),
//           active: !!payload.active,
//           startsAt: payload.startsAt || null,
//           endsAt: payload.endsAt || null,
//         },
//       },
//       { new: true, runValidators: true }
//     ).lean();

//     if (!updated) return res.status(404).json({ message: "Offer not found" });
//     res.json(updated);
//   } catch (err) {
//     next(err);
//   }
// });

// // DELETE /api/offers/:id  (admin)
// router.delete("/:id", auth, isAdmin, async (req, res, next) => {
//   try {
//     const id = req.params.id;
//     const out = await Offer.findByIdAndDelete(id).lean();
//     if (!out) return res.status(404).json({ message: "Offer not found" });
//     res.json({ ok: true });
//   } catch (err) {
//     next(err);
//   }
// });

// export default router;
