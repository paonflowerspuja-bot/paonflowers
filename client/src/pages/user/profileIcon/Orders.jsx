// Orders.jsx
import React, { useEffect, useState } from "react";
import api from "../../../utils/api";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/api/orders/mine");
        if (!cancelled) setOrders(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled)
          setErr(e?.response?.data?.message || "Could not load orders");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => (cancelled = true);
  }, []);

  const total = (o) =>
    o?.total ??
    (o?.items || []).reduce((s, it) => s + (it.price || 0) * (it.qty || 0), 0) +
      (o?.shipping || 0);

  if (loading) return <div className="container py-5">Loading…</div>;
  if (err)
    return (
      <div className="container py-5">
        <div className="alert alert-danger">{err}</div>
      </div>
    );

  return (
    <div className="container py-4 py-md-5">
      <h2 className="mb-3">📦 My Orders</h2>
      {orders.length === 0 ? (
        <div className="text-muted">No orders yet.</div>
      ) : (
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Order</th>
                <th>Date</th>
                <th>Items</th>
                <th>Status</th>
                <th className="text-end">Total (AED)</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id}>
                  <td>#{String(o._id).slice(-6).toUpperCase()}</td>
                  <td>{new Date(o.createdAt).toLocaleString()}</td>
                  <td>{(o.items || []).map((i) => i.name).join(", ")}</td>
                  <td>{o.status}</td>
                  <td className="text-end">{total(o).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
