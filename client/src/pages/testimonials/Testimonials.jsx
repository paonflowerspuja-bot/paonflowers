import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

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
];

const Stars = ({ n = 5 }) => (
  <div className="pf-stars" aria-label={`${n} star rating`}>
    {Array.from({ length: n }).map((_, i) => (
      <span key={i} aria-hidden="true">
        ★
      </span>
    ))}
  </div>
);

const Avatar = ({ name, src }) => {
  if (src)
    return (
      <img
        src={src}
        alt={`${name} avatar`}
        className="pf-avatar-img"
        loading="lazy"
      />
    );
  const initials = name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="pf-avatar-fallback" aria-hidden="true">
      {initials}
    </div>
  );
};

const TestimonialCard = React.forwardRef(({ item }, ref) => (
  <div ref={ref} className="pf-testimonial-card" tabIndex={0}>
    <div className="pf-card-body-flex">
      <div className="pf-card-head">
        <Avatar name={item.name} src={item.avatar} />
        <div className="pf-person">
          <div className="pf-name">{item.name}</div>
          <div className="pf-role">{item.role}</div>
        </div>
        <div className="pf-stars-wrap">
          <Stars n={item.rating} />
        </div>
      </div>

      <div className="pf-card-text">
        <span className="pf-quote-mark">“</span>
        <p className="pf-quote-p">{item.text}</p>
      </div>

      <div className="pf-flex-spacer" />
    </div>

    <div className="pf-card-accent" />
  </div>
));

const Testimonials = ({
  items = DEFAULT_TESTIMONIALS,
  sectionId = "testimonials",
}) => {
  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const cardRefs = useRef([]);
  const railRef = useRef(null);

  const [hasOverflow, setHasOverflow] = useState(false);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(headingRef.current, {
        y: 24,
        autoAlpha: 0,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
          once: true,
        },
      });
      gsap.from(cardRefs.current, {
        y: 20,
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
    const col = railRef.current?.querySelector(".pf-card-col");
    const gap = parseFloat(getComputedStyle(railRef.current).gap || "24");
    return (col?.offsetWidth || 340) + gap;
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
      className="pf-testimonials-section"
      aria-labelledby={`${sectionId}-title`}
    >
      <div className="container">
        <h2
          id={`${sectionId}-title`}
          ref={headingRef}
          className="text-center subheading2 paon-heading fw-bold mb-4 mb-lg-5"
        >
          What Our Customers Say
        </h2>

        <div
          className={`pf-rail-wrapper ${hasOverflow ? "pf-has-overflow" : ""}`}
        >
          <button
            type="button"
            className="pf-nav pf-nav-left"
            aria-label="Scroll testimonials left"
            onClick={() => scrollByStep(-1)}
            disabled={!hasOverflow || atStart}
          >
            ‹
          </button>

          {/* Single-line, CENTERED rail; 3 equal cards */}
          <div ref={railRef} className="pf-rail" onScroll={updateScrollState}>
            {items.map((item, idx) => (
              <div key={idx} className="pf-card-col" role="listitem">
                <TestimonialCard
                  ref={(el) => (cardRefs.current[idx] = el)}
                  item={item}
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            className="pf-nav pf-nav-right"
            aria-label="Scroll testimonials right"
            onClick={() => scrollByStep(1)}
            disabled={!hasOverflow || atEnd}
          >
            ›
          </button>

          <div
            className={`pf-edge pf-edge-left ${atStart ? "is-hidden" : ""}`}
            aria-hidden="true"
          />
          <div
            className={`pf-edge pf-edge-right ${atEnd ? "is-hidden" : ""}`}
            aria-hidden="true"
          />
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
