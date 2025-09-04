// src/pages/admin/ManageOrders.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../../utils/api";

const STATUS_OPTIONS = [
  "placed",
  "confirmed",
  "preparing",
  "out-for-delivery",
  "delivered",
  "cancelled",
  "refunded",
];

const CURRENCY = import.meta.env.VITE_CURRENCY || "AED";
const LOCALE = CURRENCY === "AED" ? "en-AE" : "en-IN";
const fmt = (n) =>
  new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: CURRENCY,
  }).format(Number(n) || 0);

const emitOrdersChanged = () =>
  window.dispatchEvent(new CustomEvent("orders:changed"));

const badgeFor = (status) => {
  switch (status) {
    case "delivered":
      return "bg-success";
    case "out-for-delivery":
      return "bg-info text-dark";
    case "preparing":
      return "bg-warning text-dark";
    case "confirmed":
      return "bg-primary";
    case "placed":
      return "bg-secondary";
    case "cancelled":
      return "bg-danger";
    case "refunded":
      return "bg-dark";
    default:
      return "bg-secondary";
  }
};

const formatDateTime = (v) =>
  v ? new Date(v).toLocaleString(undefined, { hour12: false }) : "—";

const ManageOrders = () => {
  // data
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);

  // ui state
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState(""); // "YYYY-MM-DD"
  const [to, setTo] = useState("");

  // pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // auto refresh
  const [autoRefresh, setAutoRefresh] = useState(false);
  const timerRef = useRef(null);

  // details modal
  const [active, setActive] = useState(null); // order object
  const [updatingId, setUpdatingId] = useState(""); // for inline spinner on status change

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / limit)),
    [total, limit]
  );

  // Core fetcher (server-side filtering if available)
  const fetchOrders = async (opts = {}) => {
    const curPage = opts.page || page;
    setLoading(true);
    setErr("");
    try {
      const params = new URLSearchParams();
      params.set("limit", String(limit));
      params.set("page", String(curPage));
      params.set("sort", "-createdAt");
      if (q) params.set("q", q);
      if (status) params.set("status", status);
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const { data } = await api.get(`/api/orders?${params.toString()}`);
      // Support shapes: [] or {items,total} or {orders,total}
      const items = Array.isArray(data)
        ? data
        : data.items || data.orders || [];
      const t = Array.isArray(data)
        ? items.length
        : data.total ?? data.count ?? items.length;

      setOrders(items);
      setTotal(t);
      if (opts.page) setPage(opts.page);
    } catch (e) {
      setErr(
        e?.response?.data?.message || e?.message || "Failed to load orders"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders({ page: 1 });
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => fetchOrders({ page: 1 }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // Filters
  useEffect(() => {
    fetchOrders({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, from, to]);

  // Auto refresh (every 60s)
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoRefresh) {
      timerRef.current = setInterval(() => fetchOrders(), 60000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, page, status, from, to, q]);

  const updateStatus = async (id, next) => {
    try {
      setUpdatingId(id);
      // optimistic
      setOrders((prev) =>
        prev.map((o) => (o._id === id ? { ...o, status: next } : o))
      );
      const { data } = await api.patch(`/api/orders/${id}/status`, {
        status: next,
      });
      // reconcile with server response
      setOrders((prev) => prev.map((o) => (o._id === id ? data : o)));
      // if active modal is the same order, update it too
      setActive((cur) => (cur && cur._id === id ? { ...cur, ...data } : cur));
      emitOrdersChanged();
    } catch (e) {
      // rollback by reloading this page slice
      await fetchOrders({ page });
      alert(
        e?.response?.data?.message || e?.message || "Failed to update status"
      );
    } finally {
      setUpdatingId("");
    }
  };

  const resetFilters = () => {
    setQ("");
    setStatus("");
    setFrom("");
    setTo("");
    fetchOrders({ page: 1 });
  };

  const openDetails = (order) => setActive(order);
  const closeDetails = () => setActive(null);

  return (
    <div>
      <div className="d-flex flex-column flex-lg-row align-items-lg-end align-items-stretch justify-content-between gap-2 gap-lg-3 mb-3">
        <h2 className="mb-0">Manage Orders</h2>

        <div className="d-flex flex-wrap gap-2">
          <div className="input-group" style={{ maxWidth: 360 }}>
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input
              className="form-control"
              placeholder="Search order id, customer name/phone…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ minWidth: 180 }}
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <input
            type="date"
            className="form-control"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            aria-label="From date"
          />
          <input
            type="date"
            className="form-control"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            aria-label="To date"
          />

          <button
            className="btn btn-outline-secondary"
            onClick={() => fetchOrders({ page: 1 })}
          >
            Refresh
          </button>
          <button className="btn btn-outline-dark" onClick={resetFilters}>
            Reset
          </button>

          <div className="form-check form-switch d-flex align-items-center ms-lg-2">
            <input
              className="form-check-input"
              type="checkbox"
              id="autoRefreshOrders"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <label
              className="form-check-label ms-1"
              htmlFor="autoRefreshOrders"
            >
              Auto
            </label>
          </div>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body p-0">
          {err && <div className="alert alert-danger m-3">{String(err)}</div>}

          {/* Desktop/Tablet Table */}
          <div className="table-responsive d-none d-sm-block">
            <table className="table align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ minWidth: 90 }}>Order</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th className="text-end">Total</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th style={{ width: 220 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} className="text-center p-4">
                      <div
                        className="spinner-border"
                        role="status"
                        aria-hidden="true"
                      ></div>
                    </td>
                  </tr>
                )}
                {!loading && orders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center p-4 text-muted">
                      No orders found
                    </td>
                  </tr>
                )}
                {orders.map((o) => (
                  <tr key={o._id}>
                    <td className="fw-semibold">#{String(o._id).slice(-6)}</td>
                    <td>
                      <div className="fw-semibold">{o.user?.name || "—"}</div>
                      <div className="small text-muted">
                        {o.user?.phone || o.user?.email || "—"}
                      </div>
                    </td>
                    <td>
                      {Array.isArray(o.items)
                        ? o.items.length
                        : o.itemsCount ?? "—"}
                    </td>
                    <td className="text-end">
                      {fmt(o.totalAmount ?? o.total ?? 0)}
                    </td>
                    <td>
                      <span className={`badge ${badgeFor(o.status)}`}>
                        {o.status || "—"}
                      </span>
                    </td>
                    <td>{formatDateTime(o.createdAt)}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <select
                          className="form-select form-select-sm"
                          value={o.status || ""}
                          onChange={(e) => updateStatus(o._id, e.target.value)}
                          disabled={!!updatingId}
                          aria-label="Set status"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => openDetails(o)}
                        >
                          Details
                        </button>
                        {updatingId === o._id && (
                          <span className="spinner-border spinner-border-sm align-self-center" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="d-sm-none">
            {loading && (
              <div className="p-4 text-center">
                <div
                  className="spinner-border"
                  role="status"
                  aria-hidden="true"
                ></div>
              </div>
            )}
            {!loading && orders.length === 0 && (
              <div className="p-4 text-center text-muted">No orders found</div>
            )}
            <div className="list-group list-group-flush">
              {orders.map((o) => (
                <div className="list-group-item" key={o._id}>
                  <div className="d-flex align-items-start justify-content-between">
                    <div>
                      <div className="fw-semibold">
                        #{String(o._id).slice(-6)}
                      </div>
                      <div className="small text-muted">
                        {o.user?.name || "—"} ·{" "}
                        {o.user?.phone || o.user?.email || "—"}
                      </div>
                    </div>
                    <span className={`badge ${badgeFor(o.status)}`}>
                      {o.status || "—"}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between mt-2">
                    <div className="small text-muted">
                      Items:{" "}
                      {Array.isArray(o.items)
                        ? o.items.length
                        : o.itemsCount ?? "—"}
                    </div>
                    <div className="fw-semibold">
                      {fmt(o.totalAmount ?? o.total ?? 0)}
                    </div>
                  </div>
                  <div className="small text-muted mt-1">
                    {formatDateTime(o.createdAt)}
                  </div>

                  <div className="d-flex gap-2 mt-2">
                    <select
                      className="form-select form-select-sm"
                      value={o.status || ""}
                      onChange={(e) => updateStatus(o._id, e.target.value)}
                      disabled={!!updatingId}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => openDetails(o)}
                    >
                      Details
                    </button>
                    {updatingId === o._id && (
                      <span className="spinner-border spinner-border-sm align-self-center" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer / Pagination */}
        <div className="card-footer bg-white d-flex flex-wrap justify-content-between align-items-center gap-2">
          <small className="text-muted">
            Showing {(orders?.length && (page - 1) * limit + 1) || 0}–
            {(page - 1) * limit + orders.length} of {total}
          </small>
          <div className="btn-group">
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={page <= 1 || loading}
              onClick={() => fetchOrders({ page: page - 1 })}
            >
              ← Prev
            </button>
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={page >= totalPages || loading}
              onClick={() => fetchOrders({ page: page + 1 })}
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* Details Modal (pure React, Bootstrap look) */}
      <div
        className={`modal fade ${active ? "show d-block" : ""}`}
        tabIndex="-1"
        style={{ background: active ? "rgba(0,0,0,.35)" : "transparent" }}
        aria-hidden={!active}
      >
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                Order {active ? `#${String(active._id).slice(-6)}` : ""}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={closeDetails}
              />
            </div>
            <div className="modal-body">
              {active && (
                <div className="row g-3">
                  <div className="col-12 col-lg-6">
                    <div className="card border-0 bg-light">
                      <div className="card-body">
                        <h6 className="mb-2">Customer</h6>
                        <div>{active.user?.name || "—"}</div>
                        <div className="text-muted small">
                          {active.user?.phone || "—"}
                        </div>
                        <div className="text-muted small">
                          {active.user?.email || ""}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-lg-6">
                    <div className="card border-0 bg-light h-100">
                      <div className="card-body">
                        <h6 className="mb-2">Summary</h6>
                        <div className="d-flex justify-content-between">
                          <span>Status</span>
                          <span className={`badge ${badgeFor(active.status)}`}>
                            {active.status}
                          </span>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span>Total</span>
                          <strong>
                            {fmt(active.totalAmount ?? active.total ?? 0)}
                          </strong>
                        </div>
                        <div className="d-flex justify-content-between small text-muted">
                          <span>Placed</span>
                          <span>{formatDateTime(active.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-12">
                    <h6 className="mb-2">Items</h6>
                    <div className="table-responsive">
                      <table className="table table-sm align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>Product</th>
                            <th>Qty</th>
                            <th className="text-end">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(active.items || []).map((it, i) => (
                            <tr key={i}>
                              <td>
                                <div className="d-flex align-items-center gap-2">
                                  {it.image && (
                                    <img
                                      src={it.image}
                                      alt={it.name}
                                      style={{
                                        width: 40,
                                        height: 40,
                                        objectFit: "cover",
                                        borderRadius: 6,
                                      }}
                                    />
                                  )}
                                  <div className="fw-semibold">{it.name}</div>
                                </div>
                              </td>
                              <td>{it.quantity ?? it.qty ?? 1}</td>
                              <td className="text-end">
                                {fmt(
                                  (it.price ?? 0) * (it.quantity ?? it.qty ?? 1)
                                )}
                              </td>
                            </tr>
                          ))}
                          {(!active.items || active.items.length === 0) && (
                            <tr>
                              <td
                                colSpan={3}
                                className="text-muted text-center"
                              >
                                No items
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label">Update Status</label>
                    <div className="d-flex gap-2">
                      <select
                        className="form-select"
                        value={active.status || ""}
                        onChange={(e) =>
                          updateStatus(active._id, e.target.value)
                        }
                        disabled={!!updatingId}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      {updatingId === active._id && (
                        <span className="spinner-border spinner-border-sm align-self-center" />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-outline-secondary"
                onClick={closeDetails}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* end details modal */}
    </div>
  );
};

export default ManageOrders;
