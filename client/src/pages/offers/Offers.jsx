// client/src/pages/offers/Offers.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../utils/api";
import { useCart } from "/src/context/CartContext.jsx"; // optional but preferred

const CURRENCY = import.meta.env.VITE_CURRENCY || "AED";
const LOCALE =
  import.meta.env.VITE_LOCALE || (CURRENCY === "AED" ? "en-AE" : "en-IN");

const money = (n) =>
  new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: CURRENCY,
  }).format(Number(n) || 0);

const firstImage = (o) =>
  o?.banner?.url || o?.product?.images?.[0]?.url || "/assets/placeholder.png";

const originalPrice = (offer) => {
  const prodPrice = Number(offer?.product?.price);
  return Number.isFinite(prodPrice) ? prodPrice : Number(offer?.price || 0);
};

const discountedPrice = (offer) => {
  const orig = originalPrice(offer);
  const amt = Number(offer?.amount || 0);
  if (!amt || orig <= 0) return orig;
  return offer?.discountType === "percent"
    ? Math.max(0, +(orig - (orig * amt) / 100).toFixed(2))
    : Math.max(0, +(orig - amt).toFixed(2));
};

const discountBadgeText = (offer) => {
  const amt = Number(offer?.amount || 0);
  if (!amt) return null;
  return offer?.discountType === "percent" ? `-${amt}%` : `Save ${money(amt)}`;
};

