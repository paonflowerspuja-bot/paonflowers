import React, { useEffect, useMemo, useState } from "react";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";
import { Link } from "react-router-dom";
import api from "../../utils/api";
import { useCart } from "../../context/CartContext";

const CURRENCY = import.meta.env.VITE_CURRENCY || "AED";
const LOCALE = CURRENCY === "AED" ? "en-AE" : "en-IN";
const fmt = (n) =>
  new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: CURRENCY,
  }).format(Number(n) || 0);

// discount helpers
function getDiscounted(price, discount) {
  const p = Number(price) || 0;
  const d = Number(discount) || 0;
  if (d <= 0) return { final: p, has: false };
  const final = Math.max(0, p - (p * d) / 100);
  return { final, has: true };
}

const responsive = {
  superLargeDesktop: { breakpoint: { max: 4000, min: 1200 }, items: 4 },
  desktop: { breakpoint: { max: 1200, min: 992 }, items: 4 },
  tablet: { breakpoint: { max: 992, min: 768 }, items: 2 },
  mobile: { breakpoint: { max: 768, min: 0 }, items: 1 },
};

const HomeFeaturedFlowers = () => {
  const { dispatch } = useCart() || {};
  const [items, setItems] = useState([]);
  const [pending, setPending] = useState(true);
  const [error, setError] = useState("");

  // fetch featured
  useEffect(() => {
    let alive = true;
    (async () => {
      setPending(true);
      setError("");
      try {
        const params = new URLSearchParams({
          featured: "1", // server accepts `featured` (or `isFeatured`)
          limit: "20",
          sort: "-createdAt",
        });
        const { data } = await api.get(`/api/products?${params.toString()}`);
        const list = Array.isArray(data) ? data : data.items || [];
        if (alive) setItems(list);
      } catch (e) {
        if (alive)
          setError(
            e?.response?.data?.message ||
              e?.message ||
              "Could not load featured products"
          );
      } finally {
        if (alive) setPending(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const showSection = useMemo(
    () => !pending && (items?.length || error),
    [pending, items, error]
  );

  const onAdd = (p) => {
    if (!dispatch) return; // Provider not mounted; silently no-op
    const { final } = getDiscounted(p?.price, p?.discount);
    dispatch({
      type: "ADD_TO_CART",
      payload: {
        id: p?._id || p?.id || p?.slug,
        name: p?.name,
        price: Number(final.toFixed ? final.toFixed(2) : final),
        image: p?.images?.[0]?.url || p?.image || "/assets/placeholder.png",
      },
    });
  };

  const Skeleton = () => (
    <div className="card h-100 shadow-sm placeholder-glow">
      <div className="ratio ratio-4x3 bg-light" />
      <div className="card-body">
        <div className="placeholder col-7 mb-2" />
        <div className="placeholder col-10" />
        <div className="placeholder col-4 mt-2" />
        <div className="placeholder btn btn-sm disabled col-6 mt-3" />
      </div>
    </div>
  );

  if (!showSection) return null;

  return (
    <section className="py-5 px-3 px-md-5">
      <div className="container text-center">
        <h2 className="mb-4 subheading2">Featured Flowers</h2>

        {error && (
          <div
            className="alert alert-warning small mx-auto"
            style={{ maxWidth: 640 }}
          >
            {error}
          </div>
        )}

        <Carousel
          responsive={responsive}
          infinite
          autoPlay
          arrows={false}
          keyBoardControl
          containerClass="carousel-container"
          itemClass="px-3"
          removeArrowOnDeviceType={["tablet", "mobile"]}
        >
          {pending && !items.length
            ? Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={`sk-${i}`} />
              ))
            : items.map((p, i) => {
                const img =
                  p?.images?.[0]?.url || p?.image || "/assets/placeholder.png";
                const { final, has } = getDiscounted(p?.price, p?.discount);
                const outOfStock = (Number(p?.stock) || 0) <= 0;

                return (
                  <div
                    className="card h-100 shadow-sm border-0 position-relative"
                    key={p?._id || p?.slug || `f-${i}`}
                  >
                    {/* Discount badge */}
                    {has && (
                      <span
                        className="badge bg-danger position-absolute m-2"
                        style={{ zIndex: 2 }}
                      >
                        -{Number(p.discount)}%
                      </span>
                    )}

                    <Link
                      to={`/product/${p?.slug || p?._id || ""}`}
                      className="text-decoration-none text-dark"
                    >
                      <div className="ratio ratio-4x3">
                        <img
                          src={img}
                          alt={p?.name || "Flower"}
                          className="w-100 h-100"
                          style={{ objectFit: "cover" }}
                          loading="lazy"
                          onError={(e) =>
                            (e.currentTarget.src = "/assets/placeholder.png")
                          }
                        />
                      </div>
                    </Link>

                    <div className="card-body d-flex flex-column">
                      <h6
                        className="card-title text-truncate mb-1"
                        title={p?.name || ""}
                      >
                        {p?.name || "—"}
                      </h6>

                      {/* Description (2-line clamp) */}
                      <div
                        className="small text-muted"
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

                      <div className="mt-auto d-grid">
                        <button
                          className="btn btn-pink btn-sm"
                          onClick={() => onAdd(p)}
                          disabled={outOfStock || !dispatch}
                          title={outOfStock ? "Out of stock" : "Add to cart"}
                        >
                          {outOfStock ? "Out of stock" : "Add to Cart"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
        </Carousel>

        <div className="d-flex justify-content-center mt-5">
          <Link
            to="/FeaturedFlowers"
            className="btn-pink rounded py-3 px-5"
            style={{ minWidth: 260 }}
          >
            SHOP OUR FEATURED
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HomeFeaturedFlowers;
