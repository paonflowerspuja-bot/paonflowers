import React from "react";

// -------------------- UTIL --------------------
const IMG = (p) => {
  if (!p) return "images/fallback.jpg";
  if (/^(https?:|data:|\/)/i.test(p)) return p;
  return "/" + String(p).replace(/^\/+/, "");
};

// -------------------- DATA --------------------
const data = {
  hero: {
    title: "Hi, We’re Paon Flowers",
    subtitle:
      "A Dubai-based premium flower studio crafting bespoke bouquets for every occasion — with flexible customization, negotiable pricing, and a happiness-first mindset.",
    image: "/images/paonshop.jpeg",
    cta: { label: "Shop Best Sellers", href: "/shop" },
  },
  guarantee: {
    title: "Happiness Guarantee",
    text: "We want your flowers to be perfect. If anything falls short, we’ll make it right with a replacement or credit — because your joy is our benchmark.",
  },
  mission: {
    leftImage: "/images/rose.jpg",
    heading: "Our Mission",
    text: [
      "We’re obsessed with the beauty of customization. Every bouquet can be tailored to your vision and budget — and yes, prices are negotiable.",
      "Based in Dubai, we serve the local community with exquisite designs for every occasion. Our flexible approach and friendly consultation ensure you get exactly what you desire.",
    ],
  },
  difference: {
    heading: "Our Difference",
    cards: [
      {
        icon: "🎯",
        title: "Customization First",
        blurb:
          "Personalize every detail. Share inspiration, colors, and budget — we’ll craft it to perfection.",
      },
      {
        icon: "🌿",
        title: "Farm‑Fresh Quality",
        blurb:
          "Premium stems sourced from trusted farms so arrangements stay fresher for longer.",
      },
      {
        icon: "💞",
        title: "Rooted in Kindness",
        blurb:
          "Community-minded, ethically run, and here to spread joy — one bouquet at a time.",
      },
    ],
    backdrop: "/images/hero-bg.jpg",
  },
  detailSections: [
    {
      title: "Farm‑Fresh Quality",
      image: "/images/farm-fresh-quality.jpg",
      body: [
        "No middlemen. We source directly from farms so bouquets arrive vibrant and long‑lasting.",
        "We obsess over design, freshness, and finishing so your gift looks beautiful on day one — and beyond.",
      ],
    },
    {
      title: "Customization & Negotiation",
      image: "/images/customization.jpg",
      body: [
        "Tell us your vision — style, palette, size, add‑ons (balloons, teddy bears) — and your budget.",
        "We work flexibly and transparently, with negotiable pricing so you get exactly what you want.",
      ],
    },
    {
      title: "Delivery in Dubai",
      image: "/images/delivery.png",
      body: [
        "Free same‑day delivery within a 10 km radius of our locality.",
        "Dubai‑wide delivery for pre‑orders with 24‑hour notice (excluding a 10–12 km range).",
        "Scheduling is available for pre‑orders. Deliveries are coordinated via Google Maps and charges may apply by location.",
      ],
    },
  ],
  trust: {
    heading: "Trusted & Transparent",
    body: [
      "Your trust is important to us. Details regarding business license, VAT registration, and other relevant information will be readily accessible on our website for peace of mind.",
      "\u0627\u0644\u0632\u0647\u0648\u0631 \u0647\u064a \u0647\u0645\u0633\u0627\u062a \u0627\u0644\u0637\u0628\u064a\u0639\u0629\u060c \u062a\u0631\u0633\u0645 \u0627\u0644\u0628\u0647\u062c\u0629 \u0639\u0644\u0649 \u0627\u0644\u0642\u0644\u0648\u0628.",
      "(Flowers are the whispers of nature, painting joy on hearts.)",
    ],
  },
  payments: {
    heading: "Payments & Order Processing",
    bullets: [
      "Accepted payments: credit card, debit card, bank account deposit, link payment.",
      "Cash on delivery is not available.",
      "Automated receipts are provided.",
      "Order processing requires a contact number and call verification.",
    ],
  },
  offers: {
    heading: "Offers & Occasions",
    bullets: [
      "Occasion‑wise offers across Mother’s Day, Graduation, Valentine’s Day, Women’s Day, Eid, and more.",
      "Special vouchers for regular customers.",
      "Blog, FAQs, and Terms & Conditions pages for clarity and support.",
      "Multi‑lingual support (Arabic & English) — product page content available in both languages.",
    ],
  },
  story: {
    heading: "From Buds to Paon",
    sub: "OUR STORY",
    body: "Started with a simple idea: make premium, bespoke flowers accessible and unbelievably fresh for Dubai. Today, Paon Flowers blends artful design with local know‑how to deliver easier, fresher, kinder blooms.",
    images: ["/images/profile.png", "/images/profile.png"],
  },
  shopWithUs: {
    heading: "Come Shop With Us",
    items: [
      {
        title: "Best Sellers",
        image: "/assets/about/shop-best.jpg",
        cta: { label: "Shop Now", href: "/shop/best-sellers" },
      },
      {
        title: "All Flowers",
        image: "/assets/about/shop-all.jpg",
        cta: { label: "Shop All", href: "/shop" },
      },
    ],
  },
};

