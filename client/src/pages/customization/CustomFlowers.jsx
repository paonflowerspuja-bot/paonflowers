// src/pages/CustomFlowers.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { Helmet } from "react-helmet-async";

const WHATSAPP_PHONE = import.meta.env.VITE_WHATSAPP_NUMBER || "+971500000000"; // e.g. +9715XXXXXXX

const CustomFlowers = () => {
  const heroRef = useRef(null);
  const optionRefs = useRef([]);
  const formRef = useRef(null);
  const ctaRef = useRef(null);

  const [selectedOption, setSelectedOption] = useState(null);

  // Simple form state (kept minimal but useful for a sales brief)
  const [form, setForm] = useState({
    name: "",
    occasion: "",
    budget: "",
    date: "",
    time: "",
    area: "",
    note: "",
  });

  useEffect(() => {
    // ✅ Hero Animation
    if (heroRef.current) {
      gsap.fromTo(
        heroRef.current,
        { y: -90, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, ease: "power3.out" }
      );
    }

    // ✅ Options Animation (only if refs exist)
    if (optionRefs.current.length > 0) {
      gsap.fromTo(
        optionRefs.current,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          stagger: 0.2,
          ease: "power2.out",
          delay: 0.3,
        }
      );
    }

    // ✅ CTA + Form subtle fade
    if (ctaRef.current) {
      gsap.fromTo(
        ctaRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power2.out", delay: 0.6 }
      );
    }
    if (formRef.current) {
      gsap.fromTo(
        formRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power2.out", delay: 0.7 }
      );
    }
  }, []);

  const options = useMemo(
    () => [
      {
        id: 1,
        title: "Choose Your Flowers 🌹🌷",
        description: "Select from roses, tulips, orchids, lilies and more.",
        img: "/images/custom/choose-flowers.jpg",
      },
      {
        id: 2,
        title: "Pick Your Style 🎀",
        description: "Bouquet, basket, or box — style it your way.",
        img: "/images/custom/style.jpg",
      },
      {
        id: 3,
        title: "Add a Personal Touch 💌",
        description: "Include a heartfelt message on a beautiful card.",
        img: "/images/custom/message.jpg",
      },
    ],
    []
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  // Build a clean WhatsApp pre-filled message
  const buildWhatsAppMessage = () => {
    const lines = [
      `Hi Paon Flowers 👋`,
      `I'd like to customize a bouquet.`,
      selectedOption ? `Selected step: ${selectedOption.title}` : null,
      form.name ? `Name: ${form.name}` : null,
      form.occasion ? `Occasion: ${form.occasion}` : null,
      form.budget ? `Budget: ${form.budget}` : null,
      form.date ? `Delivery Date: ${form.date}` : null,
      form.time ? `Delivery Time: ${form.time}` : null,
      form.area ? `Area/Location: ${form.area}` : null,
      form.note ? `Notes: ${form.note}` : null,
      `Please suggest options and availability. Thank you!`,
    ].filter(Boolean);

    return encodeURIComponent(lines.join("\n"));
  };

  const openWhatsApp = () => {
    const msg = buildWhatsAppMessage();
    // wa.me works well on both mobile & desktop (desktop opens web.whatsapp.com)
    const url = `https://wa.me/${WHATSAPP_PHONE.replace(
      /\D/g,
      ""
    )}?text=${msg}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="container py-5">
      {/* ✅ SEO */}
      <Helmet>
        <title>Custom Flowers | Design Your Own Bouquet</title>
        <meta
          name="description"
          content="Design your own bouquet with our custom flowers service. Choose flowers, style, and add a personal touch with message cards."
        />
      </Helmet>

      {/* ✅ Hero Section */}
      <div ref={heroRef} className="text-center mb-5 hero-section">
        <h1 className="heading2">Custom Flowers</h1>
        <p className="lead text-muted mb-4">
          Create a <strong>bouquet as unique as your love</strong>. Choose your
          flowers, style, and add a personal message 🌸✨
        </p>

        {/* Primary CTA to WhatsApp */}
        <div ref={ctaRef}>
          <button className="btn btn-pink btn-lg px-4" onClick={openWhatsApp}>
            Chat on WhatsApp for Customization
          </button>
          <p className="text-muted small mt-2">
            Fast replies • Real-time options • Same-day availability in Dubai
          </p>
        </div>
      </div>

      {/* ✅ Options Section */}

      {/* ✅ Quick Brief Form + WhatsApp */}
      <div className="row mt-5 g-4 align-items-start">
        <div className="col-12 col-lg-6">
          <h3 className="mb-3">Tell us your preferences ✍️</h3>
          <div ref={formRef} className="card shadow-sm border-0">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-12 col-sm-6">
                  <label className="form-label">Your Name</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    placeholder="e.g., Ayesha"
                    value={form.name}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-12 col-sm-6">
                  <label className="form-label">Occasion</label>
                  <select
                    name="occasion"
                    className="form-select"
                    value={form.occasion}
                    onChange={handleChange}
                  >
                    <option value="">Select...</option>
                    <option>Birthday</option>
                    <option>Anniversary</option>
                    <option>Get Well Soon</option>
                    <option>Congratulations</option>
                    <option>Proposal</option>
                    <option>Eid</option>
                    <option>Valentine's Day</option>
                  </select>
                </div>
                <div className="col-12 col-sm-6">
                  <label className="form-label">Budget (AED)</label>
                  <input
                    type="number"
                    name="budget"
                    className="form-control"
                    placeholder="e.g., 250"
                    value={form.budget}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
                <div className="col-12 col-sm-6">
                  <label className="form-label">Delivery Area</label>
                  <input
                    type="text"
                    name="area"
                    className="form-control"
                    placeholder="e.g., Dubai Marina"
                    value={form.area}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-12 col-sm-6">
                  <label className="form-label">Delivery Date</label>
                  <input
                    type="date"
                    name="date"
                    className="form-control"
                    value={form.date}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-12 col-sm-6">
                  <label className="form-label">Preferred Time</label>
                  <input
                    type="time"
                    name="time"
                    className="form-control"
                    value={form.time}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">Additional Notes</label>
                  <textarea
                    name="note"
                    className="form-control"
                    rows={3}
                    placeholder="Colors, flower types (roses/lilies/orchids), box/basket preference, message on card, etc."
                    value={form.note}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="d-grid d-sm-flex gap-2 mt-4">
                <button
                  className="btn btn-success flex-fill"
                  onClick={openWhatsApp}
                >
                  Send Brief on WhatsApp
                </button>
                <button
                  className="btn btn-outline-secondary flex-fill"
                  onClick={() =>
                    setForm({
                      name: "",
                      occasion: "",
                      budget: "",
                      date: "",
                      time: "",
                      area: "",
                      note: "",
                    })
                  }
                >
                  Reset
                </button>
              </div>

              <p className="text-muted small mt-2 mb-0">
                We’ll confirm availability, share real photos, and finalize the
                price on WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomFlowers;
