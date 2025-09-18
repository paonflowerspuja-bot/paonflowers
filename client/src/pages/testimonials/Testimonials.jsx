// src/pages/testimonials/Testimonials.jsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined" && gsap.core && !gsap.core.globals()._pfST) {
  gsap.registerPlugin(ScrollTrigger);
  gsap.core.globals("_pfST", true);
}

const DEFAULT_TESTIMONIALS = [
  {
    name: "Ayesha K.",
    role: "Dubai Marina",
    text: "Absolutely beautiful flowers and quick delivery. Loved the packaging!",
    rating: 5,
    avatar: "",
  },
  {
    name: "Rahul M.",
    role: "Business Bay",
    text: "Best flower shop in Dubai! Classy arrangements and a luxurious feel.",
    rating: 5,
    avatar: "",
  },
  {
    name: "Sofia L.",
    role: "Jumeirah",
    text: "The tulips were fresh and stunning. Highly recommend Paon Flowers!",
    rating: 5,
    avatar: "",
  },
  {
    name: "Noah A.",
    role: "Downtown",
    text: "Swift delivery and the bouquet looked even better than the photos.",
    rating: 5,
    avatar: "",
  },
  {
    name: "Layla R.",
    role: "Dubai Hills",
    text: "Customer service was lovely. They helped me pick the perfect arrangement.",
    rating: 5,
    avatar: "",
  },
  {
    name: "Hassan B.",
    role: "Al Barsha",
    text: "Premium quality stems. Lasted for days—worth every dirham.",
    rating: 5,
    avatar: "",
  },
  {
    name: "Maya S.",
    role: "Palm Jumeirah",
    text: "Elegant packaging and the scent was incredible. Will order again!",
    rating: 5,
    avatar: "",
  },
  {
    name: "Omar Z.",
    role: "JLT",
    text: "Same-day delivery saved the day. Great experience overall.",
    rating: 5,
    avatar: "",
  },
  {
    name: "Zara N.",
    role: "Arabian Ranches",
    text: "The pastel palette was gorgeous. Exactly what I wanted.",
    rating: 5,
    avatar: "",
  },
  {
    name: "Ethan W.",
    role: "Mirdif",
    text: "Easy checkout, on-time delivery, and flawless bouquet.",
    rating: 5,
    avatar: "",
  },
];

const Stars = ({ n = 5 }) => (
  <div
    style={{ color: "#FFB400", fontSize: 14 }}
    aria-label={`${n} star rating`}
  >
    {Array.from({ length: n }).map((_, i) => (
      <span key={i} aria-hidden="true">
        ★
      </span>
    ))}
  </div>
);

const Avatar = ({ name, src }) => {
  if (src) {
    return (
      <img
        src={src}
        alt={`${name} avatar`}
        loading="lazy"
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          objectFit: "cover",
          background: "#f7f7f7",
        }}
      />
    );
  }
  const initials = (name || "")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      aria-hidden="true"
      style={{
        width: 40,
        height: 40,
        borderRadius: "50%",
        background: "linear-gradient(135deg,#ffb6c1,#ff69b4)",
        color: "#fff",
        fontWeight: 700,
        display: "grid",
        placeItems: "center",
      }}
    >
      {initials}
    </div>
  );
};

function useTilt(enable, ref) {
  useEffect(() => {
    const el = ref?.current;
    if (!enable || !el) return;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
      const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      gsap.to(el, {
        rotateY: dx * 6,
        rotateX: -dy * 6,
        transformPerspective: 700,
        transformStyle: "preserve-3d",
        duration: 0.25,
        ease: "power2.out",
      });
    };
    const onLeave = () =>
      gsap.to(el, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.35,
        ease: "power2.out",
      });
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [enable, ref]);
}

