// src/pages/ShopAll.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import gsap from "gsap";
import { useCart } from "/src/context/CartContext.jsx";
import localProducts from "../data/productsData"; // fallback only

const PAGE_SIZE = 12;
const API_BASE = import.meta.env.VITE_API_BASE_URL || ""; // e.g. https://api.example.com
const USE_API = !!API_BASE;

const CURRENCY = import.meta.env.VITE_CURRENCY || "AED";
const LOCALE = CURRENCY === "AED" ? "en-AE" : "en-IN";

const formatCurrency = (n) =>
  new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: CURRENCY,
    maximumFractionDigits: 2,
  }).format(Number(n) || 0);

// Compute final price when discount% is present
const getDiscounted = (price, discount) => {
  const p = Number(price) || 0;
  const d = Number(discount) || 0;
  if (d > 0) {
    const final = Math.max(0, p - (p * d) / 100);
    return { final, has: true };
  }
  return { final: p, has: false };
};

// Image helper (supports http(s), data:, /assets)
const IMG = (p) => {
  if (!p) return "/assets/rose.jpg";
  if (/^(https?:|data:)/i.test(p)) return p;
  if (p.startsWith("/")) return encodeURI(p);
  return encodeURI(`/assets/${p}`);
};

const slug = (s = "") =>
  s
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const mapSortToServer = (ui) => {
  switch (ui) {
    case "price-asc":
      return "price";
    case "price-desc":
      return "-price";
    case "name-asc":
      return "name";
    case "name-desc":
      return "-name";
    default:
      return "-createdAt"; // featured/newest
  }
};

// Normalize incoming product (server or local)
const normalizeProduct = (p) => {
  if (!p) return null;
  const img =
    (Array.isArray(p.images) && (p.images[0]?.url || p.images[0])) ||
    p.image ||
    p.img;

  return {
    id: p._id || p.id || p.slug || slug(p.name || p.title || "flower"),
    _id: p._id,
    slug: p.slug,
    name: p.name || p.title || "Flower",
    image: img,
    price: Number(p.price) || 0,
    // prefer % discount from server, otherwise derive from mrp>price (if provided)
    discount:
      typeof p.discount === "number"
        ? p.discount
        : p.mrp && Number(p.mrp) > Number(p.price)
        ? Math.round(((Number(p.mrp) - Number(p.price)) / Number(p.mrp)) * 100)
        : 0,
    mrp: typeof p.mrp === "number" ? p.mrp : Number(p.price) || undefined,
    description: p.description || "",
    // ✅ no default "Bouquet" here anymore
    category: typeof p.category === "string" ? p.category : "",
    badge: p.badge,
    isNew: p.isNew,
    bestseller: p.bestseller,
    stock: typeof p.stock === "number" ? p.stock : 100,
  };
};

/* ---------------- HERO backdrops (auto-rotating) ---------------- */
const HERO_IMAGES = [
  "/images/backdrop.jpg",
  "/images/image1.jpg",
  "/images/paonshop.jpeg",
  "/images/IMG_4759.JPG",
];

