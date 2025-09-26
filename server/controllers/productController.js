// server/controllers/productController.js
import slugify from "slugify";
import Product, {
  FLOWER_TYPES,
  FLOWER_COLORS,
  OCCASIONS,
  COLLECTIONS,
} from "../models/Product.js";

/* -------------------- helpers -------------------- */

const toArray = (v) => {
  if (v == null) return [];
  if (Array.isArray(v))
    return v
      .map(String)
      .map((s) => s.trim())
      .filter(Boolean);
  const s = String(v).trim();
  if (!s) return [];
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
};

const cap = (s) => String(s || "").trim();

const parseNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const parseBool = (v) => {
  if (v === true || v === false) return v;
  const s = String(v ?? "").toLowerCase();
  if (["1", "true", "yes", "y"].includes(s)) return true;
  if (["0", "false", "no", "n"].includes(s)) return false;
  return undefined;
};

const isObjectId = (s) => /^[0-9a-fA-F]{24}$/.test(String(s));

const inCI = (vals) =>
  vals.length
    ? { $in: vals.map((v) => new RegExp(`^${escapeRegex(v)}$`, "i")) }
    : undefined;

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function makeCanonMap(list) {
  const m = new Map();
  list.forEach((val) => m.set(val.toLowerCase(), val));
  return m;
}

const CANON = {
  flowerType: makeCanonMap(FLOWER_TYPES),
  flowerColor: makeCanonMap(FLOWER_COLORS),
  occasion: makeCanonMap(OCCASIONS),
  collection: makeCanonMap(COLLECTIONS),
};

// normalize common aliases / spellings
const ALIASES = new Map([
  // occasions
  ["valentineday", "Valentine Day"],
  ["graduationday", "Graduation Day"],
  ["newbaby", "New Baby"],
  ["mothersday", "Mother's Day"],
  ["bridalboutique", "Bridal Boutique"],

  // collections
  ["summer", "Summer Collection"],
  ["summercollection", "Summer Collection"],
  ["teddybear", "Teddy Bear"],
  ["teddy", "Teddy Bear"],
  ["balloon", "Balloons"],
  ["balloons", "Balloons"],

  // flower types (spellings)
  ["hydrangea", "Hydrangeia"], // your enum uses Hydrangeia
  ["lily", "Lilly"], // your enum uses Lilly
  ["limonium", "Lemonium"], // common alt spelling
]);