const TestimonialCard = React.forwardRef(({ item, tilt = true }, forwarded) => {
  const local = useRef(null);
  const setRef = useCallback(
    (node) => {
      local.current = node;
      if (!forwarded) return;
      if (typeof forwarded === "function") forwarded(node);
      else forwarded.current = node;
    },
    [forwarded]
  );
  useTilt(tilt, local);

  return (
    <div
      ref={setRef}
      tabIndex={0}
      style={{
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 8px 20px rgba(0,0,0,.06)",
        padding: 16,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        willChange: "transform",
        isolation: "isolate",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Avatar name={item.name} src={item.avatar} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, lineHeight: 1.1 }}>{item.name}</div>
          <div style={{ fontSize: 12, color: "#6c757d" }}>{item.role}</div>
        </div>
        <Stars n={item.rating} />
      </div>

      <div style={{ marginTop: 12 }}>
        <span aria-hidden="true" style={{ fontSize: 26, color: "#ff69b4" }}>
          “
        </span>
        <p style={{ margin: "6px 0 0", color: "#4b4b4b" }}>{item.text}</p>
      </div>

      <div style={{ marginTop: "auto" }} />
      <div
        style={{
          marginTop: 12,
          height: 4,
          borderRadius: 999,
          background:
            "linear-gradient(90deg, rgba(255,105,180,.95), rgba(255,182,193,.95))",
        }}
      />
    </div>
  );
});
TestimonialCard.displayName = "TestimonialCard";

const usePrefersReducedMotion = () => {
  const [pref, setPref] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const apply = () => setPref(!!mq?.matches);
    apply();
    mq?.addEventListener?.("change", apply);
    return () => mq?.removeEventListener?.("change", apply);
  }, []);
  return pref;
};

const GAP = 24;