// -------------------- PAGE --------------------
export default function AboutPaonFlowers() {
  return (
    <main className="about-paon">
      {/* HERO */}
      <section className="container-fluid bg-dark text-light py-5">
        <div className="container py-3">
          <div className="row g-4 align-items-center">
            <div className="col-12 col-lg-6">
              <h1 className="display-5 fw-bold mb-3">{data.hero.title}</h1>
              <p className="lead mb-4">{data.hero.subtitle}</p>
              <a href={data.hero.cta.href} className="btn btn-light btn-lg">
                {data.hero.cta.label}
              </a>
            </div>
            <div className="col-12 col-lg-6">
              <div className="ratio ratio-16x9 rounded-4 overflow-hidden shadow">
                <img
                  src={IMG(data.hero.image)}
                  alt="Bouquet hero"
                  className="w-100 h-100 object-fit-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GUARANTEE */}
      <section className="bg-success text-light py-5">
        <div className="container text-center">
          <h2 className="h3 fw-bold mb-3">{data.guarantee.title}</h2>
          <p className="mb-0 opacity-90">{data.guarantee.text}</p>
        </div>
      </section>

      {/* MISSION split */}
      <section className="container py-5">
        <div className="row g-4 align-items-center">
          <div className="col-12 col-lg-6">
            <div className="ratio ratio-4x3 rounded-4 overflow-hidden shadow-sm">
              <img
                src={IMG(data.mission.leftImage)}
                alt="Smiling with bouquet"
                className="w-100 h-100 object-fit-cover"
              />
            </div>
          </div>
          <div className="col-12 col-lg-6">
            <h3 className="h4 fw-bold mb-3">{data.mission.heading}</h3>
            {data.mission.text.map((t, i) => (
              <p className="mb-2" key={i}>
                {t}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* OUR DIFFERENCE cards with backdrop */}
      <section
        className="position-relative py-5"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,.55), rgba(0,0,0,.55)), url(${IMG(
            data.difference.backdrop
          )})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="container text-light">
          <h3 className="h4 fw-bold text-center mb-4">
            {data.difference.heading}
          </h3>
          <div className="row g-4">
            {data.difference.cards.map((c, idx) => (
              <div className="col-12 col-md-4" key={idx}>
                <div className="card h-100 shadow border-0 rounded-4">
                  <div className="card-body p-4 text-center">
                    <div className="display-6" aria-hidden>
                      {c.icon}
                    </div>
                    <h4 className="h6 fw-bold mt-3">{c.title}</h4>
                    <p className="mb-0 small text-muted">{c.blurb}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* THREE DETAIL SECTIONS */}
      {data.detailSections.map((sec, i) => (
        <section className="container py-5" key={i}>
          <div
            className={`row g-4 align-items-center ${
              i % 2 ? "flex-row-reverse" : ""
            }`}
          >
            <div className="col-12 col-lg-6">
              <div className="ratio ratio-4x3 rounded-4 overflow-hidden shadow-sm">
                <img
                  src={IMG(sec.image)}
                  alt={sec.title}
                  className="w-100 h-100 object-fit-cover"
                />
              </div>
            </div>
            <div className="col-12 col-lg-6">
              <h3 className="h4 fw-bold mb-3">{sec.title}</h3>
              {sec.body.map((p, j) => (
                <p className="mb-2" key={j}>
                  {p}
                </p>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* TRUST */}
      <section className="bg-light py-5">
        <div className="container">
          <h3 className="h4 fw-bold mb-3 text-center">{data.trust.heading}</h3>
          <div className="row justify-content-center">
            <div className="col-12 col-lg-9">
              {data.trust.body.map((p, i) => (
                <p className="text-center mb-2" key={i}>
                  {p}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PAYMENTS & OFFERS */}
      <section className="container py-5">
        <div className="row g-4">
          <div className="col-12 col-lg-6">
            <div className="p-4 rounded-4 border h-100">
              <h4 className="h5 fw-bold mb-3">{data.payments.heading}</h4>
              <ul className="mb-0">
                {data.payments.bullets.map((b, i) => (
                  <li className="mb-2" key={i}>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="col-12 col-lg-6">
            <div className="p-4 rounded-4 border h-100">
              <h4 className="h5 fw-bold mb-3">{data.offers.heading}</h4>
              <ul className="mb-0">
                {data.offers.bullets.map((b, i) => (
                  <li className="mb-2" key={i}>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* STORY */}
      <section className="bg-dark text-light py-5">
        <div className="container">
          <p className="text-uppercase small mb-1 opacity-75">
            {data.story.sub}
          </p>
          <h3 className="h4 fw-bold mb-3">{data.story.heading}</h3>
          <div className="row g-4 align-items-center">
            <div className="col-12 col-lg-6">
              <p className="mb-0">{data.story.body}</p>
            </div>
            <div className="col-12 col-lg-6">
              <div className="row g-3">
                {data.story.images.map((im, i) => (
                  <div className="col-6" key={i}>
                    <div className="ratio ratio-1x1 rounded-4 overflow-hidden shadow">
                      <img
                        src={IMG(im)}
                        alt={`Story ${i + 1}`}
                        className="w-100 h-100 object-fit-cover"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SHOP WITH US */}
      <section className="container py-5">
        <h3 className="h4 fw-bold text-center mb-4">
          {data.shopWithUs.heading}
        </h3>
        <div className="row g-4 justify-content-center">
          {data.shopWithUs.items.map((item, i) => (
            <div className="col-10 col-sm-6 col-md-4 col-lg-3" key={i}>
              <div className="text-center p-3 h-100 d-flex flex-column">
                <div
                  className="rounded-circle overflow-hidden shadow mx-auto"
                  style={{ width: 220, height: 220 }}
                >
                  <img
                    src={IMG(item.image)}
                    alt={item.title}
                    className="w-100 h-100 object-fit-cover"
                  />
                </div>
                <h4 className="h6 fw-bold mt-3">{item.title}</h4>
                <a
                  href={item.cta.href}
                  className="btn btn-dark mt-auto align-self-center"
                >
                  {item.cta.label}
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
