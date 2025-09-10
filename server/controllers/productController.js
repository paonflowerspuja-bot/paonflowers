import { z } from "zod";
import Product from "../models/Product.js";
import slugify from "slugify";

const createSchema = z.object({
  name: z.string().min(2),
  slug: z.string().optional(),
  description: z.string().optional().default(""),
  price: z.number().positive(),
  stock: z.number().int().nonnegative().optional().default(100),
  category: z.string().optional(),
  occasion: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  isFeatured: z.boolean().optional().default(false),
});

export const listProducts = async (req, res, next) => {
  try {
    const {
      q,
      category,
      occasion,
      min,
      max,
      sort = "-createdAt",
      page = "1",
      limit = "12",
    } = req.query;

    const filter = {};
    if (q) filter.$text = { $search: q };
    if (category) filter.category = category;
    if (occasion) filter.occasion = occasion;
    if (min || max)
      filter.price = {
        ...(min ? { $gte: +min } : {}),
        ...(max ? { $lte: +max } : {}),
      };

    const skip = (+page - 1) * +limit;
    const [items, total] = await Promise.all([
      Product.find(filter)
        .sort(sort.replace(",", " "))
        .skip(skip)
        .limit(+limit),
      Product.countDocuments(filter),
    ]);

    res.json({
      items,
      pagination: {
        page: +page,
        limit: +limit,
        total,
        pages: Math.ceil(total / +limit),
      },
    });
  } catch (e) {
    next(e);
  }
};

export const getProduct = async (req, res, next) => {
  try {
    const bySlug = await Product.findOne({ slug: req.params.slug });
    if (bySlug) return res.json(bySlug);
    const byId = await Product.findById(req.params.slug);
    if (byId) return res.json(byId);
    res.status(404).json({ message: "Product not found" });
  } catch (e) {
    next(e);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const body = createSchema.parse({
      ...req.body,
      price: Number(req.body.price),
      stock: req.body.stock != null ? Number(req.body.stock) : undefined,
      isFeatured:
        req.body.isFeatured === "true" || req.body.isFeatured === true,
      tags: req.body.tags ? JSON.parse(req.body.tags) : undefined,
    });

    const slug = (
      body.slug || slugify(body.name, { lower: true, strict: true })
    ).slice(0, 120);

    const images = [];
    if (req.file) images.push({ url: `/uploads/${req.file.filename}` });

    const created = await Product.create({ ...body, slug, images });
    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const id = req.params.id;
    const existing = await Product.findById(id);
    if (!existing)
      return res.status(404).json({ message: "Product not found" });

    const partial = createSchema.partial().parse({
      ...req.body,
      price: req.body.price != null ? Number(req.body.price) : undefined,
      stock: req.body.stock != null ? Number(req.body.stock) : undefined,
      isFeatured:
        req.body.isFeatured === "true" || req.body.isFeatured === true
          ? true
          : req.body.isFeatured === "false" || req.body.isFeatured === false
          ? false
          : undefined,
      tags: req.body.tags ? JSON.parse(req.body.tags) : undefined,
    });

    let images = existing.images || [];
    if (req.file)
      images = [{ url: `/uploads/${req.file.filename}` }, ...images];

    const update = {
      ...partial,
      ...(partial.name && {
        slug: slugify(partial.name, { lower: true, strict: true }).slice(
          0,
          120
        ),
      }),
      images,
    };

    const updated = await Product.findByIdAndUpdate(id, update, { new: true });
    res.json(updated);
  } catch (e) {
    next(e);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};