const Testimonials = ({
  items = DEFAULT_TESTIMONIALS,
  sectionId = "testimonials",
}) => {
  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const railRef = useRef(null);
  const cardRefs = useRef([]);
  const setCardRef = useCallback(
    (el, i) => (cardRefs.current[i] = el || null),
    []
  );
  const reduceMotion = usePrefersReducedMotion();

  const [hasOverflow, setHasOverflow] = useState(false);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [paused, setPaused] = useState(false);

  const safeItems = useMemo(
    () => (Array.isArray(items) && items.length ? items : DEFAULT_TESTIMONIALS),
    [items]
  );

  // Animate in
  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      const cards = cardRefs.current.filter(Boolean);
      if (headingRef.current) {
        gsap.from(headingRef.current, {
          y: 24,
          autoAlpha: 0,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 82%",
            once: true,
          },
        });
      }
      if (cards.length) {
        gsap.from(cards, {
          y: 18,
          autoAlpha: 0,
          duration: 0.5,
          ease: "power2.out",
          stagger: 0.06,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
            once: true,
          },
        });
      }
    }, sectionRef);
    return () => ctx.revert();
  }, [safeItems]);

  // Overflow state
  const updateScrollState = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    const overflow = el.scrollWidth > el.clientWidth + 1;
    setHasOverflow(overflow);
    const sl = el.scrollLeft;
    const max = el.scrollWidth - el.clientWidth;
    setAtStart(sl <= 1);
    setAtEnd(sl >= max - 1);
  }, []);
  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    updateScrollState();
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    window.addEventListener("resize", updateScrollState, { passive: true });
    el.addEventListener("scroll", updateScrollState, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateScrollState);
      el.removeEventListener("scroll", updateScrollState);
    };
  }, [updateScrollState]);

  // Find nearest (left edge) card index
  const findNearestIndex = useCallback(() => {
    const el = railRef.current;
    const cards = cardRefs.current.filter(Boolean);
    if (!el || !cards.length) return 0;
    const currentLeft = el.scrollLeft;
    let best = 0;
    let bestDist = Infinity;
    cards.forEach((c, i) => {
      const targetLeft =
        c.offsetLeft - (parseFloat(getComputedStyle(el).paddingLeft) || 0);
      const dist = Math.abs(targetLeft - currentLeft);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    return best;
  }, []);

  // >>> KEY FIX: scroll the rail horizontally (no scrollIntoView)
  const scrollToIndex = useCallback((i) => {
    const el = railRef.current;
    const cards = cardRefs.current.filter(Boolean);
    if (!el || !cards.length) return;
    const idx = Math.max(0, Math.min(i, cards.length - 1));
    const target = cards[idx];
    const padLeft = parseFloat(getComputedStyle(el).paddingLeft) || 0;
    const left = target.offsetLeft - padLeft;
    el.scrollTo({ left, behavior: "smooth" }); // horizontal only, won't move the page
  }, []);

  const scrollByStep = (dir = 1) => scrollToIndex(findNearestIndex() + dir);

  // Auto-advance (horizontal only now)
  useEffect(() => {
    const el = railRef.current;
    if (!el || !hasOverflow || reduceMotion) return;
    let id;
    const tick = () => {
      if (!paused) scrollByStep(1);
      id = setTimeout(tick, 3500);
    };
    id = setTimeout(tick, 3500);
    return () => clearTimeout(id);
  }, [hasOverflow, paused, reduceMotion]);

  const onKeyDown = (e) => {
    switch (e.key) {
      case "ArrowRight":
        e.preventDefault();
        scrollByStep(1);
        break;
      case "ArrowLeft":
        e.preventDefault();
        scrollByStep(-1);
        break;
      case "Home":
        e.preventDefault();
        scrollToIndex(0);
        break;
      case "End":
        e.preventDefault();
        scrollToIndex(cardRefs.current.filter(Boolean).length - 1);
        break;
      default:
    }
  };

  return (
    <section
      id={sectionId}
      ref={sectionRef}
      aria-labelledby={`${sectionId}-title`}
      style={{ scrollMarginTop: 80, padding: "8px 0" }}
    >
      <div className="container">
        <h2
          id={`${sectionId}-title`}
          ref={headingRef}
          className="text-center heading2 fw-bold paon-heading mb-4 mb-lg-5"
        >
          What Our Customers Say
        </h2>

        <div
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          style={{ position: "relative" }}
        >
          {/* Nav buttons */}
          <button
            type="button"
            aria-label="Scroll testimonials left"
            onClick={() => scrollByStep(-1)}
            disabled={!hasOverflow || atStart}
            style={{
              position: "absolute",
              insetInlineStart: 8,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 2,
              borderRadius: 999,
              border: "1px solid #eee",
              width: 40,
              height: 40,
              background: "#fff",
              boxShadow: "0 4px 10px rgba(0,0,0,.08)",
            }}
          >
            ‹
          </button>

          <div
            ref={railRef}
            role="list"
            tabIndex={0}
            onKeyDown={onKeyDown}
            className="pf-rail"
            style={{
              display: "grid",
              gridAutoFlow: "column",
              gridAutoColumns: "minmax(300px, 380px)",
              gap: GAP,
              overflowX: "auto",
              scrollSnapType: "x mandatory",
              padding: "4px 44px",
              WebkitOverflowScrolling: "touch",
              alignItems: "stretch",
            }}
          >
            {safeItems.map((item, idx) => (
              <div
                key={`${item.name}-${idx}`}
                role="listitem"
                ref={(el) => setCardRef(el, idx)}
                style={{ scrollSnapAlign: "start", height: "100%" }}
              >
                <TestimonialCard item={item} tilt />
              </div>
            ))}
          </div>

          <button
            type="button"
            aria-label="Scroll testimonials right"
            onClick={() => scrollByStep(1)}
            disabled={!hasOverflow || atEnd}
            style={{
              position: "absolute",
              insetInlineEnd: 8,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 2,
              borderRadius: 999,
              border: "1px solid #eee",
              width: 40,
              height: 40,
              background: "#fff",
              boxShadow: "0 4px 10px rgba(0,0,0,.08)",
            }}
          >
            ›
          </button>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
