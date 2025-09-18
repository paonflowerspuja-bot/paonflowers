// src/pages/admin/ManageOrders.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../../utils/api";

const CURRENCY = import.meta.env.VITE_CURRENCY || "AED";
const LOCALE = CURRENCY === "AED" ? "en-AE" : "en-IN";
const fmt = (n) =>
  new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: CURRENCY,
  }).format(Number(n) || 0);

// Helpers
const emptyItem = () => ({ name: "", price: "", qty: 1, productId: "" });

// Pretty-print Zod-like errors returned as a JSON string in `message`
function explainServerError(e) {
  const raw = e?.response?.data?.message ?? e?.message ?? "Failed";
  if (typeof raw !== "string") return String(raw || "Failed");
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .map((x) => {
          const at = Array.isArray(x?.path) ? x.path.join(".") : "";
          return `${at ? at + ": " : ""}${x?.message || "Invalid"}`;
        })
        .join("; ");
    }
  } catch {}
  return raw;
}

export default function ManageOrders() {
  // list state
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // paging
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / limit)),
    [total, limit]
  );

  // drawer (create order)
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    // Customer (root + nested will be sent)
    name: "",
    phone: "", // REQUIRED
    email: "",
    // Address
    addr1: "",
    addr2: "",
    city: "Dubai",
    emirate: "Dubai",
    country: "UAE",
    postalCode: "",
    // Optional delivery time text
    deliveryWhen: "",
    // Items
    items: [emptyItem()],
    // Meta
    status: "pending",
    notes: "",
    // Discount (order-level)
    discountType: "percent", // "percent" | "amount"
    discount: "",
    // Total override
    totalOverride: "",
    paid: false,
  });

  // ---- totals & discount ----
  const computedSubtotal = useMemo(
    () =>
      (form.items || []).reduce((acc, it) => {
        const p = Number(it.price) || 0;
        const q = Number(it.qty) || 0;
        return acc + p * q;
      }, 0),
    [form.items]
  );

  const computedDiscountValue = useMemo(() => {
    const d = Number(form.discount) || 0;
    if (!d) return 0;
    if (form.discountType === "percent") {
      const pct = Math.max(0, Math.min(100, d));
      return (pct / 100) * computedSubtotal;
    }
    return Math.min(computedSubtotal, Math.max(0, d));
  }, [form.discount, form.discountType, computedSubtotal]);

  const computedAfterDiscount = useMemo(
    () => Math.max(0, computedSubtotal - computedDiscountValue),
    [computedSubtotal, computedDiscountValue]
  );

  const computedTotal = useMemo(() => {
    const override =
      form.totalOverride !== "" && !Number.isNaN(Number(form.totalOverride))
        ? Number(form.totalOverride)
        : null;
    return Math.max(0, override ?? computedAfterDiscount);
  }, [form.totalOverride, computedAfterDiscount]);

  // ---- data ops ----
  const fetchOrders = async (opts = {}) => {
    const curPage = opts.page || page;
    setLoading(true);
    setErr("");
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        page: String(curPage),
        sort: "-createdAt",
      });
      const { data } = await api.get(`/api/orders?${params.toString()}`);
      const items = Array.isArray(data)
        ? data
        : data.items || data.orders || [];
      const t = Array.isArray(data)
        ? items.length
        : data.total ?? data.count ?? items.length;
      setList(items);
      setTotal(t);
      if (opts.page) setPage(opts.page);
    } catch (e) {
      console.error("GET /api/orders failed:", e?.response?.data || e);
      setErr(
        e?.response?.data?.message || e?.message || "Failed to load orders"
      );
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/api/orders/${id}`, { status });
      setList((prev) => prev.map((o) => (o._id === id ? { ...o, status } : o)));
      window.dispatchEvent(new CustomEvent("orders:changed"));
    } catch (e) {
      console.error("PATCH /api/orders/:id failed:", e?.response?.data || e);
      alert(explainServerError(e));
    }
  };

  const deleteOrder = async (id) => {
    if (!confirm("Delete this order?")) return;
    try {
      await api.delete(`/api/orders/${id}`);
      setList((prev) => prev.filter((o) => o._id !== id));
      window.dispatchEvent(new CustomEvent("orders:changed"));
    } catch (e) {
      console.error("DELETE /api/orders/:id failed:", e?.response?.data || e);
      alert(explainServerError(e));
    }
  };

  useEffect(() => {
    fetchOrders({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- form helpers ----
  const openCreate = () => {
    setForm({
      name: "",
      phone: "",
      email: "",
      addr1: "",
      addr2: "",
      city: "Dubai",
      emirate: "Dubai",
      country: "UAE",
      postalCode: "",
      deliveryWhen: "",
      items: [emptyItem()],
      status: "pending",
      notes: "",
      discountType: "percent",
      discount: "",
      totalOverride: "",
      paid: false,
    });
    setShowForm(true);
  };
  const closeCreate = () => {
    if (saving) return;
    setShowForm(false);
  };

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setItemField = (idx, key, val) =>
    setForm((f) => {
      const next = [...f.items];
      next[idx] = { ...next[idx], [key]: val };
      return { ...f, items: next };
    });
  const addItem = () =>
    setForm((f) => ({ ...f, items: [...(f.items || []), emptyItem()] }));
  const removeItem = (idx) =>
    setForm((f) => {
      const next = [...(f.items || [])];
      next.splice(idx, 1);
      return { ...f, items: next.length ? next : [emptyItem()] };
    });

  const validateForm = () => {
    // SERVER REQUIRES PHONE
    if (!form.phone?.trim()) {
      alert("Phone is required (server validation).");
      return false;
    }
    // At least a name or email helps for records
    if (!form.name?.trim() && !form.email?.trim()) {
      alert("Enter customer name or email.");
      return false;
    }
    // Some item
    const hasAny = (form.items || []).some(
      (it) => (it.name || it.productId) && Number(it.qty) > 0
    );
    if (!hasAny) {
      alert("Add at least one item with a name/product and quantity.");
      return false;
    }
    // Address basics
    if (!form.addr1?.trim() || !form.city?.trim()) {
      alert("Delivery address needs Address Line 1 and City.");
      return false;
    }
    return true;
  };

  const saveOrder = async () => {
    if (!validateForm()) return;

    const dAmt = Number(form.discount) || 0;
    const discountNote =
      dAmt > 0
        ? ` [Discount: ${
            form.discountType === "percent" ? `${dAmt}%` : fmt(dAmt)
          }]`
        : "";

    // Standardized address object
    const addressStd = {
      line1: form.addr1,
      line2: form.addr2 || undefined,
      city: form.city,
      state: form.emirate || undefined,
      country: form.country || "UAE",
      postalCode: form.postalCode || undefined,
      when: form.deliveryWhen || undefined,
      phone: form.phone || undefined, // sometimes schemas want phone on address
      name: form.name || undefined,
    };

    const items = (form.items || [])
      .filter((it) => (it.name || it.productId) && Number(it.qty) > 0)
      .map((it) => ({
        productId: it.productId || undefined,
        name: it.name || undefined,
        price: Number(it.price) || 0,
        quantity: Number(it.qty) || 1,
      }));

    // Send customer info BOTH nested and at root
    const payload = {
      // root-level (for schemas expecting these at top)
      name: form.name || undefined,
      phone: form.phone || undefined,
      email: form.email || undefined,

      // nested (for schemas expecting object)
      customer: {
        name: form.name || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
      },

      items,
      total: Number(computedTotal),
      status: form.status,
      notes: (form.notes || "") + discountNote,
      paid: !!form.paid,

      // Address keys to satisfy common schemas
      shippingAddress: addressStd,
      deliveryAddress: addressStd,
      billingAddress: addressStd,
      address: {
        address: addressStd.line1,
        address2: addressStd.line2,
        city: addressStd.city,
        state: addressStd.state,
        country: addressStd.country,
        zip: addressStd.postalCode,
        when: addressStd.when,
        phone: form.phone || undefined,
        name: form.name || undefined,
      },
    };

    setSaving(true);
    try {
      const { data } = await api.post("/api/orders", payload);
      const created = data?.order || data;
      setList((prev) => [created, ...prev]);
      setTotal((t) => t + 1);
      window.dispatchEvent(new CustomEvent("orders:changed"));
      closeCreate();
    } catch (e) {
      console.error("POST /api/orders failed:", e?.response?.data || e);
      alert(explainServerError(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">Manage Orders</h2>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-secondary"
            onClick={() => fetchOrders({ page: 1 })}
          >
            Refresh
          </button>
          <button className="btn btn-pink" onClick={openCreate}>
            + New Order
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card shadow-sm">
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
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th style={{ width: 260 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((o, idx) => (
                    <tr key={o._id}>
                      <td>{(page - 1) * limit + idx + 1}</td>
                      <td>
                        <div className="d-flex flex-column">
                          <strong>{o?.customer?.name || o?.name || "—"}</strong>
                          <small className="text-muted">
                            {(o?.customer?.email || o?.email || "").trim()}{" "}
                            {o?.customer?.phone || o?.phone ? (
                              <>• {o?.customer?.phone || o?.phone}</>
                            ) : null}
                          </small>
                        </div>
                      </td>
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
                      <td>
                        {o?.createdAt
                          ? new Date(o.createdAt).toLocaleString()
                          : "—"}
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-secondary"
                            onClick={() => updateStatus(o._id, "processing")}
                          >
                            Processing
                          </button>
                          <button
                            className="btn btn-outline-success"
                            onClick={() => updateStatus(o._id, "delivered")}
                          >
                            Delivered
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => deleteOrder(o._id)}
                          >
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

        {/* Pagination */}
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

      {/* Drawer: New Order */}
      {showForm && (
        <>
          <div
            className="position-fixed top-0 start-0 w-100 h-100"
            style={{ background: "rgba(0,0,0,.35)", zIndex: 1050 }}
            onClick={closeCreate}
          />
          <div
            className="position-fixed top-0 end-0 bg-white shadow-lg"
            style={{
              width: "min(92vw, 820px)",
              height: "100vh",
              zIndex: 1055,
              overflowY: "auto",
              borderTopLeftRadius: "0.5rem",
              borderBottomLeftRadius: "0.5rem",
            }}
          >
            <div className="p-3 border-bottom d-flex align-items-center justify-content-between">
              <h5 className="mb-0">Create Order (Manual)</h5>
              <button
                type="button"
                className="btn-close"
                onClick={closeCreate}
              />
            </div>

            <div className="p-3">
              {/* Customer */}
              <div className="mb-4">
                <h6 className="mb-2">Customer</h6>
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">Customer Name</label>
                    <input
                      className="form-control"
                      value={form.name}
                      onChange={(e) => setField("name", e.target.value)}
                      placeholder="Full name"
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">
                      Phone <span className="text-danger">*</span>
                    </label>
                    <input
                      className="form-control"
                      value={form.phone}
                      onChange={(e) => setField("phone", e.target.value)}
                      placeholder="+9715..."
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={form.email}
                      onChange={(e) => setField("email", e.target.value)}
                      placeholder="customer@email.com"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="mb-4">
                <h6 className="mb-2">Delivery Address</h6>
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label">Address Line 1</label>
                    <input
                      className="form-control"
                      value={form.addr1}
                      onChange={(e) => setField("addr1", e.target.value)}
                      placeholder="Street / building / flat"
                      required
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">
                      Address Line 2 (optional)
                    </label>
                    <input
                      className="form-control"
                      value={form.addr2}
                      onChange={(e) => setField("addr2", e.target.value)}
                      placeholder="Landmark / area"
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">City</label>
                    <input
                      className="form-control"
                      value={form.city}
                      onChange={(e) => setField("city", e.target.value)}
                      placeholder="Dubai"
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Emirate / State</label>
                    <input
                      className="form-control"
                      value={form.emirate}
                      onChange={(e) => setField("emirate", e.target.value)}
                      placeholder="Dubai"
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Country</label>
                    <input
                      className="form-control"
                      value={form.country}
                      onChange={(e) => setField("country", e.target.value)}
                      placeholder="UAE"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Postal Code</label>
                    <input
                      className="form-control"
                      value={form.postalCode}
                      onChange={(e) => setField("postalCode", e.target.value)}
                      placeholder="(optional)"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">
                      Delivery When (optional)
                    </label>
                    <input
                      className="form-control"
                      value={form.deliveryWhen}
                      onChange={(e) => setField("deliveryWhen", e.target.value)}
                      placeholder="Tomorrow 5–7pm, ASAP, etc."
                    />
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-2">Items</h6>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={addItem}
                  >
                    + Add Item
                  </button>
                </div>

                <div className="table-responsive">
                  <table className="table table-sm align-middle">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: 140 }}>Product ID (opt.)</th>
                        <th>Name</th>
                        <th style={{ width: 120 }} className="text-end">
                          Unit Price
                        </th>
                        <th style={{ width: 100 }} className="text-end">
                          Qty
                        </th>
                        <th style={{ width: 120 }} className="text-end">
                          Line Total
                        </th>
                        <th style={{ width: 64 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.items.map((it, idx) => {
                        const unit = Number(it.price) || 0;
                        const qty = Number(it.qty) || 0;
                        const line = unit * qty;
                        return (
                          <tr key={idx}>
                            <td>
                              <input
                                className="form-control form-control-sm"
                                placeholder="optional"
                                value={it.productId}
                                onChange={(e) =>
                                  setItemField(idx, "productId", e.target.value)
                                }
                              />
                            </td>
                            <td>
                              <input
                                className="form-control form-control-sm"
                                placeholder="Bouquet / name"
                                value={it.name}
                                onChange={(e) =>
                                  setItemField(idx, "name", e.target.value)
                                }
                              />
                            </td>
                            <td className="text-end">
                              <input
                                type="number"
                                className="form-control form-control-sm text-end"
                                min="0"
                                step="0.01"
                                value={it.price}
                                onChange={(e) =>
                                  setItemField(idx, "price", e.target.value)
                                }
                              />
                            </td>
                            <td className="text-end">
                              <input
                                type="number"
                                className="form-control form-control-sm text-end"
                                min="1"
                                step="1"
                                value={it.qty}
                                onChange={(e) =>
                                  setItemField(idx, "qty", e.target.value)
                                }
                              />
                            </td>
                            <td className="text-end">{fmt(line)}</td>
                            <td className="text-end">
                              <button
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => removeItem(idx)}
                                title="Remove"
                              >
                                ×
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {!form.items.length && (
                        <tr>
                          <td colSpan={6} className="text-center text-muted">
                            No items — add one.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={4} className="text-end">
                          Subtotal
                        </td>
                        <td className="text-end fw-semibold">
                          {fmt(computedSubtotal)}
                        </td>
                        <td></td>
                      </tr>
                      <tr>
                        <td colSpan={3}></td>
                        <td className="text-end">
                          <div className="d-flex gap-2 align-items-center justify-content-end">
                            <label className="form-label mb-0 small">
                              Discount
                            </label>
                            <select
                              className="form-select form-select-sm"
                              style={{ width: 120 }}
                              value={form.discountType}
                              onChange={(e) =>
                                setField("discountType", e.target.value)
                              }
                            >
                              <option value="percent">% Percent</option>
                              <option value="amount">Flat amount</option>
                            </select>
                          </div>
                        </td>
                        <td className="text-end">
                          <div className="input-group input-group-sm">
                            <span className="input-group-text">
                              {form.discountType === "percent" ? "%" : CURRENCY}
                            </span>
                            <input
                              type="number"
                              className="form-control text-end"
                              min="0"
                              step="0.01"
                              placeholder="0"
                              value={form.discount}
                              onChange={(e) =>
                                setField("discount", e.target.value)
                              }
                            />
                          </div>
                          {computedDiscountValue > 0 && (
                            <div className="small text-muted mt-1">
                              − {fmt(computedDiscountValue)}
                            </div>
                          )}
                        </td>
                        <td></td>
                      </tr>
                      <tr>
                        <td colSpan={4} className="text-end">
                          Total (after discount)
                        </td>
                        <td className="text-end fw-semibold">
                          {fmt(computedAfterDiscount)}
                        </td>
                        <td></td>
                      </tr>
                      <tr>
                        <td colSpan={4} className="text-end">
                          Total (override optional)
                        </td>
                        <td className="text-end">
                          <div className="input-group input-group-sm">
                            <span className="input-group-text">{CURRENCY}</span>
                            <input
                              type="number"
                              className="form-control text-end"
                              min="0"
                              step="0.01"
                              placeholder={String(computedAfterDiscount)}
                              value={form.totalOverride}
                              onChange={(e) =>
                                setField("totalOverride", e.target.value)
                              }
                            />
                          </div>
                          {form.totalOverride !== "" && (
                            <div className="small text-muted mt-1">
                              Final total: <strong>{fmt(computedTotal)}</strong>
                            </div>
                          )}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Meta */}
              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={form.status}
                    onChange={(e) => setField("status", e.target.value)}
                  >
                    <option value="pending">pending</option>
                    <option value="processing">processing</option>
                    <option value="delivered">delivered</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </div>
                <div className="col-md-4 d-flex align-items-end">
                  <div className="form-check">
                    <input
                      id="paid"
                      className="form-check-input"
                      type="checkbox"
                      checked={!!form.paid}
                      onChange={(e) => setField("paid", e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="paid">
                      Mark as paid
                    </label>
                  </div>
                </div>
                <div className="col-12">
                  <label className="form-label">Notes</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="Delivery time, greetings, etc."
                    value={form.notes}
                    onChange={(e) => setField("notes", e.target.value)}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="d-flex justify-content-end gap-2">
                <button
                  className="btn btn-outline-secondary"
                  onClick={closeCreate}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-pink"
                  onClick={saveOrder}
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Create Order"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
