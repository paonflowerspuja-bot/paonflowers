// src/components/pages/CategoryGridPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Container, Row, Col, Button, Spinner, Alert } from "react-bootstrap";
import { Helmet } from "react-helmet-async";
import Cards from "../ui/Cards";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const CategoryGridPage = ({
  title, // Page title (SEO + H1)
  heroImg, // Hero background image
  description, // Hero description line
  category, // Primary category to query
  altFilters = [], // [{key:'category'|'occasion', value:'...'}, ...] fallbacks if 0 results
  gridId, // anchor id for scrolling
}) => {
  const [items, setItems] = useState([]);
  const [pending, setPending] = useState(true);
  const [error, setError] = useState("");

  const anchorId =
    gridId ||
    `grid-${(category || title || "list").replace(/\s+/g, "-").toLowerCase()}`;

  // fetch helper
  const fetchOnce = async (paramsObj) => {
    const url = new URL(`${API_BASE}/products`);
    Object.entries(paramsObj).forEach(([k, v]) => {
      if (v != null && v !== "") url.searchParams.set(k, v);
    });
    // sensible defaults
    if (!url.searchParams.has("limit")) url.searchParams.set("limit", "12");
    if (!url.searchParams.has("sort"))
      url.searchParams.set("sort", "-createdAt");

    const r = await fetch(url.toString(), { credentials: "include" });
    if (!r.ok) throw new Error(await r.text());
    const data = await r.json();
    const list = Array.isArray(data) ? data : data?.products || [];
    return list;
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      setPending(true);
      setError("");
      try {
        // 1) Try category first
        const primary = await fetchOnce({ category });
        if (alive && primary.length > 0) {
          setItems(primary);
          return;
        }
        // 2) Try fallbacks (occasion / alt spellings)
        for (const f of altFilters) {
          if (!alive) return;
          const list = await fetchOnce({ [f.key]: f.value });
          if (list.length > 0) {
            setItems(list);
            return;
          }
        }
        // 3) If still nothing, keep empty state
        if (alive) setItems([]);
      } catch (e) {
        if (alive) setError(e?.message || "Failed to load products");
      } finally {
        if (alive) setPending(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [category, JSON.stringify(altFilters)]);

  const heroBg = useMemo(
    () => heroImg || "/assets/hero-default.jpg",
    [heroImg]
  );

  return (
    <>
      <Helmet>
        <title>{title} | Paon Flowers Dubai</title>
        <meta name="description" content={description} />
      </Helmet>

      {/* Hero */}
      <section
        className="d-flex align-items-center text-center text-white position-relative"
        style={{
          backgroundImage: `url('${heroBg}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: "56vh",
        }}
      >
        <div
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{ background: "rgba(0,0,0,.45)" }}
        />
        <Container style={{ position: "relative", zIndex: 1 }}>
          <h1 className="display-5 fw-bold">{title}</h1>
          {description && <p className="lead mb-4">{description}</p>}
          <Button
            variant="light"
            size="lg"
            className="btn-pink"
            onClick={() => {
              const el = document.getElementById(anchorId);
              el?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            Shop Now
          </Button>
        </Container>
      </section>

      {/* Grid */}
      <Container className="py-5" id={anchorId}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0">{title} Collection</h2>
        </div>

        {pending && (
          <div className="d-flex justify-content-center py-5">
            <Spinner animation="border" role="status" aria-hidden="true" />
          </div>
        )}

        {!!error && (
          <Alert variant="danger" className="mb-4">
            {error}
          </Alert>
        )}

        {!pending && !error && items.length === 0 && (
          <div className="text-center text-muted py-5">
            <p className="mb-3">No products yet.</p>
            <p className="small">
              Add items in the Admin panel and they’ll appear here instantly.
            </p>
          </div>
        )}

        <Row xs={1} sm={2} md={3} lg={4} className="g-4">
          {items.map((p) => (
            <Col key={p._id || p.slug}>
              <Cards product={p} />
            </Col>
          ))}
        </Row>
      </Container>
    </>
  );
};

export default CategoryGridPage;