// Fallback cart writer for when CartContext isn't available
function addItemToCartLocal(item) {
  try {
    window.dispatchEvent(new CustomEvent("cart:add", { detail: item }));

    const read = (k) => {
      try {
        const raw = localStorage.getItem(k);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    };
    const write = (k, v) => {
      try {
        localStorage.setItem(k, JSON.stringify(v));
      } catch {}
    };

    const current = read("pf_cart") ?? read("cart") ?? [];
    const idx = current.findIndex((x) => x?._id === item._id);
    if (idx >= 0) current[idx].qty = (Number(current[idx].qty) || 0) + item.qty;
    else current.push(item);

    write("pf_cart", current);
    write("cart", current);
    window.dispatchEvent(new Event("cart:changed"));
  } catch {}
}

export default function Offers() {
  const cart = (() => {
    try {
      return useCart();
    } catch {
      return null;
    }
  })();

  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      // server now populates product here
      const { data } = await api.get("/api/offers/public");
      const items = Array.isArray(data) ? data : data.items || [];
      setOffers(items);
    } catch (e) {
      setErr(
        e?.response?.data?.message || e?.message || "Failed to load offers"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (offer) => {
    const p = offer?.product;
    if (!p?._id) {
      alert("This offer has no product linked yet.");
      return;
    }

    const img = firstImage(offer);
    const price = discountedPrice(offer);

    // Preferred: CartContext (supports both addToCart(...) and dispatch fallback)
    if (cart?.addToCart) {
      cart.addToCart(
        {
          id: p._id, // stable id for your cart reducer
          _id: p._id,
          slug: p.slug,
          name: p.name || offer.title,
          image: img,
          price: Number(price) || 0,
          quantity: 1,
        },
        1
      );
      return;
    }
    if (cart?.dispatch) {
      cart.dispatch({
        type: "ADD_TO_CART",
        payload: {
          id: p._id,
          _id: p._id,
          slug: p.slug,
          name: p.name || offer.title,
          image: img,
          price: Number(price) || 0,
          quantity: 1,
        },
      });
      return;
    }

    // Fallback: localStorage writer
    addItemToCartLocal({
      _id: p._id,
      name: p.name || offer.title,
      price: Number(price) || 0,
      image: img,
      qty: 1,
      slug: p.slug,
      meta: { offerId: offer._id },
    });
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="container px-3 px-md-4 pb-5">
      {/* Hero */}
      <section
        className="rounded-4 my-4 p-4 p-md-5 text-center text-md-start"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,192,203,0.18) 0%, rgba(255,105,180,0.15) 100%)",
          border: "1px solid rgba(0,0,0,0.05)",
        }}
      >
        <div className="row align-items-center g-4">
          <div className="col-md-7">
            <h1
              className="display-5 fw-bold mb-2"
              style={{ letterSpacing: ".3px" }}
            >
              Hand-Picked Offers 🌷
            </h1>
            <p className="text-muted mb-0 fs-5">
              Fresh bouquets, sweeter prices. Limited-time deals updated often.
            </p>
          </div>
          <div className="col-md-5 text-md-end">
            <button className="btn btn-outline-dark" onClick={load}>
              Refresh
            </button>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="py-5 text-center">
          <div className="spinner-border" role="status" aria-hidden="true" />
        </div>
      ) : err ? (
        <div className="alert alert-danger">{err}</div>
      ) : (
        <div className="row g-3 g-md-4">
          {offers.map((o) => {
            const p = o?.product || {};
            const img = firstImage(o);
            const badge = discountBadgeText(o);
            const orig = originalPrice(o);
            const final = discountedPrice(o);

            const desc = p.description || o.description || "";
            const category = typeof p.category === "string" ? p.category : "";

            return (
              <div className="col-12 col-sm-6 col-lg-4" key={o._id}>
                <div className="card product-card h-100 shadow-sm border-0 rounded-4 overflow-hidden position-relative">
                  {/* Discount / Save badge */}
                  {badge && (
                    <span className="badge bg-danger position-absolute top-0 start-0 m-2 rounded-pill px-3 py-2">
                      {badge}
                    </span>
                  )}

                  {/* Image */}
                  <div className="ratio ratio-1x1 bg-white">
                    <img
                      src={img}
                      alt={p.name || o.title || "Offer"}
                      className="w-100 h-100"
                      style={{ objectFit: "cover" }}
                      loading="lazy"
                      onError={(e) =>
                        (e.currentTarget.src = "/assets/rose.jpg")
                      }
                    />
                  </div>

                  {/* Body */}
                  <div className="card-body d-flex flex-column">
                    {/* Category (only if present – no default text) */}
                    {category ? (
                      <div className="small text-muted mb-1">{category}</div>
                    ) : null}

                    <h6
                      className="mb-1 fw-semibold text-truncate"
                      title={p.name || o.title}
                    >
                      {p.name || o.title}
                    </h6>

                    {/* Description (2-line clamp) */}
                    <div
                      className="small text-muted mb-2"
                      title={desc}
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        minHeight: "2.5em",
                      }}
                    >
                      {desc}
                    </div>

                    {/* Price row (strike-through + final) */}
                    <div className="mb-2">
                      {Number(final) < Number(orig) ? (
                        <>
                          <span
                            className="text-muted me-2"
                            style={{ textDecoration: "line-through" }}
                          >
                            {money(orig)}
                          </span>
                          <span className="fw-bold">{money(final)}</span>
                        </>
                      ) : (
                        <span className="fw-bold">{money(orig)}</span>
                      )}
                    </div>

                    {/* Add to cart */}
                    <div className="mt-auto d-grid">
                      {p?._id ? (
                        <button
                          className="btn btn-pink btn-sm"
                          onClick={() => handleAddToCart(o)}
                        >
                          Add to Cart
                        </button>
                      ) : (
                        <button
                          className="btn btn-pink btn-sm"
                          disabled
                          title="No product linked"
                        >
                          Add to Cart
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {!offers.length && (
            <div className="col-12">
              <p className="text-muted text-center mb-0">
                No active offers right now.
              </p>
            </div>
          )}
        </div>
      )}

      <section className="mt-5 text-center">
        <p className="text-muted mb-2">Looking for more?</p>
        <Link to="/shop" className="btn btn-outline-secondary">
          Shop all flowers
        </Link>
      </section>
    </div>
  );
}