const ShopAll = () => {
  const { dispatch, addToCart: ctxAdd } =
    (typeof useCart === "function" && useCart()) || {};

  // GSAP refs
  const heroRef = useRef(null);
  const heroImageRef = useRef(null);
  const sortRef = useRef(null);
  const cardRefs = useRef([]);

  // Hero rotation
  const [heroIdx, setHeroIdx] = useState(0);

  // Data state
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE); // local fallback only
  const [sortBy, setSortBy] = useState("featured");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filters
  const [q, setQ] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");

  // prevent race conditions across fast clicks / rerenders
  const reqIdRef = useRef(0);

  // ---- API paging ----
  const fetchPage = async (pageToLoad = 1, replace = false) => {
    const myReqId = ++reqIdRef.current;
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(pageToLoad),
        limit: String(PAGE_SIZE),
        sort: mapSortToServer(sortBy),
      });
      if (q) params.set("q", q);
      if (min !== "") params.set("min", String(min));
      if (max !== "") params.set("max", String(max));

      const res = await fetch(`${API_BASE}/products?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const serverList = Array.isArray(data)
        ? data
        : data.items || data.products || data.data || [];
      const mapped = serverList.map(normalizeProduct).filter(Boolean);

      // If a newer request finished already, ignore this one
      if (myReqId !== reqIdRef.current) return;

      setItems((prev) => {
        const merged = replace ? mapped : [...prev, ...mapped];
        setTotal(Number(data.total) || merged.length);
        return merged;
      });
      setPage(pageToLoad);
    } catch (e) {
      if (myReqId !== reqIdRef.current) return;
      setError("Could not load products.");
      // fallback only when nothing loaded yet
      setItems((prev) => {
        if (prev.length > 0) return prev;
        const list = (Array.isArray(localProducts) ? localProducts : [])
          .map(normalizeProduct)
          .filter(Boolean);
        setTotal(list.length);
        return list;
      });
    } finally {
      if (myReqId === reqIdRef.current) setLoading(false);
    }
  };

  // Hero & entrance animations
  useEffect(() => {
    if (heroRef.current) {
      gsap.fromTo(
        heroRef.current,
        { autoAlpha: 0, y: -30 },
        { autoAlpha: 1, y: 0, duration: 0.8, ease: "power2.out" }
      );
    }
    if (sortRef.current) {
      gsap.fromTo(
        sortRef.current,
        { autoAlpha: 0, y: 20 },
        { autoAlpha: 1, y: 0, duration: 0.5, delay: 0.2, ease: "power2.out" }
      );
    }
  }, []);

  // Auto-rotate hero background with smooth cross-fade
  useEffect(() => {
    const id = setInterval(() => {
      setHeroIdx((i) => (i + 1) % HERO_IMAGES.length);
      if (heroImageRef.current) {
        gsap.fromTo(
          heroImageRef.current,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.6, ease: "power2.out" }
        );
      }
    }, 5500);
    return () => clearInterval(id);
  }, []);

  // Load on mount & when sort/filters change
  useEffect(() => {
    if (USE_API) {
      fetchPage(1, true);
    } else {
      const list = (Array.isArray(localProducts) ? localProducts : [])
        .map(normalizeProduct)
        .filter(Boolean)
        .filter((p) => {
          const okQ = q
            ? (p.name || "").toLowerCase().includes(q.toLowerCase()) ||
              (p.description || "").toLowerCase().includes(q.toLowerCase())
            : true;
          const price = Number(p.price) || 0;
          const okMin = min !== "" ? price >= Number(min) : true;
          const okMax = max !== "" ? price <= Number(max) : true;
          return okQ && okMin && okMax;
        });
      setItems(list);
      setTotal(list.length);
      setVisibleCount(PAGE_SIZE);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, q, min, max]);

  // Local sort (fallback only)
  const sortedLocal = useMemo(() => {
    if (USE_API) return items;
    const list = Array.isArray(items) ? [...items] : [];
    return list.sort((a, b) => {
      const pa = Number(a?.price) || 0;
      const pb = Number(b?.price) || 0;
      const na = (a?.name || "").toLowerCase();
      const nb = (b?.name || "").toLowerCase();
      switch (sortBy) {
        case "price-asc":
          return pa - pb;
        case "price-desc":
          return pb - pa;
        case "name-asc":
          return na.localeCompare(nb);
        case "name-desc":
          return nb.localeCompare(na);
        default:
          return 0;
      }
    });
  }, [items, sortBy]);

  const visibleProducts = USE_API ? items : sortedLocal.slice(0, visibleCount);

  // Updated Add to Cart: use discounted price if present
  const addToCart = (item) => {
    const base = item?.name || "Flower";
    const stable =
      item?.id ||
      item?._id ||
      item?.slug ||
      `${slug(base)}-${slug(String(item?.price ?? ""))}`;

    const { final } = getDiscounted(item?.price, item?.discount);
    const payload = {
      id: stable,
      _id: item?._id,
      slug: item?.slug,
      name: base,
      image: IMG(item?.image),
      price: Number(final),
      quantity: 1,
    };

    if (typeof ctxAdd === "function") ctxAdd(payload, 1);
    else if (dispatch) dispatch({ type: "ADD_TO_CART", payload });
    else alert("Added to cart");
  };

  // Animate cards when count changes (filter out nulls to avoid GSAP errors)
  useEffect(() => {
    const nodes = (cardRefs.current || []).filter(Boolean);
    if (!nodes.length) return;
    gsap.set(nodes, { autoAlpha: 1 });
    gsap.fromTo(
      nodes,
      { autoAlpha: 0, y: 24 },
      { autoAlpha: 1, y: 0, duration: 0.45, ease: "power2.out", stagger: 0.05 }
    );
    return () => {
      cardRefs.current = cardRefs.current.slice(0, visibleProducts.length);
    };
  }, [visibleProducts.length]);

  const onLoadMore = () => {
    if (USE_API) fetchPage(page + 1);
    else setVisibleCount((c) => c + PAGE_SIZE);
  };

  const totalCount = USE_API ? total : sortedLocal.length;
  const hasMore = USE_API ? items.length < total : visibleCount < totalCount;

  const Skeleton = () => (
    <div className="card product-card h-100 border-0 shadow-sm placeholder-glow">
      <div className="ratio ratio-1x1 bg-light" />
      <div className="card-body">
        <div className="placeholder col-5 mb-2" />
        <div className="placeholder col-8 mb-2" />
        <div className="placeholder col-3" />
      </div>
    </div>
  );

  return (
    <div className="shop-page">
      <Helmet>
        <title>Shop All Flowers | Paon Flowers</title>
        <meta
          name="description"
          content="Browse all premium bouquets and arrangements. Elegant, fresh and handpicked — Paon Flowers."
        />
      </Helmet>

      {/* HERO – modern, responsive, auto-rotating background (fixed layering) */}
      <section
        className="position-relative overflow-hidden"
        style={{ minHeight: "56vh" }}
        ref={heroRef}
      >
        {/* Background image layer */}
        <div
          ref={heroImageRef}
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{
            backgroundImage: `url('${HERO_IMAGES[heroIdx]}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "brightness(0.95)",
          }}
        />
        {/* Soft gradient overlay for readability */}
        <div
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.0) 0%, rgba(255,255,255,0.78) 55%, rgba(255,255,255,0.95) 100%)",
          }}
        />
        {/* Content */}
        <div className="position-relative container py-5" style={{ zIndex: 2 }}>
          <div className="row align-items-center">
            <div className="col-lg-7">
              <h1
                className="fw-bold paon-heading mb-2"
                style={{ fontSize: "clamp(1.8rem, 1.6rem + 2vw, 2.75rem)" }}
              >
                Shop All Flowers
              </h1>
              <p className="text-muted mb-3">
                Same-day Dubai delivery • Premium stems • Hand-tied with love
              </p>

              {/* Quick search inline */}
              <div
                className="input-group input-group-lg"
                style={{ maxWidth: 520 }}
              >
                <span className="input-group-text">Search</span>
                <input
                  type="search"
                  className="form-control"
                  placeholder="Roses, bouquets, pastel…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
            </div>

            {/* Hero stats */}
            <div className="col-lg-5 mt-4 mt-lg-0">
              <div className="row g-3">
                <div className="col-6">
                  <div className="bg-white rounded-4 shadow-sm p-3 text-center">
                    <div className="h4 mb-0">{totalCount || "—"}</div>
                    <div className="small text-muted">Products</div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="bg-white rounded-4 shadow-sm p-3 text-center">
                    <div className="h4 mb-0">AED 0</div>
                    <div className="small text-muted">Free Delivery Over</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FILTER + SORT BAR */}
      <section className="bg-white border-top border-bottom">
        <div className="container py-3" ref={sortRef}>
          <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center">
            <div className="small text-muted">
              Showing <strong>{visibleProducts.length}</strong> of{" "}
              <strong>{totalCount}</strong> items
            </div>

            <div className="d-flex flex-wrap gap-2 align-items-center">
              {/* Price */}
              <div
                className="input-group input-group-sm"
                style={{ width: 220 }}
              >
                <span className="input-group-text">AED</span>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Min"
                  value={min}
                  onChange={(e) => setMin(e.target.value)}
                  min="0"
                />
                <input
                  type="number"
                  className="form-control"
                  placeholder="Max"
                  value={max}
                  onChange={(e) => setMax(e.target.value)}
                  min="0"
                />
              </div>

              {/* Sort */}
              <div className="d-flex align-items-center gap-2">
                <label className="small text-muted mb-0">Sort</label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    if (USE_API) setItems([]); // clean list before new fetch
                  }}
                  className="form-select form-select-sm"
                  style={{ minWidth: 190 }}
                >
                  <option value="featured">Featured</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name-asc">Name: A → Z</option>
                  <option value="name-desc">Name: Z → A</option>
                </select>
              </div>

              {/* Apply (API only) */}
              {USE_API && (
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => fetchPage(1, true)}
                  disabled={loading}
                >
                  Apply
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCT GRID */}
      <section className="container py-4">
        {error && (
          <div className="alert alert-warning small" role="alert">
            {error}
          </div>
        )}

        <div className="row g-3 g-md-4">
          {loading &&
            items.length === 0 &&
            Array.from({ length: 8 }).map((_, i) => (
              <div key={`sk-${i}`} className="col-6 col-md-4 col-lg-3">
                <Skeleton />
              </div>
            ))}

          {visibleProducts.map((p, idx) => {
            const { final, has } = getDiscounted(p.price, p.discount);
            const outOfStock = (Number(p?.stock) || 0) <= 0;

            return (
              <div
                key={p?.id ?? `prod-${idx}`}
                className="col-6 col-md-4 col-lg-3"
                ref={(el) => (cardRefs.current[idx] = el)}
              >
                <div className="card product-card h-100 border-0 shadow-sm position-relative">
                  {/* Discount badge OR legacy badge */}
                  {has ? (
                    <span
                      className="badge bg-danger position-absolute m-2"
                      style={{ zIndex: 2 }}
                    >
                      -{Number(p.discount)}%
                    </span>
                  ) : p?.badge || p?.isNew || p?.bestseller ? (
                    <span className="badge paon-badge position-absolute m-2">
                      {p?.badge || (p?.isNew ? "New" : "Bestseller")}
                    </span>
                  ) : null}

                  <div className="ratio ratio-1x1">
                    <img
                      src={IMG(p?.image)}
                      alt={p?.name || "Flower"}
                      className="w-100 h-100"
                      style={{ objectFit: "cover" }}
                      loading="lazy"
                      onError={(e) =>
                        (e.currentTarget.src = "/assets/rose.jpg")
                      }
                    />
                  </div>

                  <div className="card-body d-flex flex-column">
                    {/* ✅ Show category only if it exists; no default “Bouquet” */}
                    {p?.category ? (
                      <div className="small text-muted mb-1">{p.category}</div>
                    ) : null}

                    <h6
                      className="mb-1 fw-semibold text-truncate"
                      title={p?.name}
                    >
                      {p?.name}
                    </h6>

                    {/* Description (2-line clamp) */}
                    <div
                      className="small text-muted mb-2"
                      title={p?.description || ""}
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        minHeight: "2.5em",
                      }}
                    >
                      {p?.description || ""}
                    </div>

                    {/* Price with discount display */}
                    <div className="mb-2">
                      {has ? (
                        <>
                          <span
                            className="text-muted me-2"
                            style={{ textDecoration: "line-through" }}
                          >
                            {formatCurrency(p?.price)}
                          </span>
                          <span className="fw-bold">
                            {formatCurrency(final)}
                          </span>
                        </>
                      ) : p?.mrp && Number(p.mrp) > (Number(p.price) || 0) ? (
                        <>
                          <span
                            className="text-muted me-2"
                            style={{ textDecoration: "line-through" }}
                          >
                            {formatCurrency(p.mrp)}
                          </span>
                          <span className="fw-bold">
                            {formatCurrency(p?.price)}
                          </span>
                        </>
                      ) : (
                        <span className="fw-bold">
                          {formatCurrency(p?.price)}
                        </span>
                      )}
                    </div>

                    {/* Only Add to Cart */}
                    <div className="mt-auto d-grid">
                      <button
                        className="btn btn-pink btn-sm"
                        onClick={() => addToCart(p)}
                        disabled={outOfStock}
                        title={outOfStock ? "Out of stock" : "Add to cart"}
                      >
                        {outOfStock ? "Unavailable in Dubai" : "Add to Cart"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {visibleProducts.length === 0 && !loading && (
            <div className="col-12">
              <div className="text-center py-5 bg-white rounded-3 shadow-sm">
                <h5 className="mb-1">No products found</h5>
                <p className="text-muted mb-0">
                  Try adjusting search or price range, or come back soon.
                </p>
              </div>
            </div>
          )}
        </div>

        {loading && items.length > 0 && (
          <div className="text-center my-4">
            <div className="spinner-border" role="status" />
            <div className="small text-muted mt-2">Loading more…</div>
          </div>
        )}

        {hasMore && !loading && (
          <div className="text-center mt-4">
            <button className="btn btn-outline-dark px-4" onClick={onLoadMore}>
              Load More
            </button>
          </div>
        )}
      </section>

      {/* RECOMMENDATIONS — shown only when NOT using API (fallback dev data) */}
      {!USE_API && (
        <section className="container pb-5">
          <h5 className="fw-semibold mb-3">You may also like</h5>
          <div className="row g-3 g-md-4">
            {(localProducts || []).slice(0, 6).map((p, i) => (
              <div key={`like-${i}`} className="col-6 col-md-4 col-lg-2">
                <div className="card border-0 shadow-sm h-100 mini-card">
                  <div className="ratio ratio-1x1 rounded-top overflow-hidden">
                    <img
                      src={IMG(
                        (Array.isArray(p.images) &&
                          (p.images[0]?.url || p.images[0])) ||
                          p.image ||
                          p.img
                      )}
                      alt={p?.name || "Flower"}
                      className="w-100 h-100"
                      style={{ objectFit: "cover" }}
                      loading="lazy"
                      onError={(e) =>
                        (e.currentTarget.src = "/assets/rose.jpg")
                      }
                    />
                  </div>
                  <div className="card-body py-2">
                    <div className="small text-truncate">
                      {p?.name || "Bouquet"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ShopAll;
