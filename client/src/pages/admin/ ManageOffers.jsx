// src/pages/admin/ManageOffers.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../../utils/api";

const CURRENCY = import.meta.env.VITE_CURRENCY || "AED";
const LOCALE = CURRENCY === "AED" ? "en-AE" : "en-IN";
const fmt = (n) =>
  new Intl.NumberFormat(LOCALE, { style: "currency", currency: CURRENCY }).format(Number(n) || 0);

const defaultForm = {
  title: "",
  description: "",
  code: "",
  discountType: "percent", // "percent" | "flat"
  discountValue: 10,
  minSubtotal: 0,
  active: true,
  startsAt: "",
  endsAt: "",
};

export default function ManageOffers() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchOffers = async (opts = {}) => {
    const curPage = opts.page || page;
    setLoading(true);
    setErr("");
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        page: String(curPage),
        sort: "-createdAt",
      });
      // IMPORTANT: no `/api` prefix here
      const { data } = await api.get(`/offers?${params.toString()}`);
      const items = Array.isArray(data) ? data : data.items || data.offers || [];
      const t = Array.isArray(data) ? items.length : data.total ?? data.count ?? items.length;
      setList(items);
      setTotal(t);
      if (opts.page) setPage(opts.page);
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Failed to load offers");
    } finally {
      setLoading(false);
    }
  };

  const createOffer = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = { ...form };
      const { data } = await api.post("/offers", payload); // no /api
      setList((prev) => [data, ...prev.slice(0, limit - 1)]);
      setForm(defaultForm);
      window.dispatchEvent(new CustomEvent("offers:changed"));
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || "Failed to create offer");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (o) => setEditing(o);

  const updateOffer = async (e) => {
    e.preventDefault();
    if (!editing?._id) return;
    try {
      setSaving(true);
      const payload = { ...editing };
      const { data } = await api.put(`/offers/${editing._id}`, payload); // no /api
      setList((prev) => prev.map((o) => (o._id === data._id ? data : o)));
      setEditing(null);
      window.dispatchEvent(new CustomEvent("offers:changed"));
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || "Failed to update offer");
    } finally {
      setSaving(false);
    }
  };

  const deleteOffer = async (id) => {
    if (!confirm("Delete this offer?")) return;
    try {
      await api.delete(`/offers/${id}`); // no /api
      setList((prev) => prev.filter((o) => o._id !== id));
      window.dispatchEvent(new CustomEvent("offers:changed"));
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || "Failed to delete offer");
    }
  };

  useEffect(() => {
    fetchOffers({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">Manage Offers</h2>
        <button className="btn btn-outline-secondary" onClick={() => fetchOffers({ page: 1 })}>
          Refresh
        </button>
      </div>

      {/* Create */}
      <form className="row g-3 mb-4 align-items-end" onSubmit={createOffer}>
        <div className="col-12 col-md-3">
          <label className="form-label">Title</label>
          <input
            className="form-control"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </div>
        <div className="col-12 col-md-3">
          <label className="form-label">Code</label>
          <input
            className="form-control"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            required
          />
        </div>
        <div className="col-6 col-md-2">
          <label className="form-label">Type</label>
          <select
            className="form-select"
            value={form.discountType}
            onChange={(e) => setForm({ ...form, discountType: e.target.value })}
          >
            <option value="percent">Percent %</option>
            <option value="flat">Flat ({CURRENCY})</option>
          </select>
        </div>
        <div className="col-6 col-md-2">
          <label className="form-label">Value</label>
          <input
            type="number"
            className="form-control"
            value={form.discountValue}
            onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })}
            min="0"
            required
          />
        </div>
        <div className="col-6 col-md-2">
          <label className="form-label">Min Subtotal</label>
          <input
            type="number"
            className="form-control"
            value={form.minSubtotal}
            onChange={(e) => setForm({ ...form, minSubtotal: Number(e.target.value) })}
            min="0"
          />
        </div>

        <div className="col-12">
          <label className="form-label">Description</label>
          <input
            className="form-control"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="col-6 col-md-3">
          <label className="form-label">Starts</label>
          <input
            type="datetime-local"
            className="form-control"
            value={form.startsAt}
            onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
          />
        </div>
        <div className="col-6 col-md-3">
          <label className="form-label">Ends</label>
          <input
            type="datetime-local"
            className="form-control"
            value={form.endsAt}
            onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
          />
        </div>

        <div className="col-6 col-md-2">
          <div className="form-check mt-4">
            <input
              className="form-check-input"
              type="checkbox"
              id="activeOffer"
              checked={!!form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            <label htmlFor="activeOffer" className="form-check-label">Active</label>
          </div>
        </div>

        <div className="col-12 col-md-2 ms-auto">
          <button className="btn btn-pink w-100" type="submit" disabled={saving}>
            {saving ? "Saving…" : "+ Add Offer"}
          </button>
        </div>
      </form>

      {/* List */}
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
                    <th>Title</th>
                    <th>Code</th>
                    <th>Type</th>
                    <th>Value</th>
                    <th>Status</th>
                    <th style={{ width: 180 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((o, idx) => (
                    <tr key={o._id}>
                      <td>{(page - 1) * limit + idx + 1}</td>
                      <td>{o.title}</td>
                      <td><code>{o.code}</code></td>
                      <td>{o.discountType}</td>
                      <td>{o.discountType === "percent" ? `${o.discountValue}%` : fmt(o.discountValue)}</td>
                      <td>{o.active ? <span className="badge bg-success">Active</span> : <span className="badge bg-secondary">Inactive</span>}</td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button className="btn btn-outline-secondary" onClick={() => openEdit(o)}>Edit</button>
                          <button className="btn btn-outline-danger" onClick={() => deleteOffer(o._id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!list.length && (
                    <tr>
                      <td colSpan={7} className="text-center p-4 text-muted">No offers found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card-footer bg-white d-flex justify-content-between align-items-center">
          <small className="text-muted">
            Showing {(list?.length && (page - 1) * limit + 1) || 0}–{(page - 1) * limit + list.length} of {total}
          </small>
          <div className="btn-group">
            <button className="btn btn-outline-secondary btn-sm" disabled={page <= 1} onClick={() => fetchOffers({ page: page - 1 })}>
              ← Prev
            </button>
            <button className="btn btn-outline-secondary btn-sm" disabled={page >= totalPages} onClick={() => fetchOffers({ page: page + 1 })}>
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,.35)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={updateOffer}>
                <div className="modal-header">
                  <h5 className="modal-title">Edit Offer</h5>
                  <button type="button" className="btn-close" onClick={() => setEditing(null)} />
                </div>
                <div className="modal-body">
                  <label className="form-label">Title</label>
                  <input className="form-control mb-3" value={editing.title || ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} required />
                  <label className="form-label">Description</label>
                  <input className="form-control mb-3" value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
                  <label className="form-label">Active</label>
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" checked={!!editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} />
                    <label className="form-check-label">Active</label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setEditing(null)}>Cancel</button>
                  <button type="submit" className="btn btn-pink" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
