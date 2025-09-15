// client/src/pages/offers/Offers.jsx
import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import { Link } from "react-router-dom";

const CURRENCY = import.meta.env.VITE_CURRENCY || "AED";
const LOCALE = import.meta.env.VITE_LOCALE || (CURRENCY === "AED" ? "en-AE" : "en-IN");

const money = (n) =>
  new Intl.NumberFormat(LOCALE, { style: "currency", currency: CURRENCY }).format(Number(n) || 0);

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

const discountBadge = (offer) => {
  const amt = Number(offer?.amount || 0);
  if (!amt) return null;
  return offer?.discountType === "percent" ? `-${amt}%` : `Save ${money(amt)}`;
};

// ---- robust cart writer (works with/without your context) ----
function addItemToCart(item) {
  try {
    // 1) Broadcast (if your app listens)
    window.dispatchEvent(new CustomEvent("cart:add", { detail: item }));

    // 2) LocalStorage fallback (use pf_cart and cart for compatibility)
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

    const current =
      read("pf_cart") ??
      read("cart") ??
      [];

    const idx = current.findIndex((x) => x?._id === item._id);
    if (idx >= 0) current[idx].qty = (Number(current[idx].qty) || 0) + item.qty;
    else current.push(item);

    write("pf_cart", current);
    write("cart", current);

    window.dispatchEvent(new Event("cart:changed")); // many carts re-render on this
  } catch {}
}

export default function Offers() {
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
      setErr(e?.response?.data?.message || e?.message || "Failed to load offers");
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
    const item = {
      _id: p._id,
      name: p.name || offer.title,
      price: discountedPrice(offer),
      image: firstImage(offer),
      qty: 1,
      // optional extra fields many carts accept:
      slug: p.slug,
      meta: { offerId: offer._id },
    };
    addItemToCart(item);
  };

  useEffect(() => { load(); }, []);

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
            <h1 className="display-5 fw-bold mb-2" style={{ letterSpacing: ".3px" }}>
              Hand-Picked Offers 🌷
            </h1>
            <p className="text-muted mb-0 fs-5">
              Fresh bouquets, sweeter prices. Limited-time deals updated often.
            </p>
          </div>
          <div className="col-md-5 text-md-end">
            <button className="btn btn-outline-dark" onClick={load}>Refresh</button>
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
            const img = firstImage(o);
            const badge = discountBadge(o);
            const orig = originalPrice(o);
            const final = discountedPrice(o);

            return (
              <div className="col-12 col-sm-6 col-lg-4" key={o._id}>
                <div className="card h-100 shadow-sm border-0 rounded-4 overflow-hidden">
                  <div className="position-relative" style={{ background: "#fff" }}>
                    <img
                      src={img}
                      alt={o.title}
                      className="w-100"
                      style={{ objectFit: "cover", aspectRatio: "16 / 11" }}
                      loading="lazy"
                    />
                    {badge && (
                      <span className="badge bg-danger position-absolute top-0 start-0 m-2 rounded-pill px-3 py-2">
                        {badge}
                      </span>
                    )}
                  </div>

                  <div className="card-body d-flex flex-column">
                    <h5 className="fw-semibold mb-1" style={{ minHeight: 28 }}>{o.title}</h5>
                    {o.description ? (
                      <p className="text-muted small mb-3" style={{ minHeight: 32 }}>{o.description}</p>
                    ) : <div className="mb-3" />}

                    <div className="d-flex align-items-baseline gap-2 mb-3">
                      <span className="text-muted text-decoration-line-through">{money(orig)}</span>
                      <span className="fw-bold fs-5">{money(final)}</span>
                    </div>

                    <div className="mt-auto d-grid">
                      {o?.product?._id ? (
                        <button className="btn btn-dark" onClick={() => handleAddToCart(o)}>
                          Add to Cart
                        </button>
                      ) : (
                        <button className="btn btn-dark" disabled title="No product linked">
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
              <p className="text-muted text-center mb-0">No active offers right now.</p>
            </div>
          )}
        </div>
      )}

      <section className="mt-5 text-center">
        <p className="text-muted mb-2">Looking for more?</p>
        <Link to="/shop" className="btn btn-outline-secondary">Shop all flowers</Link>
      </section>
    </div>
  );
}
