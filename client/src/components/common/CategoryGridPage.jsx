// src/components/pages/CategoryGridPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Container, Row, Col, Button, Spinner, Alert } from "react-bootstrap";
import { Helmet } from "react-helmet-async";
import Cards from "../ui/Cards";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

/**
 * Generic grid page used by Type/Color/Occasion/Collection routes.
 * Props:
 * - title: string (H1 + SEO)
 * - heroImg: string (background image path)
 * - description: string (optional line under title)
 * - category: string (primary value to try first; server will auto-map to the right field)
 * - altFilters: {key, value}[] fallbacks (e.g., [{ key: "occasion", value: "Birthday" }])
 * - gridId: string (optional anchor id to scroll to grid)
 */
const CategoryGridPage = ({
  title,
  heroImg,
  description,
  category,
  altFilters = [],
  gridId,
}) => {
  const [items, setItems] = useState([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const pageTitle = useMemo(
    () => (title ? `${title} – Paon Flowers` : "Paon Flowers"),
    [title]
  );

  const parseList = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.products)) return data.products;
    if (Array.isArray(data?.data)) return data.data;
    // some APIs nest into pagination; we’re defensive:
    if (Array.isArray(data?.pagination?.items)) return data.pagination.items;
    return [];
  };

  const fetchOnce = async (paramsObj = {}) => {
    const url = new URL(`${API_BASE}/products`);
    Object.entries(paramsObj).forEach(([k, v]) => {
      if (v != null && v !== "") url.searchParams.set(k, v);
    });
    if (!url.searchParams.has("limit")) url.searchParams.set("limit", "12");
    if (!url.searchParams.has("sort"))
      url.searchParams.set("sort", "-createdAt");

    const r = await fetch(url.toString(), { credentials: "include" });
    if (!r.ok) throw new Error(await r.text());
    const data = await r.json();
    return parseList(data);
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      setPending(true);
      setError("");
      try {
        // 1) Try the generic `category` param first (server auto-maps to type/color/occasion/collection)
        const primary = await fetchOnce({ category });
        if (alive && primary.length > 0) {
          setItems(primary);
          return;
        }

        // 2) Then try explicit fallbacks (e.g., { key: "occasion", value: "Birthday" })
        for (const f of altFilters) {
          if (!alive) return;
          const list = await fetchOnce({ [f.key]: f.value });
          if (list.length > 0) {
            setItems(list);
            return;
          }
        }

        // 3) Nothing found
        if (alive) setItems([]);
      } catch (e) {
        if (alive) setError(e?.message || "Failed to load products.");
      } finally {
        if (alive) setPending(false);
      }
    })();
    return () => {
      alive = false;
    };
    // re-run only if the target category or fallbacks change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, JSON.stringify(altFilters)]);

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        {description && <meta name="description" content={description} />}
      </Helmet>

      {/* Hero */}
      <section
        className="d-flex align-items-center justify-content-center position-relative"
        style={{
          minHeight: "300px",
          backgroundImage: `url(${heroImg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{ background: "rgba(0,0,0,.45)" }}
        />
        <Container style={{ position: "relative", zIndex: 1 }}>
          <h1 className="display-5 fw-bold text-white">{title}</h1>
          {description && (
            <p className="lead mb-4 text-white-50">{description}</p>
          )}
          {gridId && (
            <Button
              variant="light"
              size="lg"
              onClick={() => {
                const el = document.getElementById(gridId);
                if (el)
                  el.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              Browse
            </Button>
          )}
        </Container>
      </section>

      {/* Grid */}
      <Container className="py-5" id={gridId || "grid"}>
        {pending && (
          <div className="d-flex justify-content-center my-5">
            <Spinner animation="border" role="status" />
          </div>
        )}
        {!pending && error && <Alert variant="danger">{error}</Alert>}
        {!pending && !error && items.length === 0 && (
          <Alert variant="secondary">
            No products found. Add items in the Admin panel and they’ll appear
            here.
          </Alert>
        )}

        <Row xs={1} sm={2} md={3} lg={4} className="g-4">
          {items.map((p) => (
            <Col key={p._id || p.slug || p.id}>
              <Cards product={p} />
            </Col>
          ))}
        </Row>
      </Container>
    </>
  );
};

export default CategoryGridPage;
