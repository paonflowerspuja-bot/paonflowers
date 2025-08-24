// src/pages/FeaturedFlowers.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
// Optional: useCart if you want "Add to Cart" (it will safely no-op if missing)
let useCart;
try {
  ({ useCart } = await import("/src/context/CartContext.jsx"));
} catch {
  /* optional */
}

// Fallback local data (optional; remove if you don't have it)
let localProducts = [];
try {
  ({ default: localProducts } = await import("../data/productsData"));
} catch {
  /* optional */
}

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const PAGE_SIZE = 12;
const CURRENCY = import.meta.env.VITE_CURRENCY || "AED";
const LOCALE = CURRENCY === "AED" ? "en-AE" : "en-IN";

const formatCurrency = (n) =>
  new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: CURRENCY,
  }).format(Number(n) || 0);

const IMG = (p) => {
  if (!p) return "/assets/rose.jpg";
  if (/^(https?:|data:)/i.test(p)) return p;
  if (p.startsWith("/")) return encodeURI(p);
  return encodeURI(`/assets/${p}`);
};

const badges = ["New", "Bestseller", "Limited"];

const FeaturedFlowers = () => {
  const cartCtx = useCart ? useCart() : null;

  // Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [badge, setBadge] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [inStock, setInStock] = useState(false);
  const [featuredOnly, setFeaturedOnly] = useState(true);
  const [sort, setSort] = useState("featured");

  // Data/paging
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [error, setError] = useState("");

  const heroRef = useRef(null);

  // Compute category list dynamically from loaded items (fallback) + local
  const allCats = useMemo(() => {
    const pool = [...items, ...localProducts];
    const set = new Set(pool.map((p) => p?.category).filter(Boolean));
    return Array.from(set);
  }, [items]);

  // Build query string for server
  const buildParams = (pageToLoad) => {
    const params = new URLSearchParams({
      page: String(pageToLoad),
      limit: String(PAGE_SIZE),
      sort,
      ...(search ? { search } : {}),
      ...(category ? { category } : {}),
      ...(badge ? { badge } : {}),
      ...(priceMin ? { priceMin: String(priceMin) } : {}),
      ...(priceMax ? { priceMax: String(priceMax) } : {}),
      ...(inStock ? { inStock: "1" } : {}),
      ...(featuredOnly ? { featured: "1" } : {}),
    });
    return params.toString();
  };

  // Fetch from public products route if available; fallback to local
  const fetchPage = async (pageToLoad = 1, replace = false) => {
    setLoading(true);
    setError("");
    try {
      const qs = buildParams(pageToLoad);
      const res = await fetch(`${API_BASE}/products?${qs}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const mapped = (data.items || data).map((p) => ({
        id: p._id || p.id,
        name: p.name || p.title || "Flower",
        description: p.description || "",
        price: Number(p.price) || 0,
        mrp: Number(p.mrp) || 0,
        category: p.category || "Bouquet",
        images: Array.isArray(p.images)
          ? p.images
          : p.image || p.img
          ? [{ url: p.image || p.img }]
          : [],
        stock: p.stock ?? 0,
        badge: p.badge || (p.isNew ? "New" : p.bestseller ? "Bestseller" : ""),
        isActive: p.isActive ?? true,
      }));

      setItems((prev) => (replace ? mapped : [...prev, ...mapped]));
      setTotal(
        Number(data.total) ||
          (replace ? mapped.length : (prev?.length || 0) + mapped.length)
      );
      setPage(pageToLoad);
      setInitialLoaded(true);
    } catch (e) {
      // Fallback to local if first load fails
      if (
        !initialLoaded &&
        Array.isArray(localProducts) &&
        localProducts.length
      ) {
        setItems(localProducts);
        setTotal(localProducts.length);
        setInitialLoaded(true);
      } else {
        setError("Could not load products.");
      }
    } finally {
      setLoading(false);
    }
  };

  // First load + when sort changes
  useEffect(() => {
    setItems([]);
    setPage(1);
    fetchPage(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort]);

  // Debounce “search” & filter changes
  useEffect(() => {
    const t = setTimeout(() => {
      setItems([]);
      fetchPage(1, true);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, badge, priceMin, priceMax, inStock, featuredOnly]);

  // Client-side filter for fallback/local (if API ignores extra params)
  const filtered = useMemo(() => {
    let list = items;
    // When API doesn't implement some filters (fallback path),
    // apply client-side filtering:
    if (initialLoaded && !loading && (!total || total === items.length)) {
      if (featuredOnly) {
        list = list.filter(
          (p) =>
            p.badge === "Bestseller" ||
            p.badge === "Limited" ||
            p.badge === "New"
        );
      }
      if (category)
        list = list.filter(
          (p) => (p.category || "").toLowerCase() === category.toLowerCase()
        );
      if (badge) list = list.filter((p) => (p.badge || "") === badge);
      if (search) {
        const q = search.toLowerCase();
        list = list.filter(
          (p) =>
            (p.name || "").toLowerCase().includes(q) ||
            (p.description || "").toLowerCase().includes(q)
        );
      }
      if (priceMin)
        list = list.filter((p) => Number(p.price) >= Number(priceMin));
      if (priceMax)
        list = list.filter((p) => Number(p.price) <= Number(priceMax));
      if (inStock) list = list.filter((p) => Number(p.stock || 0) > 0);
      // local sort
      list = [...list].sort((a, b) => {
        const pa = Number(a.price) || 0;
        const pb = Number(b.price) || 0;
        const na = (a.name || "").toLowerCase();
        const nb = (b.name || "").toLowerCase();
        switch (sort) {
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
    }
    return list;
  }, [
    items,
    initialLoaded,
    loading,
    total,
    featuredOnly,
    category,
    badge,
    search,
    priceMin,
    priceMax,
    inStock,
    sort,
  ]);

  const onLoadMore = () => fetchPage(page + 1);

  const addToCart = (p) => {
    if (!cartCtx) return; // no-op if CartContext not present
    cartCtx.dispatch({
      type: "ADD_TO_CART",
      payload: {
        id: p.id || p._id || `${(p.name || "flower").toLowerCase()}-${p.price}`,
        name: p.name || "Flower",
        image: p.images?.[0]?.url || p.image || "/assets/rose.jpg",
        price: Number(p.price) || 0,
        quantity: 1,
      },
    });
  };

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setBadge("");
    setPriceMin("");
    setPriceMax("");
    setInStock(false);
    setFeaturedOnly(true);
    setSort("featured");
  };

  // ----- UI -----
  return (
    <div className="featured-page">
      <Helmet>
        <title>Featured Flowers | Paon Flowers</title>
        <meta
          name="description"
          content="Discover trending, bestselling, and new floral arrangements from Paon Flowers."
        />
      </Helmet>

      {/* HERO */}
      <section
        ref={heroRef}
        className="py-5 position-relative"
        style={{
          background:
            "linear-gradient(120deg, rgba(255,192,203,0.15), rgba(255,255,255,0.6)), url('/assets/hero/featured-flowers.jpg') center/cover no-repeat",
        }}
      >
        <div className="container">
          <div className="row align-items-center g-4">
            <div className="col-lg-7">
              <h1 className="display-5 fw-bold">Featured Flowers</h1>
              <p className="lead text-muted mb-0">
                Handpicked bestsellers, seasonal favorites, and new arrivals.
                Same-day Dubai delivery.
              </p>
            </div>
            <div className="col-lg-5">
              <div className="bg-white shadow rounded-4 p-3 p-md-4">
                <div className="row g-2">
                  <div className="col-md-6">
                    <label className="form-label small mb-1">Search</label>
                    <input
                      className="form-control"
                      placeholder="Roses, tulips..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="col-6 col-md-3">
                    <label className="form-label small mb-1">Min</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="0"
                      value={priceMin}
                      min="0"
                      onChange={(e) => setPriceMin(e.target.value)}
                    />
                  </div>
                  <div className="col-6 col-md-3">
                    <label className="form-label small mb-1">Max</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="1000"
                      value={priceMax}
                      min="0"
                      onChange={(e) => setPriceMax(e.target.value)}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small mb-1">Category</label>
                    <select
                      className="form-select"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="">All</option>
                      {allCats.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small mb-1">Badge</label>
                    <select
                      className="form-select"
                      value={badge}
                      onChange={(e) => setBadge(e.target.value)}
                    >
                      <option value="">Any</option>
                      {badges.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-6">
                    <div className="form-check mt-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="instock"
                        checked={inStock}
                        onChange={(e) => setInStock(e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="instock">
                        In stock only
                      </label>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="form-check mt-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="featured"
                        checked={featuredOnly}
                        onChange={(e) => setFeaturedOnly(e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="featured">
                        Featured only
                      </label>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small mb-1">Sort by</label>
                    <select
                      className="form-select"
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                    >
                      <option value="featured">Featured</option>
                      <option value="price-asc">Price: Low → High</option>
                      <option value="price-desc">Price: High → Low</option>
                      <option value="name-asc">Name: A → Z</option>
                      <option value="name-desc">Name: Z → A</option>
                    </select>
                  </div>

                  <div className="col-md-6 d-flex align-items-end">
                    <button
                      type="button"
                      className="btn btn-outline-secondary w-100"
                      onClick={clearFilters}
                    >
                      Clear filters
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RESULTS BAR */}
      <section className="bg-white border-top border-bottom">
        <div className="container py-3">
          <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center">
            <div className="small text-muted">
              Showing <strong>{filtered.length || items.length}</strong>
              {total ? (
                <>
                  {" "}
                  of <strong>{total}</strong>
                </>
              ) : null}{" "}
              items
            </div>
            <div className="d-flex align-items-center gap-2">
              {loading && (
                <>
                  <div
                    className="spinner-border spinner-border-sm"
                    role="status"
                  />
                  <span className="small text-muted">Loading…</span>
                </>
              )}
              {error && (
                <span className="badge text-bg-warning">Network issue</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* GRID */}
      <section className="container py-4">
        <div className="row g-3 g-md-4">
          {(loading && !items.length
            ? Array.from({ length: 12 })
            : filtered
          ).map((p, idx) => (
            <div key={p?.id || idx} className="col-6 col-md-4 col-lg-3">
              <div className="card h-100 border-0 shadow-sm">
                <div className="position-relative">
                  {p?.badge && (
                    <span className="badge text-bg-danger position-absolute m-2">
                      {p.badge}
                    </span>
                  )}
                  <div className="ratio ratio-1x1">
                    {loading && !items.length ? (
                      <div className="placeholder w-100 h-100" />
                    ) : (
                      <img
                        src={IMG(p?.images?.[0]?.url || p?.image || p?.img)}
                        alt={p?.name || "Flower"}
                        className="w-100 h-100"
                        style={{ objectFit: "cover" }}
                        loading="lazy"
                        onError={(e) =>
                          (e.currentTarget.src = "/assets/rose.jpg")
                        }
                      />
                    )}
                  </div>
                </div>
                <div className="card-body d-flex flex-column">
                  {loading && !items.length ? (
                    <>
                      <span className="placeholder col-6 mb-2" />
                      <span className="placeholder col-4" />
                    </>
                  ) : (
                    <>
                      <div className="small text-muted mb-1">
                        {p?.category || "Bouquet"}
                      </div>
                      <h6 className="mb-1 fw-semibold">
                        {p?.name || "Elegant Bouquet"}
                      </h6>
                      <div className="mb-2">
                        <span className="fw-bold">
                          {formatCurrency(p?.price)}
                        </span>
                        {p?.mrp > p?.price ? (
                          <small className="text-muted ms-2 text-decoration-line-through">
                            {formatCurrency(p?.mrp)}
                          </small>
                        ) : null}
                      </div>
                      <div className="mt-auto d-grid gap-2">
                        <button
                          className="btn btn-pink btn-sm"
                          onClick={() => addToCart && addToCart(p)}
                          disabled={!cartCtx}
                          title={
                            cartCtx
                              ? "Add to Cart"
                              : "Cart not available in this view"
                          }
                        >
                          Add to Cart
                        </button>
                        {/* No quick view on this page */}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More (server paging) */}
        {items.length < total && (
          <div className="text-center mt-4">
            <button
              className="btn btn-outline-dark px-4"
              onClick={onLoadMore}
              disabled={loading}
            >
              {loading ? "Loading…" : "Load More"}
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && initialLoaded && filtered.length === 0 && (
          <div className="text-center py-5 bg-white rounded-3 shadow-sm mt-3">
            <h5 className="mb-1">No matching products</h5>
            <p className="text-muted mb-0">Try adjusting your filters.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default FeaturedFlowers;
