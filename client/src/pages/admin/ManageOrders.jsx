import React, { useEffect, useState } from "react";
import api from "../../utils/api"; // default export in utils/api.js is the axios instance

const STATUS_OPTIONS = [
  "placed",
  "confirmed",
  "preparing",
  "out-for-delivery",
  "delivered",
  "cancelled",
  "refunded",
];

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/orders"); // admin only
      setOrders(data);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    const { data } = await api.patch(`/api/orders/${id}/status`, { status });
    setOrders((prev) => prev.map((o) => (o._id === id ? data : o)));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) return <div>Loading orders…</div>;

  return (
    <div>
      <h2>Manage Orders</h2>
      <table className="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Status</th>
            <th>Set status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o, idx) => (
            <tr key={o._id}>
              <td>{idx + 1}</td>
              <td>{o.user?.name || o.user?.phone || "—"}</td>
              <td>{o.totalAmount?.toFixed?.(2) ?? "—"}</td>
              <td>
                <span className="badge bg-secondary">{o.status}</span>
              </td>
              <td>
                <select
                  className="form-select"
                  value={o.status}
                  onChange={(e) => updateStatus(o._id, e.target.value)}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ManageOrders;
