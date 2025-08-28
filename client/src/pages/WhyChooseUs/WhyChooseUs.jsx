import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

const DEFAULT_FEATURES = [
  {
    icon: "bi-truck",
    title: "Same-Day Delivery",
    text: "We deliver fresh flowers the same day, anywhere in Dubai.",
  },
  {
    icon: "bi-stars",
    title: "Premium Quality",
    text: "Our flowers are handpicked and curated for elegance.",
  },
  {
    icon: "bi-gift",
    title: "Custom Gifting",
    text: "Personalized floral gifts for your special occasions.",
  },
];

const FeatureCard = React.forwardRef(({ item }, ref) => (
  <div ref={ref} className="pf-why-card" tabIndex={0}>
    <div className="pf-why-card-body">
      <div className="pf-why-icon">
        <i className={`bi ${item.icon}`} aria-hidden="true" />
      </div>
      <h5 className="pf-why-title">{item.title}</h5>
      <p className="pf-why-text">{item.text}</p>
    </div>
    <div className="pf-why-accent" />
  </div>
));

const WhyChooseUs = ({
  items = DEFAULT_FEATURES,
  sectionId = "why-choose-us",
}) => {
  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const railRef = useRef(null);
  const cardRefs = useRef([]);

  const [hasOverflow, setHasOverflow] = useState(false);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(headingRef.current, {
        y: 18,
        autoAlpha: 0,
        duration: 0.55,
        ease: "power2.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
          once: true,
        },
      });
      gsap.from(cardRefs.current, {
        y: 18,
        autoAlpha: 0,
        duration: 0.55,
        ease: "power2.out",
        stagger: 0.08,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
          once: true,
        },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const updateScrollState = () => {
    const el = railRef.current;
    if (!el) return;
    const overflow = el.scrollWidth > el.clientWidth + 1;
    setHasOverflow(overflow);
    const sl = el.scrollLeft;
    const max = el.scrollWidth - el.clientWidth;
    setAtStart(sl <= 1);
    setAtEnd(sl >= max - 1);
  };

  useEffect(() => {
    updateScrollState();
    const onResize = () => updateScrollState();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const getStep = () => {
    const col = railRef.current?.querySelector(".pf-why-col");
    const gap = parseFloat(getComputedStyle(railRef.current).gap || "24");
    return (col?.offsetWidth || 320) + gap;
  };

  const scrollByStep = (dir = 1) => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * getStep(), behavior: "smooth" });
  };

  return (
    <section
      id={sectionId}
      ref={sectionRef}
      className="pf-why-section"
      aria-labelledby={`${sectionId}-title`}
    >
      <div className="container">
        <h2
          id={`${sectionId}-title`}
          ref={headingRef}
          className="text-center subheading2 paon-heading fw-bold mb-4 mb-lg-5"
        >
          Why Choose Paon Flowers?
        </h2>

        <div
          className={`pf-why-rail-wrapper ${
            hasOverflow ? "pfw-has-overflow" : ""
          }`}
        >
          <button
            type="button"
            className="pfw-nav pfw-nav-left"
            aria-label="Scroll left"
            onClick={() => scrollByStep(-1)}
            disabled={!hasOverflow || atStart}
          >
            ‹
          </button>

          {/* Centered, single-line rail (equal-size cards) */}
          <div
            ref={railRef}
            className="pf-why-rail"
            onScroll={updateScrollState}
            role="list"
          >
            {items.map((item, idx) => (
              <div key={idx} className="pf-why-col" role="listitem">
                <FeatureCard
                  ref={(el) => (cardRefs.current[idx] = el)}
                  item={item}
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            className="pfw-nav pfw-nav-right"
            aria-label="Scroll right"
            onClick={() => scrollByStep(1)}
            disabled={!hasOverflow || atEnd}
          >
            ›
          </button>

          {/* Edge fades */}
          <div
            className={`pfw-edge pfw-edge-left ${atStart ? "is-hidden" : ""}`}
            aria-hidden="true"
          />
          <div
            className={`pfw-edge pfw-edge-right ${atEnd ? "is-hidden" : ""}`}
            aria-hidden="true"
          />
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
