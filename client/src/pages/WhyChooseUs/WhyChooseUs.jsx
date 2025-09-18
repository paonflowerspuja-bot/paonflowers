// src/pages/WhyChooseUs/WhyChooseUs.jsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Guarded registration (avoids duplicate warnings in dev/HMR)
if (
  typeof window !== "undefined" &&
  gsap.core &&
  !gsap.core.globals()._pfWHYST
) {
  gsap.registerPlugin(ScrollTrigger);
  gsap.core.globals("_pfWHYST", true);
}

const DEFAULT_FEATURES = [
  {
    icon: "bi-truck",
    title: "Same-Day Delivery",
    text: "Fresh flowers delivered the same day across Dubai.",
  },
  {
    icon: "bi-stars",
    title: "Premium Quality",
    text: "Handpicked stems curated for elegance and longevity.",
  },
  {
    icon: "bi-gift",
    title: "Custom Gifting",
    text: "Personalized add-ons and messages for every occasion.",
  },
  {
    icon: "bi-camera",
    title: "Photo Confirmation",
    text: "On request, receive a photo before delivery.",
  },
  {
    icon: "bi-shield-check",
    title: "Secure Checkout",
    text: "Multiple payment options with encrypted checkout.",
  },
  {
    icon: "bi-whatsapp",
    title: "Live Support",
    text: "Real-time help on WhatsApp for quick assistance.",
  },
];

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

// Subtle interactive tilt on hover
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

const FeatureCard = React.forwardRef(({ item, tilt = true }, forwarded) => {
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
        borderRadius: 18,
        boxShadow: "0 10px 24px rgba(0,0,0,.06)",
        padding: 18,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        willChange: "transform",
        isolation: "isolate",
        transition: "box-shadow .2s ease, transform .2s ease",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.boxShadow = "0 14px 28px rgba(0,0,0,.08)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.boxShadow = "0 10px 24px rgba(0,0,0,.06)")
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div
          aria-hidden="true"
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            display: "grid",
            placeItems: "center",
            background:
              "linear-gradient(135deg, rgba(255,105,180,.16), rgba(255,182,193,.22))",
          }}
        >
          <i
            className={`bi ${item.icon}`}
            style={{ fontSize: 22, color: "#ff69b4" }}
          />
        </div>
        <h5
          style={{
            margin: "4px 0 2px",
            fontWeight: 700,
            letterSpacing: ".2px",
          }}
        >
          {item.title}
        </h5>
        <p style={{ margin: 0, color: "#6c757d", lineHeight: 1.6 }}>
          {item.text}
        </p>
      </div>

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
FeatureCard.displayName = "FeatureCard";

// Responsive spacing (nice gap, spread a little wider)
const GAP = "clamp(16px, 2.6vw, 28px)";

const WhyChooseUs = ({
  items = DEFAULT_FEATURES,
  sectionId = "why-choose-us",
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
    () => (Array.isArray(items) && items.length ? items : DEFAULT_FEATURES),
    [items]
  );

  // Reveal animations (no page jump)
  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      const cards = cardRefs.current.filter(Boolean);
      if (headingRef.current) {
        gsap.from(headingRef.current, {
          y: 18,
          autoAlpha: 0,
          duration: 0.55,
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
          stagger: 0.07,
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

  // Nearest card (by left edge)
  const findNearestIndex = useCallback(() => {
    const el = railRef.current;
    const cards = cardRefs.current.filter(Boolean);
    if (!el || !cards.length) return 0;
    const curLeft = el.scrollLeft;
    const padLeft = parseFloat(getComputedStyle(el).paddingLeft) || 0;
    let best = 0,
      bestDist = Infinity;
    cards.forEach((c, i) => {
      const targetLeft = c.offsetLeft - padLeft;
      const d = Math.abs(targetLeft - curLeft);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    return best;
  }, []);

  // Smooth horizontal scroll (no anchor jump)
  const scrollToIndex = useCallback((i) => {
    const el = railRef.current;
    const cards = cardRefs.current.filter(Boolean);
    if (!el || !cards.length) return;
    const idx = Math.max(0, Math.min(i, cards.length - 1));
    const target = cards[idx];
    const padLeft = parseFloat(getComputedStyle(el).paddingLeft) || 0;
    const left = target.offsetLeft - padLeft;
    el.scrollTo({ left, behavior: "smooth" });
  }, []);

  const scrollByStep = (dir = 1) => scrollToIndex(findNearestIndex() + dir);

  // Auto-advance (pauses on hover/focus, respects reduced motion)
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

  // Keyboard support
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
      style={{ padding: "8px 0", scrollMarginTop: 80 }}
    >
      <div className="container">
        <h2
          id={`${sectionId}-title`}
          ref={headingRef}
          className="text-center heading2 fw-bold paon-heading mb-4 mb-lg-5"
        >
          Why Choose Paon Flowers?
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
            aria-label="Scroll left"
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

          {/* Single-line, responsive rail — wider spread, proper gap, no side fades */}
          <div
            ref={railRef}
            role="list"
            tabIndex={0}
            onKeyDown={onKeyDown}
            style={{
              display: "grid",
              gridAutoFlow: "column",
              gridAutoColumns: "clamp(240px, 64vw, 360px)", // responsive card width
              gap: GAP, // proper, responsive gap
              alignItems: "stretch",
              overflowX: "auto",
              scrollSnapType: "x mandatory",
              padding: "4px clamp(12px, 3.2vw, 48px)", // spreads content a bit wider
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none", // hide Firefox scrollbar
              msOverflowStyle: "none", // hide IE/Edge legacy scrollbar
            }}
            // Hide WebKit scrollbar visually (optional — keep UX clean)
            onLoad={(e) => {
              const el = e.currentTarget;
              el.style.setProperty("--hide-scrollbar", "none");
            }}
          >
            {safeItems.map((item, idx) => (
              <div
                key={`${item.title}-${idx}`}
                role="listitem"
                ref={(el) => setCardRef(el, idx)}
                style={{ scrollSnapAlign: "start", height: "100%" }}
              >
                <FeatureCard item={item} tilt />
              </div>
            ))}
          </div>

          <button
            type="button"
            aria-label="Scroll right"
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

export default WhyChooseUs;
