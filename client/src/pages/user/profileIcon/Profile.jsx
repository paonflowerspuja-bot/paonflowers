// Profile.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext"; // adjust path if needed
import api, { getMeAPI, updateProfileAPI } from "../../../utils/api";

export default function Profile() {
  const { user, login } = useAuth();

  const [me, setMe] = useState(user || null);
  const [loadingMe, setLoadingMe] = useState(!user);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    location: "",
    dob: "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersErr, setOrdersErr] = useState("");

  // Load fresh user
  useEffect(() => {
    let cancelled = false;
    async function loadMe() {
      try {
        setLoadingMe(true);
        const { data } = await getMeAPI();
        if (!cancelled) {
          setMe(data?.user || null);
          login(data?.user || null);
        }
      } catch {
        if (!cancelled) setMe(null);
      } finally {
        if (!cancelled) setLoadingMe(false);
      }
    }
    if (!user) loadMe();
    else setLoadingMe(false);
    return () => (cancelled = true);
  }, [user, login]);

  // Init form when me changes
  useEffect(() => {
    if (me) {
      setForm({
        name: me.name || "",
        email: me.email || "",
        location: me.location || "",
        dob: me.dob ? me.dob.substring(0, 10) : "",
      });
    }
  }, [me]);

  // Load my orders
  useEffect(() => {
    let cancelled = false;
    async function loadOrders() {
      try {
        setLoadingOrders(true);
        const { data } = await api.get("/api/orders/mine");
        if (!cancelled) setOrders(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled)
          setOrdersErr(e?.response?.data?.message || "Could not load orders");
      } finally {
        if (!cancelled) setLoadingOrders(false);
      }
    }
    loadOrders();
    return () => (cancelled = true);
  }, []);

  const updateField = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSave = async () => {
    try {
      setSaving(true);
      setErr("");
      await updateProfileAPI(form);
      const { data } = await getMeAPI();
      login(data?.user);
      setMe(data?.user);
      setEdit(false);
    } catch (e) {
      setErr(e?.response?.data?.message || "Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  // helpers
  const shortId = (id) => (id ? `#${String(id).slice(-6).toUpperCase()}` : "");
  const orderTotal = (o) =>
    o?.total ??
    (o?.items || []).reduce(
      (sum, it) => sum + (it.price || 0) * (it.qty || 0),
      0
    ) + (o?.shipping || 0);

  const printInvoice = (order) => {
    // open a print window with a minimal invoice
    const w = window.open("", "PRINT", "height=700,width=900");
    const currency = order?.currency || "AED";
    const total = orderTotal(order).toFixed(2);

    const itemsRows = (order?.items || [])
      .map(
        (it) => `
          <tr>
            <td>${it.name || "-"}</td>
            <td style="text-align:center">${it.qty || 1}</td>
            <td style="text-align:right">${(it.price || 0).toFixed(2)}</td>
            <td style="text-align:right">${(
              (it.price || 0) * (it.qty || 0)
            ).toFixed(2)}</td>
          </tr>`
      )
      .join("");

    const html = `
      <html>
        <head>
          <title>Invoice ${shortId(order?._id)}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            body { font-family: system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial; padding: 24px; }
            h1,h2,h3 { margin: 0 0 8px 0; }
            .brand { color: #a6003c; }
            .muted { color: #666; }
            .card { border: 1px solid #eee; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 8px; border-bottom: 1px solid #f0f0f0; }
            th { text-align: left; background: #fafafa; }
            .right { text-align: right; }
            .totals td { border: 0; }
            @media print { .no-print { display: none !important; } }
          </style>
        </head>
        <body>
          <div class="card" style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <h2 class="brand">Paon Flowers</h2>
              <div class="muted">Invoice ${shortId(order?._id)}</div>
            </div>
            <div style="text-align:right">
              <div><strong>Date:</strong> ${new Date(
                order?.createdAt || Date.now()
              ).toLocaleString()}</div>
              <div><strong>Status:</strong> ${order?.status || "-"}</div>
            </div>
          </div>

          <div class="card">
            <h3>Bill To</h3>
            <div>${order?.shippingAddress?.name || me?.name || "-"}</div>
            <div>${order?.shippingAddress?.phone || me?.phone || "-"}</div>
            <div>${order?.shippingAddress?.address || me?.location || "-"}</div>
          </div>

          <div class="card">
            <table>
              <thead>
                <tr>
                  <th>Item</th><th class="right">Qty</th><th class="right">Price (${currency})</th><th class="right">Amount (${currency})</th>
                </tr>
              </thead>
              <tbody>${itemsRows}</tbody>
              <tfoot>
                <tr class="totals">
                  <td></td><td></td>
                  <td class="right"><strong>Shipping</strong></td>
                  <td class="right">${(order?.shipping || 0).toFixed(2)}</td>
                </tr>
                <tr class="totals">
                  <td></td><td></td>
                  <td class="right"><strong>Total</strong></td>
                  <td class="right"><strong>${total}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div class="no-print">
            <button onclick="window.print()" style="padding:10px 16px;border-radius:8px;background:#e91e63;color:#fff;border:0">Print / Save PDF</button>
          </div>
        </body>
      </html>
    `;
    w.document.write(html);
    w.document.close();
    w.focus();
  };

  const OrdersTable = useMemo(
    () => (
      <div id="orders" className="card shadow-sm border-0 rounded-4 p-3">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <h5 className="m-0">My Orders</h5>
        </div>

        {loadingOrders ? (
          <div className="text-muted">Loading orders…</div>
        ) : ordersErr ? (
          <div className="alert alert-danger py-2">{ordersErr}</div>
        ) : orders.length === 0 ? (
          <div className="text-muted">No orders yet.</div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="d-none d-lg-block">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Status</th>
                    <th className="text-end">Total (AED)</th>
                    <th className="text-end">Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o._id}>
                      <td>{shortId(o._id)}</td>
                      <td>{new Date(o.createdAt).toLocaleString()}</td>
                      <td>{(o.items || []).map((i) => i.name).join(", ")}</td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            background:
                              o.status === "delivered"
                                ? "#e6f8ec"
                                : o.status === "shipped"
                                ? "#e7f1ff"
                                : o.status === "cancelled"
                                ? "#ffe7ea"
                                : "#f7f7f7",
                            color:
                              o.status === "delivered"
                                ? "#177a3e"
                                : o.status === "shipped"
                                ? "#1f5fb8"
                                : o.status === "cancelled"
                                ? "#a6003c"
                                : "#333",
                          }}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td className="text-end">{orderTotal(o).toFixed(2)}</td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => printInvoice(o)}
                        >
                          Invoice
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="d-lg-none vstack gap-3">
              {orders.map((o) => (
                <div key={o._id} className="border rounded-4 p-3">
                  <div className="d-flex justify-content-between">
                    <div>
                      <div className="fw-semibold">{shortId(o._id)}</div>
                      <div className="text-muted small">
                        {new Date(o.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <span
                      className="badge"
                      style={{ background: "#faf0f4", color: "#a6003c" }}
                    >
                      {o.status}
                    </span>
                  </div>
                  <div className="small mt-2">
                    {(o.items || []).map((i, idx) => (
                      <span key={idx} className="me-2">
                        {i.name} × {i.qty}
                      </span>
                    ))}
                  </div>
                  <div className="d-flex justify-content-between align-items-center mt-2">
                    <div className="fw-semibold">
                      AED {orderTotal(o).toFixed(2)}
                    </div>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => printInvoice(o)}
                    >
                      Invoice
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    ),
    [orders, loadingOrders, ordersErr]
  );

  return (
    <div className="container py-4 py-md-5">
      <div className="row g-4">
        {/* Left: Profile */}
        <div className="col-12 col-lg-4">
          <div className="card shadow-sm border-0 rounded-4 p-3 p-md-4">
            <h5 className="mb-3">My Profile</h5>

            {loadingMe ? (
              <div className="text-muted">Loading profile…</div>
            ) : !me ? (
              <div className="alert alert-warning">
                Please login to view your profile.
              </div>
            ) : (
              <>
                <div className="d-flex gap-3 align-items-center mb-3">
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: "50%",
                      background: "#ffe3ef",
                      color: "#a6003c",
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 700,
                      fontSize: 22,
                    }}
                  >
                    {(me.name || me.phone || "U")?.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <div className="fw-semibold">{me.name || "—"}</div>
                    <div className="text-muted small">{me.phone || "—"}</div>
                  </div>
                </div>

                {!edit ? (
                  <>
                    <div className="mb-2">
                      <strong>Email:</strong> {me.email || "—"}
                    </div>
                    <div className="mb-2">
                      <strong>Location:</strong> {me.location || "—"}
                    </div>
                    <div className="mb-2">
                      <strong>DOB:</strong>{" "}
                      {me.dob ? me.dob.substring(0, 10) : "—"}
                    </div>
                    <button
                      className="btn btn-primary mt-2"
                      onClick={() => setEdit(true)}
                    >
                      Edit Profile
                    </button>
                  </>
                ) : (
                  <>
                    <div className="vstack gap-2">
                      <div>
                        <label className="form-label small">Full Name</label>
                        <input
                          className="form-control"
                          name="name"
                          value={form.name}
                          onChange={updateField}
                          required
                        />
                      </div>
                      <div>
                        <label className="form-label small">
                          Email (optional)
                        </label>
                        <input
                          type="email"
                          className="form-control"
                          name="email"
                          value={form.email}
                          onChange={updateField}
                        />
                      </div>
                      <div>
                        <label className="form-label small">
                          Location / Emirate
                        </label>
                        <input
                          className="form-control"
                          name="location"
                          value={form.location}
                          onChange={updateField}
                        />
                      </div>
                      <div>
                        <label className="form-label small">
                          Date of birth
                        </label>
                        <input
                          type="date"
                          className="form-control"
                          name="dob"
                          value={form.dob}
                          onChange={updateField}
                        />
                      </div>
                    </div>

                    {err && (
                      <div className="alert alert-danger py-2 mt-2">{err}</div>
                    )}

                    <div className="d-flex gap-2 mt-3">
                      <button
                        className="btn btn-primary"
                        disabled={saving}
                        onClick={onSave}
                      >
                        {saving ? "Saving..." : "Save"}
                      </button>
                      <button
                        className="btn btn-outline-secondary"
                        onClick={() => {
                          setEdit(false);
                          setForm({
                            name: me.name || "",
                            email: me.email || "",
                            location: me.location || "",
                            dob: me.dob ? me.dob.substring(0, 10) : "",
                          });
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right: Orders & Billing */}
        <div className="col-12 col-lg-8">
          {OrdersTable}

          <div className="card shadow-sm border-0 rounded-4 p-3 mt-4">
            <h5 className="m-0">Billing & Invoices</h5>
            <div className="text-muted small mt-2">
              Open any order’s <strong>Invoice</strong> to print or save as PDF.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
