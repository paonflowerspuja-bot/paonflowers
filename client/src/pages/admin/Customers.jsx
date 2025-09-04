// src/pages/admin/Customers.jsx
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

// Broadcast so other pages (dashboard, etc.) can refresh instantly
const emitCustomersChanged = () =>
  window.dispatchEvent(new CustomEvent("customers:changed"));

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "blocked", label: "Blocked" },
];

const Customers = () => {
  // list state
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // filters / pagination
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // details drawer
  const [selected, setSelected] = useState(null); // customer object
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);

  // csv export working state
  const [exporting, setExporting] = useState(false);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / limit)),
    [total, limit]
  );

  const fetchCustomers = async (opts = {}) => {
    const curPage = opts.page || page;
    setLoading(true);
    setErr("");
    try {
      const params = new URLSearchParams();
      params.set("limit", String(limit));
      params.set("page", String(curPage));
      params.set("sort", "-createdAt");
      if (q) params.set("q", q);
      if (status) params.set("status", status); // implement on server: "active"/"blocked"

      const { data } = await api.get(`/api/customers?${params.toString()}`);
      const items = Array.isArray(data)
        ? data
        : data.items || data.customers || [];
      const t = Array.isArray(data)
        ? items.length
        : data.total ?? data.count ?? items.length;

      setList(items);
      setTotal(t);
      if (opts.page) setPage(opts.page);
    } catch (e) {
      setErr(
        e?.response?.data?.message || e?.message || "Failed to load customers"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => fetchCustomers({ page: 1 }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // re-fetch on status change
  useEffect(() => {
    fetchCustomers({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const openDetails = async (c) => {
    setSelected(c);
    setOrders([]);
    setOrdersLoading(true);
    try {
      const params = new URLSearchParams({
        customerId: c._id,
        limit: "10",
        sort: "-createdAt",
      });
      const { data } = await api.get(`/api/orders?${params.toString()}`);
      const arr = Array.isArray(data) ? data : data.items || data.orders || [];
      setOrders(arr);
    } catch (e) {
      // show empty but don't crash
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const closeDetails = () => {
    setSelected(null);
    setOrders([]);
  };

  const toggleBlock = async (c) => {
    if (!c?._id) return;
    const next = !c.isBlocked;

    try {
      // Preferred: PATCH /api/customers/:id { isBlocked }
      const { data } = await api.patch(`/api/customers/${c._id}`, {
        isBlocked: next,
      });
      applyLocalUpdate(data || { ...c, isBlocked: next });
      emitCustomersChanged();
    } catch {
      // Fallback: PATCH /api/customers/:id/status
      try {
        const { data } = await api.patch(`/api/customers/${c._id}/status`, {
          isBlocked: next,
        });
        applyLocalUpdate(data || { ...c, isBlocked: next });
        emitCustomersChanged();
      } catch (e2) {
        alert(
          e2?.response?.data?.message ||
            e2?.message ||
            "Failed to update status"
        );
      }
    }
  };

  const deleteCustomer = async (id) => {
    if (!window.confirm("Delete this customer? This cannot be undone.")) return;
    try {
      await api.delete(`/api/customers/${id}`);
      setList((prev) => prev.filter((x) => x._id !== id));
      if (selected?._id === id) closeDetails();
      emitCustomersChanged();
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || "Failed to delete");
    }
  };

  const saveNote = async () => {
    if (!selected?._id) return;
    setNoteSaving(true);
    try {
      const { data } = await api.patch(`/api/customers/${selected._id}`, {
        note: selected.note || "",
      });
      applyLocalUpdate(data || selected);
      emitCustomersChanged();
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || "Failed to save note");
    } finally {
      setNoteSaving(false);
    }
  };

  const applyLocalUpdate = (updated) => {
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

  // compute quick stats for row (uses precomputed fields if present; falls back to 0/—)
  const ordersCount = (c) => c?.ordersCount ?? c?.stats?.ordersCount ?? 0;
  const lifetimeValue = (c) => c?.lifetimeValue ?? c?.stats?.lifetimeValue ?? 0;

  const statusChip = (c) =>
    c?.isBlocked ? (
      <span className="badge bg-danger">Blocked</span>
    ) : (
      <span className="badge bg-success">Active</span>
    );

  // CSV export
  const exportCSV = () => {
    try {
      setExporting(true);
      const cols = [
        "Name",
        "Email",
        "Phone",
        "Created At",
        "Status",
        "Orders",
        "Lifetime Value",
      ];
      const rows = list.map((c) => [
        JSON.stringify(c?.name || ""), // keep commas safe
        JSON.stringify(c?.email || ""),
        JSON.stringify(c?.phone || ""),
        JSON.stringify(
          c?.createdAt ? new Date(c.createdAt).toLocaleString() : ""
        ),
        JSON.stringify(c?.isBlocked ? "Blocked" : "Active"),
        JSON.stringify(String(ordersCount(c))),
        JSON.stringify(String(lifetimeValue(c))),
      ]);
      const csv = [cols.join(","), ...rows.map((r) => r.join(","))].join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `customers_${Date.now()}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <h2 className="mb-0">Customers</h2>
        <div className="d-flex flex-wrap gap-2">
          <div className="input-group" style={{ maxWidth: 360 }}>
            <span className="input-group-text">
              <i className="bi bi-search" />
            </span>
            <input
              className="form-control"
              placeholder="Search name / email / phone"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && fetchCustomers({ page: 1 })
              }
            />
            <button
              className="btn btn-outline-secondary"
              onClick={() => fetchCustomers({ page: 1 })}
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
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <button
            className="btn btn-outline-secondary"
            onClick={() => fetchCustomers({ page: 1 })}
          >
            Refresh
          </button>
          <button
            className="btn btn-outline-success"
            onClick={exportCSV}
            disabled={exporting || loading || list.length === 0}
            title="Export current page"
          >
            {exporting ? "Exporting…" : "Export CSV"}
          </button>
        </div>
      </div>

      {/* Table (desktop/tablet) */}
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
                    <th style={{ minWidth: 220 }}>Customer</th>
                    <th>Contact</th>
                    <th className="text-end">Orders</th>
                    <th className="text-end">Lifetime Value</th>
                    <th>Since</th>
                    <th>Status</th>
                    <th style={{ width: 210 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((c, idx) => {
                    const avatar =
                      c?.avatar?.url ||
                      c?.avatar ||
                      "/assets/avatar-placeholder.png";
                    return (
                      <tr key={c._id}>
                        <td>{(page - 1) * limit + idx + 1}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <img
                              src={avatar}
                              alt={c.name}
                              style={{
                                width: 36,
                                height: 36,
                                objectFit: "cover",
                                borderRadius: "50%",
                                marginRight: 10,
                              }}
                              loading="lazy"
                            />
                            <div>
                              <div className="fw-semibold">{c.name || "—"}</div>
                              <div className="small text-muted">{c._id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="small">
                          <div>{c.email || "—"}</div>
                          <div className="text-muted">{c.phone || "—"}</div>
                        </td>
                        <td className="text-end">{ordersCount(c)}</td>
                        <td className="text-end">{fmt(lifetimeValue(c))}</td>
                        <td className="small">
                          {c.createdAt
                            ? new Date(c.createdAt).toLocaleDateString()
                            : "—"}
                        </td>
                        <td>{statusChip(c)}</td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-outline-secondary"
                              onClick={() => openDetails(c)}
                            >
                              View
                            </button>
                            <button
                              className={`btn ${
                                c.isBlocked
                                  ? "btn-outline-success"
                                  : "btn-outline-warning"
                              }`}
                              onClick={() => toggleBlock(c)}
                            >
                              {c.isBlocked ? "Unblock" : "Block"}
                            </button>
                            <button
                              className="btn btn-outline-danger"
                              onClick={() => deleteCustomer(c._id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!list.length && (
                    <tr>
                      <td colSpan={8} className="text-center p-4 text-muted">
                        No customers found
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
              onClick={() => fetchCustomers({ page: page - 1 })}
            >
              ← Prev
            </button>
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={page >= totalPages || loading}
              onClick={() => fetchCustomers({ page: page + 1 })}
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* Mobile list cards */}
      <div className="d-sm-none">
        {loading ? (
          <div className="py-4 text-center">
            <div className="spinner-border" role="status" aria-hidden="true" />
          </div>
        ) : err ? (
          <div className="alert alert-danger">{err}</div>
        ) : list.length === 0 ? (
          <div className="py-4 text-center text-muted">No customers found</div>
        ) : (
          <div className="list-group list-group-flush">
            {list.map((c) => {
              const avatar =
                c?.avatar?.url || c?.avatar || "/assets/avatar-placeholder.png";
              return (
                <div className="list-group-item" key={c._id}>
                  <div className="d-flex gap-3">
                    <img
                      src={avatar}
                      alt={c.name}
                      style={{
                        width: 44,
                        height: 44,
                        objectFit: "cover",
                        borderRadius: "50%",
                      }}
                    />
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between">
                        <div className="fw-semibold">{c.name || "—"}</div>
                        {statusChip(c)}
                      </div>
                      <div className="small text-muted">{c.email || "—"}</div>
                      <div className="small text-muted">{c.phone || "—"}</div>
                      <div className="d-flex gap-2 mt-2">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => openDetails(c)}
                        >
                          View
                        </button>
                        <button
                          className={`btn btn-sm ${
                            c.isBlocked
                              ? "btn-outline-success"
                              : "btn-outline-warning"
                          }`}
                          onClick={() => toggleBlock(c)}
                        >
                          {c.isBlocked ? "Unblock" : "Block"}
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => deleteCustomer(c._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Details Drawer / Modal */}
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
              <h5 className="offcanvas-title">Customer Details</h5>
              <button
                type="button"
                className="btn-close"
                onClick={closeDetails}
              ></button>
            </div>
            <div className="offcanvas-body">
              {selected && (
                <>
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <img
                      src={
                        selected?.avatar?.url ||
                        selected?.avatar ||
                        "/assets/avatar-placeholder.png"
                      }
                      alt={selected?.name}
                      style={{
                        width: 64,
                        height: 64,
                        objectFit: "cover",
                        borderRadius: "50%",
                      }}
                    />
                    <div>
                      <div className="h5 mb-1">{selected?.name || "—"}</div>
                      <div className="small text-muted">{selected?._id}</div>
                    </div>
                    <div className="ms-auto">{statusChip(selected)}</div>
                  </div>

                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <div className="card shadow-sm h-100">
                        <div className="card-body">
                          <h6 className="mb-3">Contact</h6>
                          <div className="small mb-1">
                            <i className="bi bi-envelope me-2" />
                            {selected?.email || "—"}
                          </div>
                          <div className="small mb-1">
                            <i className="bi bi-telephone me-2" />
                            {selected?.phone || "—"}
                          </div>
                          <div className="small">
                            <i className="bi bi-calendar me-2" />
                            Joined:{" "}
                            {selected?.createdAt
                              ? new Date(selected.createdAt).toLocaleString()
                              : "—"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <div className="card shadow-sm h-100">
                        <div className="card-body">
                          <h6 className="mb-3">Quick Stats</h6>
                          <div className="d-flex justify-content-between small mb-2">
                            <span>Total Orders</span>
                            <strong>{ordersCount(selected)}</strong>
                          </div>
                          <div className="d-flex justify-content-between small mb-2">
                            <span>Lifetime Value</span>
                            <strong>{fmt(lifetimeValue(selected))}</strong>
                          </div>
                          <div className="d-flex justify-content-between small">
                            <span>Last Order</span>
                            <strong>
                              {selected?.lastOrderDate
                                ? new Date(
                                    selected.lastOrderDate
                                  ).toLocaleString()
                                : orders?.[0]?.createdAt
                                ? new Date(orders[0].createdAt).toLocaleString()
                                : "—"}
                            </strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Admin Note */}
                    <div className="col-12">
                      <div className="card shadow-sm">
                        <div className="card-body">
                          <div className="d-flex align-items-center justify-content-between mb-2">
                            <h6 className="mb-0">Admin Notes</h6>
                            <div className="d-flex gap-2">
                              <button
                                className={`btn btn-sm ${
                                  selected.isBlocked
                                    ? "btn-success"
                                    : "btn-warning"
                                }`}
                                onClick={() => toggleBlock(selected)}
                              >
                                {selected.isBlocked ? "Unblock" : "Block"}
                              </button>
                              <button
                                className="btn btn-sm btn-pink"
                                onClick={saveNote}
                                disabled={noteSaving}
                              >
                                {noteSaving ? "Saving…" : "Save Note"}
                              </button>
                            </div>
                          </div>
                          <textarea
                            className="form-control"
                            rows={3}
                            value={selected.note || ""}
                            onChange={(e) =>
                              setSelected((s) => ({
                                ...s,
                                note: e.target.value,
                              }))
                            }
                            placeholder="Add private notes visible only to admins…"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Recent Orders */}
                    <div className="col-12">
                      <div className="card shadow-sm">
                        <div className="card-header bg-white d-flex align-items-center justify-content-between">
                          <h6 className="mb-0">Recent Orders</h6>
                          <Link
                            to="/admin/orders"
                            className="small text-decoration-none"
                            onClick={closeDetails}
                          >
                            View all
                          </Link>
                        </div>
                        <div className="card-body p-0">
                          {ordersLoading ? (
                            <div className="p-4 text-center">
                              <div
                                className="spinner-border"
                                role="status"
                                aria-hidden="true"
                              ></div>
                            </div>
                          ) : orders.length === 0 ? (
                            <div className="p-4 text-center text-muted">
                              No recent orders
                            </div>
                          ) : (
                            <div className="table-responsive">
                              <table className="table table-sm align-middle mb-0">
                                <thead className="table-light">
                                  <tr>
                                    <th>Order</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {orders.map((o) => (
                                    <tr key={o._id}>
                                      <td className="fw-semibold">
                                        #{String(o._id).slice(-6)}
                                      </td>
                                      <td>
                                        {fmt(o.total || o.totalAmount || 0)}
                                      </td>
                                      <td>
                                        <span className="badge bg-secondary">
                                          {o.status || "—"}
                                        </span>
                                      </td>
                                      <td>
                                        {o.createdAt
                                          ? new Date(
                                              o.createdAt
                                            ).toLocaleString()
                                          : "—"}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Customers;
