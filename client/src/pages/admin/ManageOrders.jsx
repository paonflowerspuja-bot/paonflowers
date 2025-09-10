// src/pages/admin/ManageOrders.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../../utils/api";

const CURRENCY = import.meta.env.VITE_CURRENCY || "AED";
const LOCALE = CURRENCY === "AED" ? "en-AE" : "en-IN";
const fmt = (n) =>
  new Intl.NumberFormat(LOCALE, { style: "currency", currency: CURRENCY }).format(Number(n) || 0);

export default function ManageOrders() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  const fetchOrders = async (opts = {}) => {
    const curPage = opts.page || page;
    setLoading(true);
    setErr("");
    try {
      const params = new URLSearchParams({ limit: String(limit), page: String(curPage), sort: "-createdAt" });
      const { data } = await api.get(`/orders?${params.toString()}`); // <-- NO /api prefix
      const items = Array.isArray(data) ? data : data.items || data.orders || [];
      const t = Array.isArray(data) ? items.length : data.total ?? data.count ?? items.length;
      setList(items);
      setTotal(t);
      if (opts.page) setPage(opts.page);
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/orders/${id}`, { status }); // <-- NO /api prefix
      setList((prev) => prev.map((o) => (o._id === id ? { ...o, status } : o)));
      window.dispatchEvent(new CustomEvent("orders:changed"));
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || "Failed to update status");
    }
  };

  const deleteOrder = async (id) => {
    if (!confirm("Delete this order?")) return;
    try {
      await api.delete(`/orders/${id}`); // <-- NO /api prefix
      setList((prev) => prev.filter((o) => o._id !== id));
      window.dispatchEvent(new CustomEvent("orders:changed"));
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || "Failed to delete order");
    }
  };

  useEffect(() => {
    fetchOrders({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">Manage Orders</h2>
        <button className="btn btn-outline-secondary" onClick={() => fetchOrders({ page: 1 })}>
          Refresh
        </button>
      </div>

      <div className="card shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="p-4 text-center">
              <div className="spinner-border" role="status" aria-hidden="true"></div>
            </div>
          ) : err ? (
            <div className="alert alert-danger m-3">{err}</div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th style={{ width: 220 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((o, idx) => (
                    <tr key={o._id}>
                      <td>{(page - 1) * limit + idx + 1}</td>
                      <td>{o?.customer?.name || o?.name || "—"}</td>
                      <td>{fmt(o?.total || 0)}</td>
                      <td>
                        <span
                          className={`badge ${
                            o?.status === "delivered"
                              ? "bg-success"
                              : o?.status === "processing"
                              ? "bg-warning text-dark"
                              : o?.status === "cancelled"
                              ? "bg-danger"
                              : "bg-secondary"
                          }`}
                        >
                          {o?.status || "—"}
                        </span>
                      </td>
                      <td>{o?.createdAt ? new Date(o.createdAt).toLocaleString() : "—"}</td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button className="btn btn-outline-secondary" onClick={() => updateStatus(o._id, "processing")}>
                            Processing
                          </button>
                          <button className="btn btn-outline-success" onClick={() => updateStatus(o._id, "delivered")}>
                            Delivered
                          </button>
                          <button className="btn btn-outline-danger" onClick={() => deleteOrder(o._id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!list.length && (
                    <tr>
                      <td colSpan={6} className="text-center p-4 text-muted">
                        No orders found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card-footer bg-white d-flex justify-content-between align-items-center">
          <small className="text-muted">
            Showing {(list?.length && (page - 1) * limit + 1) || 0}–
            {(page - 1) * limit + list.length} of {total}
          </small>
          <div className="btn-group">
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={page <= 1}
              onClick={() => fetchOrders({ page: page - 1 })}
            >
              ← Prev
            </button>
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={page >= totalPages}
              onClick={() => fetchOrders({ page: page + 1 })}
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
