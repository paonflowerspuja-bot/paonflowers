// src/pages/admin/DeliveryStatus.jsx
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

// Broadcast so dashboard, orders, and user-facing pages can refresh
const emitDeliveryChanged = () => {
  window.dispatchEvent(new CustomEvent("delivery:changed"));
  window.dispatchEvent(new CustomEvent("orders:changed"));
};

const STATUS_OPTIONS = [
  "placed",
  "confirmed",
  "preparing",
  "out-for-delivery",
  "delivered",
  "cancelled",
  "refunded",
];

const DeliveryStatus = () => {
  // list state
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // filters / pagination
  const [q, setQ] = useState("");
  const [status, setStatus] = useState(""); // "", or any from STATUS_OPTIONS
  const [dateFilter, setDateFilter] = useState("today"); // today | tomorrow | all
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // drivers
  const [drivers, setDrivers] = useState([]);

  // details drawer
  const [selected, setSelected] = useState(null); // delivery/order object
  const [saving, setSaving] = useState(false);

  // polling
  const pollRef = useRef(null);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / limit)),
    [total, limit]
  );

  const computeDateRange = () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    if (dateFilter === "tomorrow") {
      const s = new Date(start);
      s.setDate(s.getDate() + 1);
      const e = new Date(end);
      e.setDate(e.getDate() + 1);
      return { start: s, end: e };
    }
    if (dateFilter === "all") return {};
    return { start, end };
  };

  const qsFromDateRange = (params) => {
    const { start, end } = computeDateRange();
    if (start) params.set("start", start.toISOString());
    if (end) params.set("end", end.toISOString());
  };

  const fetchDrivers = async () => {
    try {
      // Preferred
      const { data } = await api.get("/api/drivers");
      setDrivers(Array.isArray(data) ? data : data.items || data.drivers || []);
    } catch {
      try {
        // Fallback
        const { data } = await api.get("/api/users?role=driver");
        setDrivers(Array.isArray(data) ? data : data.items || data.users || []);
      } catch {
        setDrivers([]); // keep empty, still functional
      }
    }
  };

  const fetchDeliveries = async (opts = {}) => {
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
      if (dateFilter !== "all") qsFromDateRange(params);

      // Preferred endpoint
      let res;
      try {
        res = await api.get(`/api/deliveries?${params.toString()}`);
      } catch {
        // Fallback to orders with delivery
        const extra = params.toString();
        res = await api.get(`/api/orders?fulfillment=delivery&${extra}`);
      }
      const data = res.data;
      const items = Array.isArray(data)
        ? data
        : data.items || data.deliveries || data.orders || [];
      const t = Array.isArray(data)
        ? items.length
        : data.total ?? data.count ?? items.length;

      setList(items);
      setTotal(t);
      if (opts.page) setPage(opts.page);
    } catch (e) {
      setErr(
        e?.response?.data?.message || e?.message || "Failed to load deliveries"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries({ page: 1 });
    fetchDrivers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => fetchDeliveries({ page: 1 }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // Refetch on filter changes
  useEffect(() => {
    fetchDeliveries({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, dateFilter]);

  // Auto poll every 30s
  useEffect(() => {
    pollRef.current = setInterval(fetchDeliveries, 30000);
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchDeliveries();
    };
    const onFocus = () => fetchDeliveries();

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);

    // React immediately on global updates
    const onChanged = () => fetchDeliveries();
    window.addEventListener("orders:changed", onChanged);
    window.addEventListener("delivery:changed", onChanged);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("orders:changed", onChanged);
      window.removeEventListener("delivery:changed", onChanged);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openDetails = (o) => setSelected(o);
  const closeDetails = () => setSelected(null);

  const patchDelivery = async (id, payload) => {
    // Try preferred delivery endpoint
    try {
      const { data } = await api.patch(`/api/deliveries/${id}`, payload);
      return data;
    } catch {
      // Fallback to orders endpoints
      try {
        const { data } = await api.patch(`/api/orders/${id}/delivery`, payload);
        return data;
      } catch {
        if (payload.status) {
          const { data } = await api.patch(`/api/orders/${id}/status`, {
            status: payload.status,
          });
          return data;
        }
        throw new Error("No compatible endpoint for this update");
      }
    }
  };

  const updateLocal = (updated) => {
    setList((prev) =>
      prev.map((x) =>
        x._id === (updated?._id || updated?.id) ? { ...x, ...updated } : x
      )
    );
    if (
      selected &&
      (updated?._id === selected._id || updated?.id === selected._id)
    ) {
      setSelected((s) => ({ ...s, ...updated }));
    }
  };

  const assignDriver = async (id, driverId) => {
    try {
      setSaving(true);
      const data = await patchDelivery(id, { driverId });
      updateLocal(
        data || { ...(list.find((l) => l._id === id) || {}), driverId }
      );
      emitDeliveryChanged();
    } catch (e) {
      alert(
        e?.response?.data?.message || e?.message || "Failed to assign driver"
      );
    } finally {
      setSaving(false);
    }
  };

  const updateETA = async (id, eta) => {
    try {
      setSaving(true);
      const data = await patchDelivery(id, { eta });
      updateLocal(data || { ...(list.find((l) => l._id === id) || {}), eta });
      emitDeliveryChanged();
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || "Failed to update ETA");
    } finally {
      setSaving(false);
    }
  };

  const progressStatus = async (id, next) => {
    try {
      setSaving(true);
      const data = await patchDelivery(id, { status: next });
      updateLocal(
        data || { ...(list.find((l) => l._id === id) || {}), status: next }
      );
      emitDeliveryChanged();
    } catch (e) {
      alert(
        e?.response?.data?.message || e?.message || "Failed to update status"
      );
    } finally {
      setSaving(false);
    }
  };

  const exportCSV = () => {
    const cols = [
      "OrderId",
      "CustomerName",
      "Phone",
      "Address",
      "Status",
      "ETA",
      "Driver",
      "Total",
      "CreatedAt",
    ];
    const rows = list.map((o) => [
      JSON.stringify(String(o._id || "")),
      JSON.stringify(o?.customer?.name || o?.name || ""),
      JSON.stringify(o?.customer?.phone || o?.phone || ""),
      JSON.stringify(
        o?.shippingAddress?.line1 || o?.address || o?.shippingAddress || ""
      ),
      JSON.stringify(o?.status || ""),
      JSON.stringify(o?.eta || ""),
      JSON.stringify(o?.driver?.name || o?.driverName || ""),
      JSON.stringify(String(o?.total || o?.totalAmount || 0)),
      JSON.stringify(
        o?.createdAt ? new Date(o.createdAt).toLocaleString() : ""
      ),
    ]);
    const csv = [cols.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deliveries_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusChip = (s) => {
    if (s === "delivered")
      return <span className="badge bg-success">Delivered</span>;
    if (s === "out-for-delivery")
      return <span className="badge bg-primary">Out for delivery</span>;
    if (s === "preparing" || s === "confirmed")
      return <span className="badge bg-warning text-dark">Preparing</span>;
    if (s === "cancelled")
      return <span className="badge bg-danger">Cancelled</span>;
    if (s === "refunded")
      return <span className="badge bg-dark">Refunded</span>;
    return <span className="badge bg-secondary">{s || "—"}</span>;
  };

  const nextStatusOptions = (s) => {
    switch (s) {
      case "placed":
      case "confirmed":
        return ["preparing", "out-for-delivery", "cancelled"];
      case "preparing":
        return ["out-for-delivery", "cancelled"];
      case "out-for-delivery":
        return ["delivered", "cancelled"];
      default:
        return [];
    }
  };

  const driverName = (o) =>
    o?.driver?.name ||
    drivers.find((d) => d._id === o?.driverId)?.name ||
    o?.driverName ||
    "—";

  const addressText = (o) =>
    o?.shippingAddress?.formatted ||
    [
      o?.shippingAddress?.line1,
      o?.shippingAddress?.line2,
      o?.shippingAddress?.city,
    ]
      .filter(Boolean)
      .join(", ") ||
    o?.address ||
    "—";

  const nowHHMM = () => {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  };

  return (
    <div>
      {/* Header / Filters */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <h2 className="mb-0">Delivery Status</h2>
        <div className="d-flex flex-wrap gap-2">
          <div className="input-group" style={{ maxWidth: 360 }}>
            <span className="input-group-text">
              <i className="bi bi-search" />
            </span>
            <input
              className="form-control"
              placeholder="Search order id / name / phone / address"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && fetchDeliveries({ page: 1 })
              }
            />
            <button
              className="btn btn-outline-secondary"
              onClick={() => fetchDeliveries({ page: 1 })}
            >
              Search
            </button>
          </div>

          <select
            className="form-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ minWidth: 160 }}
          >
            <option value="">All Status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            className="form-select"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{ minWidth: 140 }}
          >
            <option value="today">Today</option>
            <option value="tomorrow">Tomorrow</option>
            <option value="all">All Dates</option>
          </select>

          <button
            className="btn btn-outline-secondary"
            onClick={() => fetchDeliveries({ page: 1 })}
          >
            Refresh
          </button>
          <button
            className="btn btn-outline-success"
            onClick={exportCSV}
            disabled={loading || !list.length}
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Desktop / tablet table */}
      <div className="card shadow-sm d-none d-sm-block">
        <div className="card-body p-0">
          {loading ? (
            <div className="p-4 text-center">
              <div
                className="spinner-border"
                role="status"
                aria-hidden="true"
              ></div>
            </div>
          ) : err ? (
            <div className="alert alert-danger m-3">{err}</div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Address</th>
                    <th className="text-end">Total</th>
                    <th>ETA</th>
                    <th>Driver</th>
                    <th>Status</th>
                    <th style={{ width: 220 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((o, idx) => (
                    <tr key={o._id}>
                      <td>{(page - 1) * limit + idx + 1}</td>
                      <td className="fw-semibold">
                        #{String(o._id || "").slice(-6)}
                      </td>
                      <td>
                        <div className="small">
                          <div className="fw-semibold">
                            {o?.customer?.name || o?.name || "—"}
                          </div>
                          <a
                            href={`tel:${o?.customer?.phone || o?.phone || ""}`}
                            className="text-decoration-none"
                          >
                            {o?.customer?.phone || o?.phone || "—"}
                          </a>
                        </div>
                      </td>
                      <td className="small">{addressText(o)}</td>
                      <td className="text-end">
                        {fmt(o?.total || o?.totalAmount || 0)}
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <input
                            type="time"
                            className="form-control form-control-sm"
                            style={{ width: 110 }}
                            value={o?.eta || ""}
                            onChange={(e) => updateETA(o._id, e.target.value)}
                          />
                          {!o?.eta && (
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => updateETA(o._id, nowHHMM())}
                            >
                              Now + …
                            </button>
                          )}
                        </div>
                      </td>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={o?.driverId || o?.driver?._id || ""}
                          onChange={(e) => assignDriver(o._id, e.target.value)}
                          style={{ minWidth: 140 }}
                        >
                          <option value="">Unassigned</option>
                          {drivers.map((d) => (
                            <option key={d._id} value={d._id}>
                              {d.name || d.fullName || d.email || d._id}
                            </option>
                          ))}
                        </select>
                        <div className="small text-muted">{driverName(o)}</div>
                      </td>
                      <td>{statusChip(o?.status)}</td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-secondary"
                            onClick={() => openDetails(o)}
                          >
                            View
                          </button>
                          {nextStatusOptions(o?.status).map((ns) => (
                            <button
                              key={ns}
                              className={`btn ${
                                ns === "delivered"
                                  ? "btn-outline-success"
                                  : ns === "out-for-delivery"
                                  ? "btn-outline-primary"
                                  : ns === "cancelled"
                                  ? "btn-outline-danger"
                                  : "btn-outline-warning"
                              }`}
                              onClick={() => progressStatus(o._id, ns)}
                              disabled={saving}
                              title={`Mark as ${ns}`}
                            >
                              {ns}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!list.length && (
                    <tr>
                      <td colSpan={9} className="text-center p-4 text-muted">
                        No deliveries found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="card-footer bg-white d-flex justify-content-between align-items-center">
          <small className="text-muted">
            Showing {(list?.length && (page - 1) * limit + 1) || 0}–
            {(page - 1) * limit + list.length} of {total}
          </small>
          <div className="btn-group">
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={page <= 1 || loading}
              onClick={() => fetchDeliveries({ page: page - 1 })}
            >
              ← Prev
            </button>
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={page >= totalPages || loading}
              onClick={() => fetchDeliveries({ page: page + 1 })}
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="d-sm-none">
        {loading ? (
          <div className="py-4 text-center">
            <div className="spinner-border" role="status" aria-hidden="true" />
          </div>
        ) : err ? (
          <div className="alert alert-danger">{err}</div>
        ) : list.length === 0 ? (
          <div className="py-4 text-center text-muted">No deliveries found</div>
        ) : (
          <div className="list-group list-group-flush">
            {list.map((o) => (
              <div className="list-group-item" key={o._id}>
                <div className="d-flex justify-content-between align-items-start">
                  <div className="fw-semibold">
                    #{String(o._id || "").slice(-6)}
                  </div>
                  {statusChip(o?.status)}
                </div>
                <div className="small mt-1">
                  {o?.customer?.name || o?.name || "—"}
                </div>
                <a
                  href={`tel:${o?.customer?.phone || o?.phone || ""}`}
                  className="small"
                >
                  {o?.customer?.phone || o?.phone || "—"}
                </a>
                <div className="small text-muted mt-1">{addressText(o)}</div>
                <div className="d-flex align-items-center justify-content-between mt-2">
                  <div className="small">
                    {fmt(o?.total || o?.totalAmount || 0)}
                  </div>
                  <input
                    type="time"
                    className="form-control form-control-sm"
                    style={{ width: 110 }}
                    value={o?.eta || ""}
                    onChange={(e) => updateETA(o._id, e.target.value)}
                  />
                </div>
                <div className="d-flex gap-2 mt-2">
                  <select
                    className="form-select form-select-sm"
                    value={o?.driverId || o?.driver?._id || ""}
                    onChange={(e) => assignDriver(o._id, e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {drivers.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name || d.fullName || d.email || d._id}
                      </option>
                    ))}
                  </select>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => openDetails(o)}
                  >
                    View
                  </button>
                </div>
                <div className="d-flex flex-wrap gap-2 mt-2">
                  {nextStatusOptions(o?.status).map((ns) => (
                    <button
                      key={ns}
                      className={`btn btn-sm ${
                        ns === "delivered"
                          ? "btn-outline-success"
                          : ns === "out-for-delivery"
                          ? "btn-outline-primary"
                          : ns === "cancelled"
                          ? "btn-outline-danger"
                          : "btn-outline-warning"
                      }`}
                      onClick={() => progressStatus(o._id, ns)}
                      disabled={saving}
                    >
                      {ns}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details Drawer / Offcanvas */}
      <div
        className={`offcanvas offcanvas-end ${selected ? "show" : ""}`}
        tabIndex="-1"
        style={{
          visibility: selected ? "visible" : "hidden",
          background: selected ? "rgba(0,0,0,.35)" : "transparent",
        }}
        aria-hidden={!selected}
      >
        <div className="offcanvas-dialog offcanvas-lg">
          <div className="offcanvas-content">
            <div className="offcanvas-header">
              <h5 className="offcanvas-title">Delivery Details</h5>
              <button
                type="button"
                className="btn-close"
                onClick={closeDetails}
              />
            </div>
            <div className="offcanvas-body">
              {selected && (
                <div className="row g-3">
                  {/* Left: meta */}
                  <div className="col-12 col-md-6">
                    <div className="card shadow-sm h-100">
                      <div className="card-body">
                        <div className="d-flex justify-content-between">
                          <div className="fw-semibold">
                            Order #{String(selected._id).slice(-6)}
                          </div>
                          {statusChip(selected.status)}
                        </div>

                        <div className="mt-3 small">
                          <div className="mb-1">
                            <i className="bi bi-person me-2" />
                            {selected?.customer?.name || selected?.name || "—"}
                          </div>
                          <div className="mb-1">
                            <i className="bi bi-telephone me-2" />
                            <a
                              href={`tel:${
                                selected?.customer?.phone ||
                                selected?.phone ||
                                ""
                              }`}
                            >
                              {selected?.customer?.phone ||
                                selected?.phone ||
                                "—"}
                            </a>
                          </div>
                          <div className="mb-1">
                            <i className="bi bi-geo-alt me-2" />
                            {addressText(selected)}
                          </div>
                          <div className="mb-1">
                            <i className="bi bi-cash-stack me-2" />
                            {fmt(selected?.total || selected?.totalAmount || 0)}
                          </div>
                          <div>
                            <i className="bi bi-calendar me-2" />
                            {selected?.createdAt
                              ? new Date(selected.createdAt).toLocaleString()
                              : "—"}
                          </div>
                        </div>

                        <hr />

                        <div className="row g-2">
                          <div className="col-6">
                            <label className="form-label small">ETA</label>
                            <input
                              type="time"
                              className="form-control"
                              value={selected?.eta || ""}
                              onChange={(e) =>
                                updateETA(selected._id, e.target.value)
                              }
                            />
                          </div>
                          <div className="col-6">
                            <label className="form-label small">Driver</label>
                            <select
                              className="form-select"
                              value={
                                selected?.driverId ||
                                selected?.driver?._id ||
                                ""
                              }
                              onChange={(e) =>
                                assignDriver(selected._id, e.target.value)
                              }
                            >
                              <option value="">Unassigned</option>
                              {drivers.map((d) => (
                                <option key={d._id} value={d._id}>
                                  {d.name || d.fullName || d.email || d._id}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="d-flex flex-wrap gap-2 mt-3">
                          {nextStatusOptions(selected?.status).map((ns) => (
                            <button
                              key={ns}
                              className={`btn ${
                                ns === "delivered"
                                  ? "btn-success"
                                  : ns === "out-for-delivery"
                                  ? "btn-primary"
                                  : ns === "cancelled"
                                  ? "btn-danger"
                                  : "btn-warning"
                              } btn-sm`}
                              onClick={() => progressStatus(selected._id, ns)}
                              disabled={saving}
                            >
                              Mark as {ns}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: items & notes */}
                  <div className="col-12 col-md-6">
                    <div className="card shadow-sm h-100">
                      <div className="card-body">
                        <h6 className="mb-3">Items</h6>
                        {Array.isArray(selected?.items) &&
                        selected.items.length > 0 ? (
                          <div className="table-responsive">
                            <table className="table table-sm align-middle">
                              <thead className="table-light">
                                <tr>
                                  <th>Product</th>
                                  <th className="text-end">Qty</th>
                                  <th className="text-end">Price</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selected.items.map((it, i) => (
                                  <tr key={i}>
                                    <td className="small">
                                      {it?.name || it?.product?.name || "—"}
                                    </td>
                                    <td className="text-end">
                                      {it?.quantity ?? 1}
                                    </td>
                                    <td className="text-end">
                                      {fmt(it?.price || 0)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-muted small">No items data</div>
                        )}

                        <hr />

                        <h6 className="mb-2">Delivery Notes</h6>
                        <textarea
                          className="form-control"
                          rows={3}
                          placeholder="Leave instructions…"
                          value={selected?.note || ""}
                          onChange={(e) =>
                            setSelected((s) => ({ ...s, note: e.target.value }))
                          }
                          onBlur={async (e) => {
                            // Save on blur
                            try {
                              setSaving(true);
                              const data = await patchDelivery(selected._id, {
                                note: e.target.value,
                              });
                              updateLocal(
                                data || { ...selected, note: e.target.value }
                              );
                              emitDeliveryChanged();
                            } catch {
                              // leave note in UI; user can try again
                            } finally {
                              setSaving(false);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="offcanvas-footer p-3 d-flex justify-content-between">
              <div className="small text-muted">
                Need to edit the order?{" "}
                <Link to="/admin/orders" onClick={closeDetails}>
                  Go to Orders
                </Link>
              </div>
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

      {/* Error at top-level */}
      {!!err && <div className="alert alert-danger mt-3 d-sm-none">{err}</div>}
    </div>
  );
};

export default DeliveryStatus;
