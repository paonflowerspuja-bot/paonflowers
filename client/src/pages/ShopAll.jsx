import React, { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import gsap from "gsap";
import { useCart } from "/src/context/CartContext.jsx";
import localProducts from "../data/productsData"; // fallback data

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

// Helper to build image URLs safely (supports http(s), data:, and local assets with spaces)
const IMG = (p) => {
  if (!p) return "/assets/rose.jpg";
  if (/^(https?:|data:)/i.test(p)) return p; // absolute urls or data URI
  if (p.startsWith("/")) return encodeURI(p);
  return encodeURI(`/assets/${p}`);
};

// Stable, sluggy id fallback (avoids random ids on each add)
const slug = (s = "") =>
  s
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const ShopAll = () => {
  const { dispatch } = useCart();

  // Refs for animations
  const heroRef = useRef(null);
  const promoRefs = useRef([]);
  const sortRef = useRef(null);
  const cardRefs = useRef([]);

  // Local state
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE); // used for local fallback only
  const [sortBy, setSortBy] = useState("featured");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ---- Optional API wiring (server paging) ----
  const fetchPage = async (pageToLoad = 1, replace = false) => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({
        page: String(pageToLoad),
        limit: String(PAGE_SIZE),
        sort: sortBy, // expect API to understand: featured | price-asc | price-desc | name-asc | name-desc
      });
      const res = await fetch(`${API_BASE}/products?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // Expecting { items: [{ _id, name, images, price, mrp, category, badge, ...}], total: number }
      const mapped = Array.isArray(data.items)
        ? data.items.map((p) => ({
            id: p._id || p.id,
            name: p.name || p.title || "Flower",
            image: (Array.isArray(p.images) && p.images[0]) || p.image || p.img,
            price: p.price,
            mrp: p.mrp,
            category: p.category || "Bouquet",
            badge: p.badge,
            isNew: p.isNew,
            bestseller: p.bestseller,
          }))
        : [];

      setItems((prev) => (replace ? mapped : [...prev, ...mapped]));
      setTotal(
        Number(data.total) ||
          (replace ? mapped.length : prev.length + mapped.length)
      );
      setPage(pageToLoad);
    } catch (e) {
      setError("Could not load products.");
      // fallback to local data if first load fails
      if (items.length === 0) {
        const list = Array.isArray(localProducts) ? localProducts : [];
        setItems(list);
        setTotal(list.length);
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial entrances
  useEffect(() => {
    if (heroRef.current) {
      gsap.fromTo(
        heroRef.current,
        { autoAlpha: 0, y: -30 },
        { autoAlpha: 1, y: 0, duration: 0.8, ease: "power2.out" }
      );
    }

    if (promoRefs.current.length) {
      gsap.fromTo(
        promoRefs.current,
        { autoAlpha: 0, y: 30 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
          stagger: 0.15,
          delay: 0.15,
        }
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

  // Load data on mount and when sort changes
  useEffect(() => {
    if (USE_API) {
      fetchPage(1, true);
    } else {
      const list = Array.isArray(localProducts) ? localProducts : [];
      setItems(list);
      setTotal(list.length);
      setVisibleCount(PAGE_SIZE);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy]);

  // ---- Local sorting (for fallback data only) ----
  const sortedLocal = useMemo(() => {
    if (USE_API) return items; // API should return sorted
    const list = Array.isArray(items) ? [...items] : [];
    return list.sort((a, b) => {
      const pa = Number(a?.price) || 0;
      const pb = Number(b?.price) || 0;
      const na = (a?.name || a?.title || "").toLowerCase();
      const nb = (b?.name || b?.title || "").toLowerCase();
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
          return 0; // featured
      }
    });
  }, [items, sortBy]);

  const visibleProducts = USE_API ? items : sortedLocal.slice(0, visibleCount);

  const addToCart = (item) => {
    const base = item?.name || item?.title || "Flower";
    const stable =
      item?.id ||
      item?._id ||
      `${slug(base)}-${slug(String(item?.mrp || item?.price || ""))}`;
    dispatch({
      type: "ADD_TO_CART",
      payload: {
        id: stable,
        name: base,
        image: item?.image || item?.img || "/assets/rose.jpg",
        price: Number(item?.price) || 0,
        quantity: 1,
      },
    });
  };

  // Animate cards every time the visible set changes
  useEffect(() => {
    if (!cardRefs.current.length) return;
    gsap.set(cardRefs.current, { autoAlpha: 1 });
    gsap.fromTo(
      cardRefs.current,
      { autoAlpha: 0, y: 24 },
      { autoAlpha: 1, y: 0, duration: 0.45, ease: "power2.out", stagger: 0.05 }
    );
    return () => {
      // keep refs array length in sync
      cardRefs.current = cardRefs.current.slice(0, visibleProducts.length);
    };
  }, [visibleProducts.length]);

  // Promo tiles (images should be in /public/assets; avoid HEIC in browsers)
  const promos = [
    {
      title: "Fresh Bouquets",
      subtitle: "Hand-tied daily",
      img: "/src/assets/Valentine day/ef7043a7-8c3e-4cad-987e-ff8ebe9b9e77.jpg",
    },
    {
      title: "Seasonal Bestsellers",
      subtitle: "Trending this week",
      img: "/src/assets/Valentine day/ef7043a7-8c3e-4cad-987e-ff8ebe9b9e77.jpg",
    },
    {
      title: "Gifts & Add-ons",
      subtitle: "Teddy • Balloons • Cards",
      // Convert HEIC to JPG/PNG for web compatibility
      img: "/src/assets/Valentine day/ef7043a7-8c3e-4cad-987e-ff8ebe9b9e77.jpg",
    },
  ];

  const onLoadMore = () => {
    if (USE_API) {
      fetchPage(page + 1);
    } else {
      setVisibleCount((c) => c + PAGE_SIZE);
    }
  };

  const totalCount = USE_API ? total : sortedLocal.length;

  return (
    <div className="shop-page">
      <Helmet>
        <title>Shop All Flowers | Paon Flowers</title>
        <meta
          name="description"
          content="Browse all premium bouquets and arrangements. Elegant, fresh and handpicked — Paon Flowers."
        />
      </Helmet>

      {/* HERO */}
      <section className="container py-4">
        <div ref={heroRef} className="mb-3">
          <h1 className="display-6 fw-bold paon-heading">Shop All Flowers</h1>
          <p className="text-muted mb-0">
            Same-day Dubai delivery • Premium stems • Hand-tied with love
          </p>
        </div>

        <div className="row g-3">
          {promos.map((b, i) => (
            <div className="col-md-4" key={i}>
              <div
                className="promo-tile rounded-4 overflow-hidden shadow-sm position-relative"
                ref={(el) => (promoRefs.current[i] = el)}
              >
                <div className="ratio ratio-21x9">
                  <img
                    src={IMG(b.img)}
                    alt={b.title}
                    className="w-100 h-100"
                    style={{ objectFit: "cover" }}
                    onError={(e) => (e.currentTarget.src = "/assets/rose.jpg")}
                  />
                </div>
                <div className="promo-overlay d-flex flex-column justify-content-end p-3">
                  <div>
                    <h5 className="mb-0">{b.title}</h5>
                    <small className="text-muted">{b.subtitle}</small>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SORT BAR */}
      <section className="bg-white border-top border-bottom">
        <div className="container py-3" ref={sortRef}>
          <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center">
            <div className="small text-muted">
              Showing{" "}
              <strong>
                {visibleProducts.length}/{totalCount}
              </strong>{" "}
              items
            </div>
            <div className="d-flex align-items-center gap-2">
              <label className="small text-muted mb-0">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  if (USE_API) setItems([]); // reset list for new sort
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
          {visibleProducts.map((p, idx) => (
            <div
              key={p?.id ?? `prod-${idx}`}
              className="col-6 col-md-4 col-lg-3"
              ref={(el) => (cardRefs.current[idx] = el)}
            >
              <div className="card product-card h-100 border-0 shadow-sm">
                <div className="position-relative">
                  {(p?.badge || p?.isNew || p?.bestseller) && (
                    <span className="badge paon-badge position-absolute m-2">
                      {p?.badge || (p?.isNew ? "New" : "Bestseller")}
                    </span>
                  )}
                  <div className="ratio ratio-1x1">
                    <img
                      src={IMG(p?.image || p?.img || "/assets/rose.jpg")}
                      alt={p?.name || p?.title || "Flower"}
                      className="w-100 h-100"
                      style={{ objectFit: "cover" }}
                      loading="lazy"
                      onError={(e) =>
                        (e.currentTarget.src = "/assets/rose.jpg")
                      }
                    />
                  </div>
                </div>

                <div className="card-body d-flex flex-column">
                  <div className="small text-muted mb-1">
                    {p?.category || "Bouquet"}
                  </div>
                  <h6 className="mb-1 fw-semibold">
                    {p?.name || p?.title || "Elegant Bouquet"}
                  </h6>
                  <div className="mb-2">
                    <span className="fw-bold">{formatCurrency(p?.price)}</span>
                    {p?.mrp && Number(p.mrp) > (Number(p.price) || 0) ? (
                      <small className="text-muted ms-2 text-decoration-line-through">
                        {formatCurrency(p.mrp)}
                      </small>
                    ) : null}
                  </div>

                  <div className="mt-auto d-grid gap-2">
                    <button
                      className="btn btn-pink btn-sm"
                      onClick={() => addToCart(p)}
                    >
                      Add to Cart
                    </button>
                    {/* Quick View removed */}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {visibleProducts.length === 0 && !loading && (
            <div className="col-12">
              <div className="text-center py-5 bg-white rounded-3 shadow-sm">
                <h5 className="mb-1">No products found</h5>
                <p className="text-muted mb-0">
                  Try adjusting your filters or come back soon.
                </p>
              </div>
            </div>
          )}
        </div>

        {loading && (
          <div className="text-center my-4">
            <div className="spinner-border" role="status" />
            <div className="small text-muted mt-2">Loading...</div>
          </div>
        )}

        {(!USE_API ? visibleCount < totalCount : items.length < totalCount) && (
          <div className="text-center mt-4">
            <button className="btn btn-outline-dark px-4" onClick={onLoadMore}>
              Load More
            </button>
          </div>
        )}
      </section>

      {/* RECOMMENDATIONS */}
      <section className="container pb-5">
        <h5 className="fw-semibold mb-3">You may also like</h5>
        <div className="row g-3 g-md-4">
          {(localProducts || []).slice(0, 6).map((p, i) => (
            <div key={`like-${i}`} className="col-6 col-md-4 col-lg-2">
              <div className="card border-0 shadow-sm h-100 mini-card">
                <div className="ratio ratio-1x1 rounded-top overflow-hidden">
                  <img
                    src={IMG(p?.image || p?.img || "/assets/rose.jpg")}
                    alt={p?.name || "Flower"}
                    className="w-100 h-100"
                    style={{ objectFit: "cover" }}
                    loading="lazy"
                    onError={(e) => (e.currentTarget.src = "/assets/rose.jpg")}
                  />
                </div>
                <div className="card-body py-2">
                  <div className="small">{p?.name || "Bouquet"}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recently viewed section removed */}
      </section>
    </div>
  );
};

export default ShopAll;
