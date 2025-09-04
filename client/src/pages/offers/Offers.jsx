// src/pages/offers/Offers.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../../utils/api";
import { Link } from "react-router-dom";

const CURRENCY = import.meta.env.VITE_CURRENCY || "AED";
const LOCALE = CURRENCY === "AED" ? "en-AE" : "en-IN";
const fmt = (n) =>
  new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: CURRENCY,
  }).format(Number(n) || 0);

const Offers = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [q, setQ] = useState("");
  const [onlyActive, setOnlyActive] = useState(true);

  const timerRef = useRef(null);

  const fetchPublicOffers = async () => {
    setLoading(true);
    setErr("");
    try {
      const params = new URLSearchParams();
      params.set("sort", "-isFeatured,-endDate");
      if (onlyActive) params.set("active", "true");
      if (q) params.set("q", q);

      const { data } = await api
        .get(`/api/offers/public?${params.toString()}`)
        .catch(async () => {
          // fallback to /api/offers?public=true if your API differs
          const r = await api.get(
            `/api/offers?public=true&${params.toString()}`
          );
          return r;
        });

      const items = Array.isArray(data)
        ? data
        : data.items || data.offers || [];
      setList(items);
    } catch (e) {
      setErr(
        e?.response?.data?.message || e?.message || "Failed to load offers"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicOffers();

    // Poll every 45s to keep fresh
    timerRef.current = setInterval(fetchPublicOffers, 45000);

    // Refetch when page becomes visible / focus
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchPublicOffers();
    };
    const onFocus = () => fetchPublicOffers();

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);

    // Instant update when admin changes something (same tab testing)
    const onOffersChanged = () => fetchPublicOffers();
    window.addEventListener("offers:changed", onOffersChanged);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("offers:changed", onOffersChanged);
    };
  }, []); // eslint-disable-line

  const visible = useMemo(() => {
    const now = new Date();
    return list.filter((o) => {
      if (!onlyActive) return true;
      const startOk = o.startDate ? new Date(o.startDate) <= now : true;
      const endOk = o.endDate ? new Date(o.endDate) >= now : true;
      return o.isActive !== false && startOk && endOk;
    });
  }, [list, onlyActive]);

  const chip = (o) => {
    if (!o?.isActive) return <span className="badge bg-secondary">Hidden</span>;
    const now = new Date();
    if (o.endDate && new Date(o.endDate) < now)
      return <span className="badge bg-dark">Expired</span>;
    if (o.startDate && new Date(o.startDate) > now)
      return <span className="badge bg-info text-dark">Upcoming</span>;
    return <span className="badge bg-success">Active</span>;
  };

  const discountText = (o) =>
    o.discountType === "flat"
      ? `${fmt(o.discountValue)} OFF`
      : `${Number(o.discountValue || 0)}% OFF`;

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <h2 className="mb-0">Offers</h2>
        <div className="d-flex flex-wrap gap-2">
          <div className="input-group" style={{ maxWidth: 320 }}>
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input
              className="form-control"
              placeholder="Search offers…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchPublicOffers()}
            />
            <button
              className="btn btn-outline-secondary"
              onClick={fetchPublicOffers}
            >
              Search
            </button>
          </div>

          <div className="form-check ms-1">
            <input
              className="form-check-input"
              type="checkbox"
              id="onlyActive"
              checked={onlyActive}
              onChange={(e) => setOnlyActive(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="onlyActive">
              Show only active
            </label>
          </div>
        </div>
      </div>

      {err && <div className="alert alert-danger">{err}</div>}

      {loading ? (
        <div className="py-5 text-center">
          <div
            className="spinner-border"
            role="status"
            aria-hidden="true"
          ></div>
        </div>
      ) : visible.length === 0 ? (
        <div className="py-5 text-center text-muted">No offers available.</div>
      ) : (
        <div className="row g-3 g-md-4">
          {visible.map((o) => {
            const img =
              o.banner?.url ||
              o.banner ||
              o.image ||
              "/assets/placeholder-wide.jpg";
            const start = o.startDate
              ? new Date(o.startDate).toLocaleDateString()
              : "—";
            const end = o.endDate
              ? new Date(o.endDate).toLocaleDateString()
              : "—";

            const to =
              o.target && o.target !== "*"
                ? `/flowers/collections/${o.target}`
                : "/shop";

            return (
              <div className="col-12 col-sm-6 col-lg-4" key={o._id}>
                <div className="card shadow-sm h-100">
                  <div className="ratio ratio-16x9">
                    <img
                      src={img}
                      alt={o.title}
                      className="card-img-top object-fit-cover"
                    />
                  </div>
                  <div className="card-body d-flex flex-column">
                    <div className="d-flex align-items-start justify-content-between">
                      <h5 className="card-title mb-1">{o.title}</h5>
                      {!!o.isFeatured && (
                        <span className="badge bg-danger ms-2">Featured</span>
                      )}
                    </div>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <span className="badge bg-primary">
                        {discountText(o)}
                      </span>
                      {chip(o)}
                    </div>
                    {o.description && (
                      <p className="text-muted small mb-2">{o.description}</p>
                    )}
                    <div className="small text-muted mb-3">
                      Valid: {start} → {end}
                      {o.couponCode && (
                        <span className="badge bg-dark ms-2">
                          {o.couponCode}
                        </span>
                      )}
                    </div>
                    <div className="mt-auto d-flex gap-2">
                      <Link to={to} className="btn btn-pink w-100">
                        Shop Now
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Offers;