function canonOne(field, val) {
  if (!val) return null;
  const raw = String(val).trim();
  if (!raw) return null;

  const key = raw.toLowerCase().replace(/\s+/g, "").replace(/['’]/g, "");
  const aliasHit = ALIASES.get(key);
  const candidate = aliasHit || raw;

  const map = CANON[field];
  const byKey = candidate.toLowerCase();
  const canon =
    map.get(byKey) ||
    map.get(byKey.replace(/\s+/g, " ")) ||
    map.get(byKey.replace(/['’]/g, ""));

  return canon || null;
}

function pickCanon(field, input) {
  const arr = toArray(input);
  for (const v of arr) {
    const c = canonOne(field, v);
    if (c) return c;
  }
  return null;
}

function listCanon(field, input) {
  const arr = toArray(input);
  const out = [];
  for (const v of arr) {
    const c = canonOne(field, v);
    if (c && !out.includes(c)) out.push(c);
  }
  return out;
}

async function ensureUniqueSlug(base, excludeId) {
  let slug = base;
  let i = 1;
  // eslint-disable-next-line no-constant-condition
  while (
    await Product.findOne({
      slug,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    })
  ) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

function parseTagsFlexible(v) {
  if (Array.isArray(v))
    return v
      .map(String)
      .map((s) => s.trim())
      .filter(Boolean);
  if (v == null) return [];
  const s = String(v).trim();
  if (!s) return [];
  // JSON array string?
  if (
    (s.startsWith("[") && s.endsWith("]")) ||
    (s.startsWith('["') && s.endsWith('"]'))
  ) {
    try {
      const arr = JSON.parse(s);
      return Array.isArray(arr)
        ? arr
            .map(String)
            .map((x) => x.trim())
            .filter(Boolean)
        : [];
    } catch {
      // fall through to CSV
    }
  }
  return toArray(s);
}

/* ---------- IMAGES: collect from various middlewares ---------- */
function normalizeFileObj(f) {
  if (!f) return null;
  const url =
    f.url ||
    f.secure_url ||
    f.cloudinaryUrl ||
    f.location ||
    f.path || // local uploads (served from /uploads)
    null;
  if (!url) return null;
  const publicId = f.publicId || f.public_id || undefined;
  return { url, publicId };
}

function gatherImagesFromReq(req, body) {
  const out = [];

  // 1) our collector middlewares
  const c1 =
    req.filesCollected || req.collectedFiles || req.uploads || req.filesMeta;
  if (Array.isArray(c1)) {
    c1.forEach((f) => {
      const n = normalizeFileObj(f);
      if (n) out.push(n);
    });
  } else if (c1 && typeof c1 === "object") {
    // shapes like { images: [...], files: [...] }
    const pools = [c1.images, c1.files, c1.all];
    pools.forEach((arr) => {
      if (Array.isArray(arr)) {
        arr.forEach((f) => {
          const n = normalizeFileObj(f);
          if (n) out.push(n);
        });
      }
    });
  }

  // 2) plain multer
  if (Array.isArray(req.files)) {
    req.files.forEach((f) => {
      const n = normalizeFileObj(f);
      if (n) out.push(n);
    });
  }
  if (req.file) {
    const n = normalizeFileObj(req.file);
    if (n) out.push(n);
  }

  // 3) body URLs (e.g., image/imageUrl/images[] sent as strings)
  if (body?.image && typeof body.image === "string") {
    out.push({ url: body.image });
  }
  if (Array.isArray(body?.images)) {
    body.images.forEach((u) => {
      if (typeof u === "string") out.push({ url: u });
      else {
        const n = normalizeFileObj(u);
        if (n) out.push(n);
      }
    });
  } else if (body?.images && typeof body.images === "string") {
    toArray(body.images).forEach((u) => out.push({ url: u }));
  }
  if (body?.imageUrl) out.push({ url: String(body.imageUrl) });

  // de-dupe by url
  const seen = new Set();
  const deduped = [];
  for (const img of out) {
    if (img.url && !seen.has(img.url)) {
      seen.add(img.url);
      deduped.push(img);
    }
  }
  return deduped;
}

/* -------------------- CREATE -------------------- */
export const createProduct = async (req, res, next) => {
  try {
    const b = req.body || {};

    const name = cap(b.name);
    if (!name) return res.status(400).json({ error: "Name is required" });

    const price = parseNum(b.price);
    if (price == null)
      return res.status(400).json({ error: "Price is required" });

    const stock = parseNum(b.stock ?? 100) ?? 100;

    const occasion = pickCanon("occasion", b.occasion ?? b.occasions);
    const flowerType = pickCanon("flowerType", b.flowerType ?? b.type);
    const flowerColor = pickCanon(
      "flowerColor",
      b.flowerColor ?? b.color ?? b.colour
    );
    const collection = pickCanon("collection", b.collection ?? b.collections);

    const tags = parseTagsFlexible(b.tags);
    const isFeatured = parseBool(b.isFeatured ?? b.featured) ?? false;

    // IMAGES
    const images = gatherImagesFromReq(req, b);

    const slugBase =
      cap(b.slug) || slugify(name, { lower: true, strict: true });
    const slug = await ensureUniqueSlug(slugBase);

    const doc = await Product.create({
      name,
      slug,
      description: cap(b.description || ""),
      price,
      stock,
      images,
      tags,
      flowerType,
      flowerColor,
      occasion,
      collection,
      isFeatured,
      discount: parseNum(b.discount) ?? 0,
      offerId: b.offerId || undefined,
    });

    res.status(201).json({ ok: true, product: doc });
  } catch (err) {
    next(err);
  }
};

/* --------------------- LIST --------------------- */
export const listProducts = async (req, res, next) => {
  try {
    const {
      q,
      sort = "-createdAt",
      page = "1",
      limit = "12",

      occasion,
      occasions,
      type,
      flowerType,
      color,
      flowerColor,
      colour,
      collection,
      collections,
      category, // alias for collections
      featured,
      isFeatured,

      min,
      max,
    } = req.query;

    const filter = {};

    if (q) filter.$text = { $search: String(q) };

    const occVals = listCanon("occasion", occasion ?? occasions);
    if (occVals.length) filter.occasion = inCI(occVals);

    const typeVals = listCanon("flowerType", flowerType ?? type);
    if (typeVals.length) filter.flowerType = inCI(typeVals);

    const colorVals = listCanon("flowerColor", flowerColor ?? colour ?? color);
    if (colorVals.length) filter.flowerColor = inCI(colorVals);

    const collInputs = toArray(collection ?? collections);
    const cat = String(category || "").toLowerCase();
    if (cat === "balloons") collInputs.push("Balloons");
    if (cat === "teddybear" || cat === "teddy-bear")
      collInputs.push("Teddy Bear");
    if (cat === "summer" || cat === "summercollection")
      collInputs.push("Summer Collection");
    const collVals = listCanon("collection", collInputs);
    if (collVals.length) filter.collection = inCI(collVals);

    const feat = parseBool(isFeatured ?? featured);
    if (feat !== undefined) filter.isFeatured = feat;

    const minP = parseNum(min);
    const maxP = parseNum(max);
    if (minP != null || maxP != null) {
      filter.price = {};
      if (minP != null) filter.price.$gte = minP;
      if (maxP != null) filter.price.$lte = maxP;
    }

    const p = Math.max(1, parseNum(page) ?? 1);
    const lim = Math.max(1, Math.min(50, parseNum(limit) ?? 12));
    const skip = (p - 1) * lim;

    const sortMap = {
      featured: "-isFeatured,-createdAt",
      newest: "-createdAt",
      priceasc: "price",
      pricedesc: "-price",
    };
    const sKey = String(sort).toLowerCase();
    const s = sortMap[sKey] || sort;

    const [items, total] = await Promise.all([
      Product.find(filter).sort(s).skip(skip).limit(lim).lean(),
      Product.countDocuments(filter),
    ]);

    res.json({
      page: p,
      limit: lim,
      total,
      pages: Math.ceil(total / lim),
      items,
    });
  } catch (err) {
    next(err);
  }
};

/* --------------- READ ONE (slug or id) --------------- */
export const getProduct = async (req, res, next) => {
  try {
    const { slugOrId } = req.params; // route should use :slugOrId
    const query = isObjectId(slugOrId) ? { _id: slugOrId } : { slug: slugOrId };
    const doc = await Product.findOne(query).lean();
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) {
    next(err);
  }
};

/* --------------------- UPDATE --------------------- */
export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params; // route uses :id
    if (!isObjectId(id)) return res.status(400).json({ error: "Invalid id" });

    const b = req.body || {};
    const update = {};

    if (b.name != null) update.name = cap(b.name);
    if (b.description != null) update.description = cap(b.description);
    if (b.price != null) update.price = parseNum(b.price);
    if (b.stock != null) update.stock = parseNum(b.stock);

    if (b.tags != null) update.tags = parseTagsFlexible(b.tags);

    // enums (single-string)
    if (b.occasion != null || b.occasions != null)
      update.occasion = pickCanon("occasion", b.occasion ?? b.occasions);
    if (b.flowerType != null || b.type != null)
      update.flowerType = pickCanon("flowerType", b.flowerType ?? b.type);
    if (b.flowerColor != null || b.color != null || b.colour != null)
      update.flowerColor = pickCanon(
        "flowerColor",
        b.flowerColor ?? b.color ?? b.colour
      );
    if (b.collection != null || b.collections != null)
      update.collection = pickCanon(
        "collection",
        b.collection ?? b.collections
      );

    if (b.isFeatured != null || b.featured != null)
      update.isFeatured = parseBool(b.isFeatured ?? b.featured);
    if (b.discount != null) update.discount = parseNum(b.discount);
    if (b.offerId !== undefined) update.offerId = b.offerId || undefined;

    // IMAGES: replace if any new uploads/urls provided
    const newImgs = gatherImagesFromReq(req, b);
    if (newImgs.length) update.images = newImgs;

    // slug if provided or if name changed (ensure uniqueness)
    if (b.slug || b.name) {
      const base =
        cap(b.slug) ||
        (update.name
          ? slugify(update.name, { lower: true, strict: true })
          : "");
      if (base) update.slug = await ensureUniqueSlug(base, id);
    }

    const updated = await Product.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true, product: updated });
  } catch (err) {
    next(err);
  }
};

/* --------------------- DELETE --------------------- */
export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params; // route uses :id
    if (!isObjectId(id)) return res.status(400).json({ error: "Invalid id" });

    const doc = await Product.findByIdAndDelete(id).lean();
    if (!doc) return res.status(404).json({ error: "Not found" });

    // TODO: If using Cloudinary, delete by doc.images[].publicId here.

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};
