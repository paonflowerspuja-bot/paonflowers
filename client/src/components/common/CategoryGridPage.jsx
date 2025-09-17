import React, { useEffect, useMemo, useState } from "react";
import api from "../../utils/api";
import { useCart } from "../../context/CartContext";

const CURRENCY = import.meta.env.VITE_CURRENCY || "AED";
const LOCALE = CURRENCY === "AED" ? "en-AE" : "en-IN";
const fmt = (n) =>
  new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: CURRENCY,
  }).format(Number(n) || 0);

// Canonical sets (for back-compat when only `category` is provided)
const COLORS = ["Red", "Pink", "White", "Yellow"];
const TYPES = ["Hydrangeia", "Rose", "Lemonium", "Lilly", "Tulip", "Foliage"];
const OCCASIONS = [
  "Birthday",
  "Valentine Day",
  "Graduation Day",
  "New Baby",
  "Mother's Day",
  "Bridal Boutique",
  "Eid",
];
const COLLECTIONS = ["Summer Collection", "Balloons", "Teddy Bear"];

/** Price helpers */
function getDiscounted(price, discount) {
  const p = Number(price) || 0;
  const d = Number(discount) || 0;
  if (d <= 0) return { final: p, has: false };
  const final = Math.max(0, p - (p * d) / 100);
  return { final, has: true };
}

export default function CategoryGridPage({
  title,
  description,
  heroImg = "/images/backdrop.jpg",
  query = {},
  category,
  pageSize = 12,
}) {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  // cart context
  const cartCtx = useCart(); // { state, dispatch }
  const dispatch = cartCtx?.dispatch;

  const paramsString = useMemo(() => {
    const params = new URLSearchParams({
      limit: String(pageSize),
      sort: "-createdAt",
    });

    // Prefer explicit query prop
    if (query.occasion) params.set("occasion", query.occasion);
    if (query.type || query.flowerType)
      params.set("type", query.type || query.flowerType);
    if (query.color || query.flowerColor || query.colour)
      params.set("color", query.color || query.flowerColor || query.colour);
    if (query.collection || query.collections)
      params.set("collection", query.collection || query.collections);
    if (query.category) params.set("category", query.category);
    if (query.featured === true || query.featured === "1")
      params.set("featured", "1");

    // Back-compat: only `category` passed?
    if (![...params.keys()].length && category) {
      if (COLORS.includes(category)) params.set("color", category);
      else if (TYPES.includes(category)) params.set("type", category);
      else if (OCCASIONS.includes(category)) params.set("occasion", category);
      else if (COLLECTIONS.includes(category))
        params.set("collection", category);
      else if (String(category).toLowerCase() === "featured")
        params.set("featured", "1");
      else params.set("q", category); // fallback search
    }

    return params.toString();
  }, [JSON.stringify(query), category, pageSize]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setErr("");
      try {
        const { data } = await api.get(`/api/products?${paramsString}`);
        setItems(Array.isArray(data) ? data : data.items || []);
      } catch (e) {
        setErr(e?.response?.data?.message || e?.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [paramsString]);

  const handleAddToCart = (p) => {
    if (!dispatch) {
      // optional: silent fallback if provider not mounted
      try {
        const key = "cart";
        const img = p?.images?.[0]?.url || p?.image || "";
        const { final } = getDiscounted(p?.price, p?.discount);
        const payload = {
          id: p?._id || p?.id || p?.slug || String(Math.random()),
          name: p?.name,
          price: Number(final.toFixed ? final.toFixed(2) : final),
          image: img,
        };
        const prev = JSON.parse(localStorage.getItem(key) || "[]");
        const idx = prev.findIndex((it) => it.id === payload.id);
        if (idx >= 0) prev[idx].quantity = (prev[idx].quantity || 1) + 1;
        else prev.push({ ...payload, quantity: 1 });
        localStorage.setItem(key, JSON.stringify(prev));
        window.dispatchEvent(new Event("storage"));
      } catch {}
      return;
    }

    const img = p?.images?.[0]?.url || p?.image || "";
    const { final } = getDiscounted(p?.price, p?.discount);

    dispatch({
      type: "ADD_TO_CART",
      payload: {
        id: p?._id || p?.id || p?.slug, // reducer expects `id`
        name: p?.name,
        price: Number(final.toFixed ? final.toFixed(2) : final),
        image: img,
      },
    });
  };

  return (
    <div>
      {/* Hero */}
      <div
        className="mb-4"
        style={{
          backgroundImage: `url(${heroImg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          borderRadius: 12,
        }}
      >
        <div style={{ backdropFilter: "brightness(0.85)", borderRadius: 12 }}>
          <div className="container py-4">
            <h2 className="mb-1 text-white">{title}</h2>
            {description && <p className="mb-0 text-light">{description}</p>}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="container pb-4">
        {loading ? (
          <div className="text-center p-4">
            <div className="spinner-border" role="status" aria-hidden="true" />
          </div>
        ) : err ? (
          <div className="alert alert-danger">{err}</div>
        ) : items.length === 0 ? (
          <div className="text-muted p-4 text-center">No items found</div>
        ) : (
          <div className="row g-3">
            {items.map((p, i) => {
              const img =
                p?.images?.[0]?.url || p?.image || "/assets/placeholder.png";
              const { final, has } = getDiscounted(p?.price, p?.discount);
              const outOfStock = (Number(p?.stock) || 0) <= 0;

              return (
                <div
                  className="col-6 col-md-4 col-lg-3"
                  key={p._id || p.slug || `p-${i}`}
                >
                  <div className="card h-100 shadow-sm position-relative">
                    {/* Discount badge (like offers page) */}
                    {has && (
                      <span
                        className="badge bg-danger position-absolute"
                        style={{ top: 8, left: 8, zIndex: 2 }}
                      >
                        -{Number(p.discount)}%
                      </span>
                    )}

                    <img
                      src={img}
                      alt={p?.name || "Product"}
                      className="card-img-top"
                      style={{ objectFit: "cover", height: 220 }}
                    />

                    <div className="card-body d-flex flex-column">
                      <div
                        className="fw-semibold text-truncate"
                        title={p?.name}
                      >
                        {p?.name || "—"}
                      </div>

                      {/* Description (2-line clamp) */}
                      <div
                        className="small text-muted mt-1"
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

                      {/* Price */}
                      <div className="mt-2">
                        {has ? (
                          <>
                            <span
                              className="text-muted me-2"
                              style={{ textDecoration: "line-through" }}
                            >
                              {fmt(p?.price)}
                            </span>
                            <span className="fw-bold">{fmt(final)}</span>
                          </>
                        ) : (
                          <span className="fw-bold">{fmt(p?.price)}</span>
                        )}
                      </div>

                      {/* Spacer */}
                      <div style={{ flex: 1 }} />

                      {/* Add to Cart */}
                      <button
                        className="btn btn-pink w-100 mt-2"
                        onClick={() => handleAddToCart(p)}
                        disabled={outOfStock}
                        title={outOfStock ? "Out of stock" : "Add to cart"}
                      >
                        {outOfStock ? "Out of stock" : "Add to Cart"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
