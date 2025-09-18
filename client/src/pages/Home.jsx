// src/pages/Home.jsx
import React, { Suspense, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import Testimonials from "./testimonials/Testimonials";
import WhyChooseUs from "./WhyChooseUs/WhyChooseUs";
// Lazy-load the heavy carousel
const HomeFeaturedFlowers = React.lazy(() =>
  import("./FeaturedFlowers/HomeFeaturedFlowers")
);

// Small count-up component that animates when it scrolls into view
function CountUp({
  value = 0,
  duration = 1200,
  decimals = 0,
  suffix = "",
  prefix = "",
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let frameId;
    const animate = () => {
      const start = performance.now();
      const startVal = 0;
      const endVal = Number(value) || 0;

      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
        const current = startVal + (endVal - startVal) * eased;
        setDisplay(current);
        if (t < 1) frameId = requestAnimationFrame(tick);
      };
      frameId = requestAnimationFrame(tick);
    };

    const startIfNeeded = () => {
      if (!startedRef.current) {
        startedRef.current = true;
        animate();
      }
    };

    if (!("IntersectionObserver" in window)) {
      startIfNeeded();
      return () => cancelAnimationFrame(frameId);
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            startIfNeeded();
            io.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );

    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frameId);
    };
  }, [value, duration]);

  const formatted =
    decimals > 0
      ? display.toFixed(decimals)
      : Math.round(display).toLocaleString();

  return (
    <span ref={ref}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

/* ---------- Minimal, modern accordion rows (like your reference image) ---------- */
function AccordionRow({ id, title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(!!defaultOpen);
  const contentRef = useRef(null);
  const [maxH, setMaxH] = useState("0px");

  useEffect(() => {
    if (!contentRef.current) return;
    setMaxH(open ? `${contentRef.current.scrollHeight}px` : "0px");
  }, [open, children]);

  return (
    <div className="border-top">
      <button
        className="w-100 bg-transparent border-0 text-start d-flex justify-content-between align-items-center py-3"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        style={{ fontWeight: 600, letterSpacing: ".2px" }}
      >
        <span className="me-3">{title}</span>
        <span
          aria-hidden="true"
          className="d-inline-flex align-items-center justify-content-center rounded-circle"
          style={{
            width: 28,
            height: 28,
            border: "1px solid #e5e7eb",
            fontSize: 18,
            lineHeight: 1,
            transition: "transform .2s ease",
            transform: open ? "rotate(45deg)" : "rotate(0deg)", // + -> ×
          }}
        >
          +
        </span>
      </button>

      <div
        id={id}
        ref={contentRef}
        style={{
          maxHeight: maxH,
          overflow: "hidden",
          transition: "max-height .28s ease",
        }}
      >
        <div className="pb-3 text-muted" style={{ lineHeight: 1.7 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function FactsAccordion() {
  return (
    <section className="container my-5 px-3 px-md-4">
      <div className="bg-white rounded-4 shadow-sm p-3 p-md-4 p-lg-5">
        <AccordionRow
          id="acc-1"
          title="Flower Delivery for Every Occasion by Paon Flowers"
          defaultOpen
        >
          <p>
            We keep flower gifting in Dubai simple, fast, and gorgeous. Explore
            our curated <Link to="/shop">flower arrangements</Link> for
            birthdays, anniversaries, congratulations, and more. Seasonal
            bestsellers and timeless classics—always with premium stems.
          </p>
        </AccordionRow>

        <AccordionRow id="acc-2" title="Send Flowers Online Year-Round">
          <p>
            We deliver every day of the year. Pick your delivery date at
            checkout and we’ll handle the rest—fresh, on time, and photo-ready.
          </p>
        </AccordionRow>

        <AccordionRow
          id="acc-3"
          title="Handcrafted Bouquets by Expert Florists"
        >
          <p>
            Each bouquet is arranged in-house for balanced color, lush texture,
            and safe packaging—so blooms arrive ready to impress.
          </p>
        </AccordionRow>

        <AccordionRow
          id="acc-4"
          title="Beautiful Flowers Whenever You Need Them"
        >
          <p>
            Same-day & next-day delivery across most areas. Look for the{" "}
            <strong>Same-Day</strong> badge on products and order before our
            cutoff.
          </p>
        </AccordionRow>

        <AccordionRow id="acc-5" title="Fresh Stems, Responsibly Sourced">
          <p>
            We work with trusted growers and include a care card to help your
            flowers last longer at home.
          </p>
        </AccordionRow>

        <AccordionRow
          id="acc-6"
          title="Easy Gifting — Cards, Balloons & Add-Ons"
        >
          <p>
            Personalize your order with handwritten cards, balloons, or teddy
            bears. Add them on product pages or in your cart.
          </p>
        </AccordionRow>

        <AccordionRow
          id="acc-7"
          title="Why Choose Paon for Your Next Delivery?"
        >
          <ul className="mb-0">
            <li>Real-time support on WhatsApp</li>
            <li>Photo confirmation on request</li>
            <li>Secure checkout & multiple payment options</li>
          </ul>
        </AccordionRow>
      </div>
    </section>
  );
}

/* ---------- Lightweight skeleton while the featured carousel loads ---------- */
function FeaturedSkeleton() {
  return (
    <section className="container my-4 px-3 px-md-4">
      <div className="row g-3 g-md-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="col-6 col-md-4 col-lg-2">
            <div className="card border-0 shadow-sm">
              <div className="ratio ratio-1x1 bg-light placeholder-glow rounded-top" />
              <div className="card-body">
                <div className="placeholder col-8 mb-2" />
                <div className="placeholder col-5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Page ---------------- */
const Home = () => {
  // Guard against any stray hash & force top-of-page on mount (prevents jump to sections)
  useEffect(() => {
    try {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }
    } catch {}
    // Clear any lingering hash like #testimonials (caused by other links)
    if (window.location.hash) {
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search
      );
    }
    // Ensure we start at the top
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  return (
    <div className="card-bg">
      {/* HERO */}
      <div className="hero-bg-image">
        <div
          className="hero-safe d-flex flex-column justify-content-center align-items-center text-center mx-4"
          style={{ minHeight: "80vh" }}
        >
          <h1 className="heading mb-3 animate__animated animate__fadeInDown">
            Elegant Blooms for <br /> Every Occasion
          </h1>

          <p className="subheading mb-4 animate__animated animate__fadeInUp">
            Dubai’s premium flower shop for luxurious floral experiences.
          </p>

          <div className="hero-cta animate__animated animate__fadeInUp mb-4">
            <Link to="/shop" className="luxury-btn text-decoration-none">
              Shop Now
            </Link>
            <Link to="/offers" className="luxury-btn text-decoration-none">
              Explore Offers
            </Link>
          </div>
        </div>
      </div>

      {/* Featured carousel — lazy & fast placeholder */}
      <Suspense fallback={<FeaturedSkeleton />}>
        <HomeFeaturedFlowers />
      </Suspense>

      {/* Section 1 */}
      <div className="container my-5 px-3 px-md-4">
        <div className="row align-items-center right-left-bg g-0">
          <div className="col-md-6 mb-4 mb-md-0 p-0">
            <img
              className="img-fluid right-left-image"
              src="/images/image1.jpg"
              alt="Same day flower delivery"
              loading="lazy"
            />
          </div>
          <div className="col-md-6 text-md-end text-center p-4">
            <h2 className="heading2">Flowers Delivered TODAY</h2>
            <p className="text-decoration-underline mb-3">
              Let flowers save the day.
            </p>
            <div className="d-grid gap-2 d-sm-inline-block">
              <button className="btn-pink">Order Same Day</button>
            </div>
          </div>
        </div>
      </div>

      {/* ========= FAST FACTS (animated, responsive) ========= */}
      <section className="container my-5 px-3 px-md-4">
        <div className="text-center mb-4">
          <h2 className="heading2 fw-bold">Paon in Numbers</h2>
          <p className="text-muted mb-0">
            A few facts our customers love about us.
          </p>
        </div>

        <div className="row g-3 g-md-4">
          {/* 1 */}
          <div className="col-6 col-md-4 col-lg-3">
            <div className="h-100 bg-white border-0 shadow-sm rounded-4 p-3 d-flex">
              <div
                className="me-3 d-flex align-items-center justify-content-center rounded-circle"
                style={{
                  width: 44,
                  height: 44,
                  background: "rgba(255,182,193,.25)",
                }}
                aria-hidden="true"
              >
                🌸
              </div>
              <div>
                <div className="h4 mb-0">
                  <CountUp value={10000} suffix="+" duration={1200} />
                </div>
                <div className="small text-muted">Bouquets Delivered</div>
              </div>
            </div>
          </div>

          {/* 2 */}
          <div className="col-6 col-md-4 col-lg-3">
            <div className="h-100 bg-white border-0 shadow-sm rounded-4 p-3 d-flex">
              <div
                className="me-3 d-flex align-items-center justify-content-center rounded-circle"
                style={{
                  width: 44,
                  height: 44,
                  background: "rgba(255,105,180,.25)",
                }}
                aria-hidden="true"
              >
                ⭐
              </div>
              <div>
                <div className="h4 mb-0">
                  <CountUp
                    value={4.9}
                    decimals={1}
                    suffix="/5"
                    duration={1200}
                  />
                </div>
                <div className="small text-muted">Average Rating</div>
              </div>
            </div>
          </div>

          {/* 3 */}
          <div className="col-6 col-md-4 col-lg-3">
            <div className="h-100 bg-white border-0 shadow-sm rounded-4 p-3 d-flex">
              <div
                className="me-3 d-flex align-items-center justify-content-center rounded-circle"
                style={{
                  width: 44,
                  height: 44,
                  background: "rgba(255,182,193,.25)",
                }}
                aria-hidden="true"
              >
                🚚
              </div>
              <div>
                <div className="h4 mb-0">
                  <CountUp value={45} suffix="+" duration={1200} />
                </div>
                <div className="small text-muted">Areas Covered in Dubai</div>
              </div>
            </div>
          </div>

          {/* 4 */}
          <div className="col-6 col-md-4 col-lg-3">
            <div className="h-100 bg-white border-0 shadow-sm rounded-4 p-3 d-flex">
              <div
                className="me-3 d-flex align-items-center justify-content-center rounded-circle"
                style={{
                  width: 44,
                  height: 44,
                  background: "rgba(255,105,180,.25)",
                }}
                aria-hidden="true"
              >
                ⏱️
              </div>
              <div>
                <div className="h4 mb-0">
                  <CountUp value={2} suffix=" min" duration={900} />
                </div>
                <div className="small text-muted">To Place an Order</div>
              </div>
            </div>
          </div>

          {/* 5 */}
          <div className="col-6 col-md-4 col-lg-3">
            <div className="h-100 bg-white border-0 shadow-sm rounded-4 p-3 d-flex">
              <div
                className="me-3 d-flex align-items-center justify-content-center rounded-circle"
                style={{
                  width: 44,
                  height: 44,
                  background: "rgba(255,182,193,.25)",
                }}
                aria-hidden="true"
              >
                🌿
              </div>
              <div>
                <div className="h4 mb-0">
                  <CountUp value={100} suffix="%" duration={1100} />
                </div>
                <div className="small text-muted">Eco-Friendly Packaging</div>
              </div>
            </div>
          </div>

          {/* 6 */}
          <div className="col-6 col-md-4 col-lg-3">
            <div className="h-100 bg-white border-0 shadow-sm rounded-4 p-3 d-flex">
              <div
                className="me-3 d-flex align-items-center justify-content-center rounded-circle"
                style={{
                  width: 44,
                  height: 44,
                  background: "rgba(255,105,180,.25)",
                }}
                aria-hidden="true"
              >
                🧊
              </div>
              <div>
                <div className="h4 mb-0">
                  <CountUp value={25000} suffix="+" duration={1500} />
                </div>
                <div className="small text-muted">Fresh Stems in Stock</div>
              </div>
            </div>
          </div>

          {/* 7 */}
          <div className="col-12 col-md-4 col-lg-3">
            <div className="h-100 bg-white border-0 shadow-sm rounded-4 p-3 d-flex">
              <div
                className="me-3 d-flex align-items-center justify-content-center rounded-circle"
                style={{
                  width: 44,
                  height: 44,
                  background: "rgba(255,182,193,.25)",
                }}
                aria-hidden="true"
              >
                ⚡
              </div>
              <div>
                <div className="h4 mb-0">
                  <CountUp value={1200} suffix="+" duration={1300} />
                </div>
                <div className="small text-muted">
                  Same-Day Orders This Month
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-4">
          <Link to="/shop" className="btn-pink text-decoration-none px-4 py-2">
            Send Flowers Today
          </Link>
        </div>
      </section>

      {/* Section 2 */}
      <div className="container my-5 px-3 px-md-4">
        <div className="row align-items-center flex-md-row flex-column-reverse right-left-bg g-0">
          <div className="col-md-6 text-md-start text-center p-4">
            <h2 className="heading2 fw-bold">Birthday Bouquets that WOW</h2>
            <p className="text-decoration-underline mb-3">
              Not sure what to get them? Flowers are always a good idea.
            </p>
            <div className="d-grid gap-2 d-sm-inline-block">
              <Link
                to="/flowers/birthday"
                className="btn-pink text-decoration-none"
              >
                Shop Birthday
              </Link>
            </div>
          </div>
          <div className="col-md-6 mb-4 mb-md-0 p-0">
            <img
              className="img-fluid right-left-image2"
              src="/images/IMG_4759.JPG"
              alt="Birthday flowers"
              loading="lazy"
            />
          </div>
        </div>
      </div>

      {/* Section 3 */}
      <div className="container my-5 px-3 px-md-4">
        <div className="row align-items-center right-left-bg g-0">
          <div className="col-md-6 mb-4 mb-md-0 p-0">
            <img
              className="img-fluid right-left-image2"
              src="/images/paonshop.jpeg"
              alt="Paon Flowers shop"
              loading="lazy"
            />
          </div>
          <div className="col-md-6 text-md-end text-center p-4">
            <h2 className="heading2">Visit Our Flower Shop</h2>
            <p className="text-decoration-underline mb-3">
              Shop for Paon at our location
            </p>
            <div className="d-grid gap-2 d-sm-inline-block">
              <Link
                to="/store-location"
                className="btn-pink text-decoration-none"
              >
                Shop URL
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Testimonials />

      {/* keep existing block */}
      <WhyChooseUs />

      {/* NEW: Accordion facts after WhyChooseUs (as requested) */}
      <FactsAccordion />
    </div>
  );
};

export default Home;
