// src/pages/Weddings.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const WHATSAPP_PHONE = import.meta.env.VITE_WHATSAPP_NUMBER || "+971500000000"; // e.g. +9715XXXXXXX

const Weddings = () => {
  const heroRef = useRef(null);
  const sectionRefs = useRef([]);
  const formRef = useRef(null);

  // Selected package
  const [selectedPkg, setSelectedPkg] = useState(null);

  // Brief form state
  const [brief, setBrief] = useState({
    date: "",
    time: "",
    venue: "",
    theme: "",
    colors: "",
    guests: "",
    budget: "",
    notes: "",
  });

  // Package data (easy to extend or fetch)
  const packages = useMemo(
    () => [
      {
        id: "full",
        title: "Full Service Wedding",
        description:
          "Complete floral setup: stage, aisles, centerpieces, bridal bouquet & boutonnières.",
        includes: [
          "Stage & Aisle Décor",
          "Centerpieces",
          "Bridal Bouquet",
          "Setup & Teardown",
        ],
        priceFrom: 2499, // AED
        cta: "Book Now",
        img: "/images/wedding/full-service.jpg",
      },
      {
        id: "box",
        title: "Wedding Flowers in a Box",
        description:
          "Elegant pre-arranged luxury boxes, perfect for receptions or as gift sets.",
        includes: [
          "Luxury Box Arrangements",
          "Ribbon & Card",
          "Same-day Options",
        ],
        priceFrom: 249,
        cta: "Order Now",
        img: "/images/wedding/flowers-in-box.jpg",
      },
      {
        id: "ready",
        title: "Wedding Ready Flowers",
        description:
          "Curated fresh flower sets delivered to your venue—unpack & decorate instantly.",
        includes: ["Bouquets & Sprays", "Mixed Greens", "Venue Delivery"],
        priceFrom: 799,
        cta: "Explore",
        img: "/images/wedding/ready-sets.jpg",
      },
    ],
    []
  );

  // Animations
  useEffect(() => {
    if (heroRef.current) {
      gsap.fromTo(
        heroRef.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1, ease: "power3.out" }
      );
    }

    sectionRefs.current.forEach((el, idx) => {
      if (!el) return;
      gsap.fromTo(
        el,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          delay: idx * 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 80%",
          },
        }
      );
    });

    if (formRef.current) {
      gsap.fromTo(
        formRef.current,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: 0.25,
          ease: "power2.out",
          scrollTrigger: {
            trigger: formRef.current,
            start: "top 85%",
          },
        }
      );
    }
  }, []);

  const handleBrief = (e) => {
    const { name, value } = e.target;
    setBrief((b) => ({ ...b, [name]: value }));
  };

  // Build WhatsApp message
  const buildWhatsAppMessage = (pkg) => {
    const lines = [
      `Hi Paon Flowers 👋`,
      `I'd like to inquire about: ${pkg?.title || "Wedding flowers"}`,
      pkg ? `Package ID: ${pkg.id}` : null,
      pkg?.priceFrom ? `Package starts from: AED ${pkg.priceFrom}` : null,
      "",
      "Event Details:",
      brief.date ? `• Date: ${brief.date}` : null,
      brief.time ? `• Time: ${brief.time}` : null,
      brief.venue ? `• Venue: ${brief.venue}` : null,
      brief.theme ? `• Theme: ${brief.theme}` : null,
      brief.colors ? `• Color palette: ${brief.colors}` : null,
      brief.guests ? `• Guests: ${brief.guests}` : null,
      brief.budget ? `• Budget: AED ${brief.budget}` : null,
      brief.notes ? `• Notes: ${brief.notes}` : null,
      "",
      "Please share availability, design options, and next steps. Thank you!",
    ].filter(Boolean);

    return encodeURIComponent(lines.join("\n"));
  };

  const openWhatsApp = (pkg) => {
    const txt = buildWhatsAppMessage(pkg || selectedPkg);
    const url = `https://wa.me/${WHATSAPP_PHONE.replace(
      /\D/g,
      ""
    )}?text=${txt}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="weddings-page">
      <Helmet>
        <title>Wedding Flowers & Packages | Paon Flowers Dubai</title>
        <meta
          name="description"
          content="Premium wedding flowers in Dubai: full-service décor, luxury box arrangements, and ready sets. Customize your theme, colors, and budget—chat on WhatsApp."
        />
      </Helmet>

      {/* HERO */}
      <section
        ref={heroRef}
        className="position-relative"
        style={{
          minHeight: "52vh",
          display: "grid",
          placeItems: "center",
          background:
            "linear-gradient(180deg, rgba(255,235,240,0.7), rgba(255,255,255,0.9)), url('/images/wedding/hero.jpg') center/cover no-repeat",
        }}
      >
        <div className="container py-5">
          <div className="row align-items-center g-4">
            <div className="col-12 col-lg-7 text-center text-lg-start">
              <h1 className="display-5 fw-bold heading2 mb-3">
                Weddings, styled to perfection 💍
              </h1>
              <p className="lead text-muted mb-4">
                From bridal bouquets to breathtaking stages—we tailor every
                petal to your story.
              </p>
              <div className="d-flex flex-column flex-sm-row gap-2">
                <button
                  className="btn btn-pink btn-lg px-4"
                  onClick={() => openWhatsApp(selectedPkg)}
                >
                  Chat on WhatsApp
                </button>
                <a
                  href="#packages"
                  className="btn btn-outline-pink btn-lg px-4"
                >
                  View Packages
                </a>
              </div>
              <p className="small text-muted mt-2">
                Fast replies • Real photos • Same-day options in Dubai
              </p>
            </div>
            <div className="col-12 col-lg-5">
              <div className="card shadow border-0">
                <div className="card-body">
                  <h5 className="mb-3">Quick Wedding Brief ✍️</h5>
                  <div className="row g-3">
                    <div className="col-12 col-sm-6">
                      <label className="form-label">Date</label>
                      <input
                        type="date"
                        className="form-control"
                        name="date"
                        value={brief.date}
                        onChange={handleBrief}
                      />
                    </div>
                    <div className="col-12 col-sm-6">
                      <label className="form-label">Time</label>
                      <input
                        type="time"
                        className="form-control"
                        name="time"
                        value={brief.time}
                        onChange={handleBrief}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Venue</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g., Atlantis The Palm"
                        name="venue"
                        value={brief.venue}
                        onChange={handleBrief}
                      />
                    </div>
                    <div className="col-12 col-sm-6">
                      <label className="form-label">Theme</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Classic / Rustic / Modern"
                        name="theme"
                        value={brief.theme}
                        onChange={handleBrief}
                      />
                    </div>
                    <div className="col-12 col-sm-6">
                      <label className="form-label">Colors</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g., Blush, Ivory, Gold"
                        name="colors"
                        value={brief.colors}
                        onChange={handleBrief}
                      />
                    </div>
                    <div className="col-12 col-sm-6">
                      <label className="form-label">Guests</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="e.g., 150"
                        name="guests"
                        min="0"
                        value={brief.guests}
                        onChange={handleBrief}
                      />
                    </div>
                    <div className="col-12 col-sm-6">
                      <label className="form-label">Budget (AED)</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="e.g., 5000"
                        name="budget"
                        min="0"
                        value={brief.budget}
                        onChange={handleBrief}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Notes</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        placeholder="Special requests, favorite flowers, timing, etc."
                        name="notes"
                        value={brief.notes}
                        onChange={handleBrief}
                      />
                    </div>
                  </div>
                  <div className="d-grid mt-3">
                    <button
                      className="btn btn-success"
                      onClick={() => openWhatsApp(selectedPkg)}
                    >
                      Send Brief on WhatsApp
                    </button>
                  </div>
                  <p className="small text-muted mt-2 mb-0">
                    We’ll confirm availability, share designs & finalize pricing
                    on WhatsApp.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PACKAGES */}
      <section
        className="py-5"
        id="packages"
        ref={(el) => (sectionRefs.current[0] = el)}
      >
        <div className="container">
          <h2 className="subheading2 text-center mb-4">Wedding Packages</h2>
          <p className="text-center text-muted mb-5">
            Choose a package to start—add your theme, colors, and venue in one
            tap.
          </p>

          <div className="row g-4 text-center">
            {packages.map((pkg) => (
              <div className="col-12 col-md-6 col-lg-4 d-flex" key={pkg.id}>
                <div className="card shadow border-0 p-0 h-100 flex-fill">
                  {pkg.img && (
                    <img
                      src={pkg.img}
                      alt={pkg.title}
                      className="card-img-top"
                      style={{ height: 200, objectFit: "cover" }}
                      loading="lazy"
                    />
                  )}
                  <div className="card-body d-flex flex-column">
                    <h4 className="text-pink">{pkg.title}</h4>
                    <p className="text-muted">{pkg.description}</p>
                    <ul
                      className="list-unstyled small text-muted text-start mx-auto"
                      style={{ maxWidth: 320 }}
                    >
                      {pkg.includes.map((it, i) => (
                        <li key={i}>• {it}</li>
                      ))}
                    </ul>
                    <div className="mt-auto">
                      <p className="fw-semibold mb-3">
                        Starting from AED {pkg.priceFrom}
                      </p>
                      <div className="d-grid gap-2">
                        <button
                          className="btn btn-outline-pink"
                          onClick={() => setSelectedPkg(pkg)}
                        >
                          {selectedPkg?.id === pkg.id
                            ? "Selected ✅"
                            : "Select"}
                        </button>
                        <button
                          className="btn btn-pink"
                          onClick={() => openWhatsApp(pkg)}
                          aria-label={`${pkg.cta} on WhatsApp for ${pkg.title}`}
                        >
                          {pkg.cta}
                        </button>
                      </div>
                      {selectedPkg?.id === pkg.id && (
                        <p className="small text-success mt-2 mb-0">
                          Selected package will be included in WhatsApp message.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Trust strip */}
          <div
            className="row mt-5 g-3"
            ref={(el) => (sectionRefs.current[1] = el)}
          >
            <div className="col-12 text-center">
              <div className="d-inline-flex flex-wrap gap-3 align-items-center justify-content-center small text-muted">
                <span>✅ Design mockups</span>
                <span>✅ On-site setup</span>
                <span>✅ Same-day options</span>
                <span>✅ Venue coordination</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section
        className="py-5 bg-light"
        ref={(el) => (sectionRefs.current[2] = el)}
      >
        <div className="container">
          <h2 className="subheading2 text-center mb-4">Customer Reviews</h2>
          <div className="row g-4">
            {[
              {
                q: "Absolutely stunning flowers! My wedding looked magical thanks to Paon Flowers.",
                a: "— Sarah W.",
              },
              {
                q: "Professional service, on-time delivery, and premium quality arrangements.",
                a: "— Ahmed R.",
              },
              {
                q: "They made my big day unforgettable. Highly recommend for weddings!",
                a: "— Maria D.",
              },
            ].map((r, i) => (
              <div className="col-12 col-md-4" key={i}>
                <div className="p-4 shadow-sm rounded bg-white h-100">
                  <p className="mb-2">“{r.q}”</p>
                  <h6 className="mb-0 text-muted">{r.a}</h6>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-5" ref={(el) => (sectionRefs.current[3] = el)}>
        <div className="container">
          <h2 className="subheading2 text-center mb-4">Wedding FAQs</h2>
          <div
            className="accordion mx-auto"
            id="faqAccordion"
            style={{ maxWidth: 860 }}
          >
            <div className="accordion-item">
              <h2 className="accordion-header" id="q1">
                <button
                  className="accordion-button"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#faq1"
                >
                  Do you provide customized wedding flower packages?
                </button>
              </h2>
              <div
                id="faq1"
                className="accordion-collapse collapse show"
                data-bs-parent="#faqAccordion"
              >
                <div className="accordion-body">
                  Yes, we design custom floral arrangements tailored to your
                  theme and budget (stages, aisles, centerpieces, bouquets).
                </div>
              </div>
            </div>

            <div className="accordion-item">
              <h2 className="accordion-header" id="q2">
                <button
                  className="accordion-button collapsed"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#faq2"
                >
                  How far in advance should I book?
                </button>
              </h2>
              <div
                id="faq2"
                className="accordion-collapse collapse"
                data-bs-parent="#faqAccordion"
              >
                <div className="accordion-body">
                  We recommend booking at least 2 months ahead. Same-day options
                  may be available—chat on WhatsApp to confirm.
                </div>
              </div>
            </div>

            <div className="accordion-item">
              <h2 className="accordion-header" id="q3">
                <button
                  className="accordion-button collapsed"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#faq3"
                >
                  Do you deliver and handle setup at venues?
                </button>
              </h2>
              <div
                id="faq3"
                className="accordion-collapse collapse"
                data-bs-parent="#faqAccordion"
              >
                <div className="accordion-body">
                  Yes, we deliver and fully set up at venues across Dubai. We
                  also coordinate timing with venue staff.
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-4">
            <button
              className="btn btn-pink btn-lg"
              onClick={() => openWhatsApp(selectedPkg)}
            >
              Chat Now on WhatsApp
            </button>
            <p className="small text-muted mt-2 mb-0">
              Share your date & venue—we’ll suggest designs and a clear quote.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Weddings;
