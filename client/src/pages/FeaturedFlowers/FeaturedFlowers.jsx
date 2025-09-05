// src/components/home/FeaturedFlowers.jsx
import React, { useEffect, useMemo, useState } from "react";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";
import { Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const CURRENCY = import.meta.env.VITE_CURRENCY || "AED";
const LOCALE = CURRENCY === "AED" ? "en-AE" : "en-IN";

// Price formatting (AED by default)
const formatCurrency = (n) =>
  new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: CURRENCY,
  }).format(Number(n) || 0);

// Safe image helper (supports http(s), data:, /assets)
const IMG = (p) => {
  if (!p) return "/assets/rose.jpg";
  if (/^(https?:|data:)/i.test(p)) return p;
  if (p.startsWith("/")) return encodeURI(p);
  return encodeURI(`/assets/${p}`);
};

// Responsive breakpoints
const responsive = {
  superLargeDesktop: { breakpoint: { max: 4000, min: 1200 }, items: 4 },
  desktop: { breakpoint: { max: 1200, min: 992 }, items: 4 },
  tablet: { breakpoint: { max: 992, min: 768 }, items: 2 },
  mobile: { breakpoint: { max: 768, min: 0 }, items: 1 },
};

// Normalize various API shapes into a simple object
const normalize = (p) => {
  if (!p) return null;
  const img =
    (Array.isArray(p.images) && (p.images[0]?.url || p.images[0])) ||
    p.image ||
    p.img;
  return {
    id: p._id || p.id || p.slug || p.name || "flower",
    slug: p.slug,
    name: p.name || p.title || "Flower",
    price: Number(p.price) || 0,
    image: img,
  };
};

const FeaturedFlowers = () => {
  const [items, setItems] = useState([]);
  const [pending, setPending] = useState(true);
  const [error, setError] = useState("");

  // Fetch featured products (same filter used on the Featured page)
  useEffect(() => {
    let alive = true;
    (async () => {
      setPending(true);
      setError("");
      try {
        if (!API_BASE) throw new Error("API not configured");
        // keep this in sync with your Featured page’s query: featured=1
        const res = await fetch(
          buildUrl("/products", {
            featured: "true", // or isFeatured: 'true' if your API uses that
            limit: 12,
            sort: "-createdAt", // better default than "featured"
          }),
          { credentials: "include" }
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const list = Array.isArray(data)
          ? data
          : data.items || data.products || data.data || [];
        const mapped = list.map(normalize).filter(Boolean);
        if (alive) setItems(mapped);
      } catch (e) {
        if (alive) setError(e.message || "Could not load featured products");
      } finally {
        if (alive) setPending(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Optional: hide whole section if nothing to show and no error
  const showSection = useMemo(
    () => !pending && (items?.length || error),
    [pending, items, error]
  );

  const Skeleton = () => (
    <div className="card h-100 shadow-sm placeholder-glow">
      <div className="ratio ratio-4x3 bg-light" />
      <div className="card-body">
        <div className="placeholder col-7 mb-2" />
        <div className="placeholder col-4" />
      </div>
    </div>
  );

  if (!showSection) return null;

  return (
    <section className="py-5 px-3 px-md-5">
      <div className="container text-center">
        <h2 className="mb-4 subheading2">Featured Flowers</h2>

        {/* Error fallback */}
        {error && (
          <div
            className="alert alert-warning small mx-auto"
            style={{ maxWidth: 640 }}
          >
            {error}
          </div>
        )}

        {/* Carousel */}
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
            : items.map((p) => (
                <div className="card h-100 shadow-sm border-0" key={p.id}>
                  <Link
                    to={`/product/${p.slug || p.id}`}
                    className="text-decoration-none text-dark"
                  >
                    <div className="ratio ratio-4x3">
                      <img
                        src={IMG(p.image)}
                        alt={p.name}
                        className="w-100 h-100"
                        style={{ objectFit: "cover" }}
                        loading="lazy"
                        onError={(e) =>
                          (e.currentTarget.src = "/assets/rose.jpg")
                        }
                      />
                    </div>
                  </Link>
                  <div className="card-body">
                    <h6 className="card-title text-truncate mb-1">{p.name}</h6>
                    <p className="card-text text-muted mb-0">
                      {formatCurrency(p.price)}
                    </p>
                  </div>
                </div>
              ))}
        </Carousel>

        <div className="d-flex justify-content-center mt-5">
          <Link
            to="/flowers/featured"
            className="btn-pink rounded py-3 px-5 px-md-5"
            style={{ minWidth: 260 }}
          >
            SHOP OUR FEATURED
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedFlowers;
