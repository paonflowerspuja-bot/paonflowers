// server/controllers/offerController.js
import Offer from "../models/Offer.js";

export const createOffer = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (await Offer.findOne({ code })) {
      return res.status(409).json({ message: `Offer code "${code}" already exists.` });
    }
    const doc = await Offer.create(req.body);
    res.status(201).json(doc);
  } catch (err) {
    if (err?.code === 11000 && err?.keyPattern?.code) {
      return res.status(409).json({ message: `Offer code "${req.body.code}" already exists.` });
    }
    next(err);
  }
};

export const listOffers = async (req, res, next) => {
  try {
    const { active, product } = req.query;
    const filter = {};
    if (typeof active !== "undefined") {
      const now = new Date();
      filter.startsAt = { $lte: now };
      filter.endsAt = { $gte: now };
    }
    if (product) filter.product = product;
    const rows = await Offer.find(filter).populate("product", "name price images slug");
    res.json(rows);
  } catch (err) {
    next(err);
  }
};
