// src/pages/admin/ManageOffers.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../../utils/api";

const CURRENCY = import.meta.env.VITE_CURRENCY || "AED";
const LOCALE = CURRENCY === "AED" ? "en-AE" : "en-IN";
const fmt = (n) =>
  new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: CURRENCY,
  }).format(Number(n) || 0);

// Broadcast so dashboard / user Offers page can react instantly
const emitOffersChanged = () =>
  window.dispatchEvent(new CustomEvent("offers:changed"));

const defaultForm = {
  title: "",
  description: "",
  discountType: "percent", // "percent" | "flat"
  discountValue: "",
  startDate: "",
  endDate: "",
  couponCode: "",
  target: "", // e.g., category slug or "*"
  isActive: true,
  isFeatured: false,
};

const ManageOffers = () => {
  // list & ui
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // filters / pagination
  const [q, setQ] = useState("");
  const [status, setStatus] = useState(""); // "", "active", "expired", "upcoming"
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // create
  const [form, setForm] = useState(defaultForm);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);

  // edit
  const [editing, setEditing] = useState(null); // offer object
  const [editFile, setEditFile] = useState(null);
  const [editPreview, setEditPreview] = useState("");
  const [updating, setUpdating] = useState(false);

  // image preview
  useEffect(() => {
    if (!file) return setPreview("");
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!editFile) return setEditPreview("");
    const url = URL.createObjectURL(editFile);
    setEditPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [editFile]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / limit)),
    [total, limit]
  );

  const fetchOffers = async (opts = {}) => {
    const curPage = opts.page || page;
    setLoading(true);
    setErr("");
    try {
      const params = new URLSearchParams();
      params.set("limit", String(limit));
      params.set("page", String(curPage));
      params.set("sort", "-createdAt");
      if (q) params.set("q", q);
      if (status) params.set("status", status); // implement server-side (optional)

      const { data } = await api.get(`/api/offers?${params.toString()}`);
      // support array or {items,total}
      const items = Array.isArray(data)
        ? data
        : data.items || data.offers || [];
      const t = Array.isArray(data)
        ? items.length
        : data.total ?? data.count ?? items.length;

      setList(items);
      setTotal(t);
      if (opts.page) setPage(opts.page);
    } catch (e) {
      setErr(
        e?.response?.data?.message || e?.message || "Failed to load offers"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => fetchOffers({ page: 1 }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // status filter
  useEffect(() => {
    fetchOffers({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const createOffer = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ""));
      if (file) fd.append("file", file);
      const { data } = await api.post("/api/offers", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // optimistic
      setList((prev) => [data, ...prev.slice(0, limit - 1)]);
      setForm(defaultForm);
      setFile(null);
      setPreview("");
      emitOffersChanged();
    } catch (e) {
      alert(
        e?.response?.data?.message || e?.message || "Failed to create offer"
      );
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (offer) => {
    setEditing(offer);
    setEditFile(null);
    setEditPreview("");
  };

  const updateOffer = async (e) => {
    e.preventDefault();
    if (!editing?._id) return;
    try {
      setUpdating(true);
      if (editFile) {
        const fd = new FormData();
        fd.append("title", editing.title || "");
        fd.append("description", editing.description || "");
        fd.append("discountType", editing.discountType || "percent");
        fd.append("discountValue", editing.discountValue ?? 0);
        fd.append("startDate", editing.startDate || "");
        fd.append("endDate", editing.endDate || "");
        fd.append("couponCode", editing.couponCode || "");
        fd.append("target", editing.target || "");
        fd.append("isActive", editing.isActive ? "true" : "false");
        fd.append("isFeatured", editing.isFeatured ? "true" : "false");
        fd.append("file", editFile);

        const { data } = await api.put(`/api/offers/${editing._id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        applyLocalUpdate(data);
      } else {
        const payload = {
          title: editing.title,
          description: editing.description,
          discountType: editing.discountType,
          discountValue: Number(editing.discountValue) || 0,
          startDate: editing.startDate,
          endDate: editing.endDate,
          couponCode: editing.couponCode,
          target: editing.target,
          isActive: !!editing.isActive,
          isFeatured: !!editing.isFeatured,
        };
        const { data } = await api.put(`/api/offers/${editing._id}`, payload);
        applyLocalUpdate(data);
      }
      setEditing(null);
      emitOffersChanged();
    } catch (e) {
      alert(
        e?.response?.data?.message || e?.message || "Failed to update offer"
      );
    } finally {
      setUpdating(false);
    }
  };

  const deleteOffer = async (id) => {
    if (!window.confirm("Delete this offer?")) return;
    try {
      await api.delete(`/api/offers/${id}`);
      setList((prev) => prev.filter((o) => o._id !== id));
      emitOffersChanged();
    } catch (e) {
      alert(
        e?.response?.data?.message || e?.message || "Failed to delete offer"
      );
    }
  };

  const applyLocalUpdate = (updated) => {
    setList((prev) =>
      prev.map((o) =>
        o._id === (updated?._id || updated?.id) ? { ...o, ...updated } : o
      )
    );
  };

  const discountBadge = (offer) => {
    if (!offer) return "";
    if (offer.discountType === "flat") return `${fmt(offer.discountValue)} OFF`;
    return `${Number(offer.discountValue || 0)}% OFF`;
  };

  const isExpired = (o) =>
    o?.endDate ? new Date(o.endDate) < new Date() : false;
  const isUpcoming = (o) =>
    o?.startDate ? new Date(o.startDate) > new Date() : false;

  const statusChip = (o) => {
    if (!o?.isActive) return <span className="badge bg-secondary">Hidden</span>;
    if (isExpired(o)) return <span className="badge bg-dark">Expired</span>;
    if (isUpcoming(o))
      return <span className="badge bg-info text-dark">Upcoming</span>;
    return <span className="badge bg-success">Active</span>;
  };

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <h2 className="mb-0">Manage Offers</h2>

        <div className="d-flex flex-wrap gap-2">
          <div className="input-group" style={{ maxWidth: 340 }}>
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input
              className="form-control"
              placeholder="Search title / code…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button
              className="btn btn-outline-secondary"
              onClick={() => fetchOffers({ page: 1 })}
            >
              Search
            </button>
          </div>

          <select
            className="form-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ minWidth: 180 }}
          >
            <option value="">All</option>
            <option value="active">Active (now)</option>
            <option value="upcoming">Upcoming</option>
            <option value="expired">Expired</option>
            <option value="hidden">Hidden</option>
          </select>

          <button
            className="btn btn-outline-secondary"
            onClick={() => fetchOffers({ page: 1 })}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Create */}
      <form className="row g-3 mb-4 align-items-end" onSubmit={createOffer}>
        <div className="col-12 col-md-4">
          <label className="form-label">Title</label>
          <input
            className="form-control"
            placeholder="e.g., Summer Sale"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
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
            <option value="percent">% off</option>
            <option value="flat">Flat off</option>
          </select>
        </div>

        <div className="col-6 col-md-2">
          <label className="form-label">Value</label>
          <input
            type="number"
            className="form-control"
            placeholder={form.discountType === "flat" ? "50" : "15"}
            min="0"
            value={form.discountValue}
            onChange={(e) =>
              setForm({ ...form, discountValue: e.target.value })
            }
            required
          />
        </div>

        <div className="col-12 col-md-4">
          <label className="form-label">Description</label>
          <input
            className="form-control"
            placeholder="Short blurb"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="col-6 col-md-2">
          <label className="form-label">Start</label>
          <input
            type="date"
            className="form-control"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          />
        </div>
        <div className="col-6 col-md-2">
          <label className="form-label">End</label>
          <input
            type="date"
            className="form-control"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          />
        </div>

        <div className="col-6 col-md-2">
          <label className="form-label">Code (optional)</label>
          <input
            className="form-control"
            placeholder="e.g., PAON15"
            value={form.couponCode}
            onChange={(e) => setForm({ ...form, couponCode: e.target.value })}
          />
        </div>

        <div className="col-6 col-md-2">
          <label className="form-label">Target</label>
          <input
            className="form-control"
            placeholder="* or category slug"
            value={form.target}
            onChange={(e) => setForm({ ...form, target: e.target.value })}
          />
        </div>

        <div className="col-12 col-md-3">
          <label className="form-label">Banner Image</label>
          <input
            type="file"
            className="form-control"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          {preview && (
            <img
              src={preview}
              alt="preview"
              className="mt-2 rounded"
              style={{ width: 110, height: 70, objectFit: "cover" }}
            />
          )}
        </div>

        <div className="col-6 col-md-2">
          <div className="form-check mt-4">
            <input
              className="form-check-input"
              type="checkbox"
              id="activeCreate"
              checked={!!form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            <label htmlFor="activeCreate" className="form-check-label">
              Active
            </label>
          </div>
        </div>

        <div className="col-6 col-md-2">
          <div className="form-check mt-4">
            <input
              className="form-check-input"
              type="checkbox"
              id="featuredCreate"
              checked={!!form.isFeatured}
              onChange={(e) =>
                setForm({ ...form, isFeatured: e.target.checked })
              }
            />
            <label htmlFor="featuredCreate" className="form-check-label">
              Featured
            </label>
          </div>
        </div>

        <div className="col-12 col-md-2 ms-auto">
          <button
            className="btn btn-pink w-100"
            type="submit"
            disabled={saving}
          >
            {saving ? "Saving…" : "+ Add Offer"}
          </button>
        </div>
      </form>

      {/* List */}
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
            <>
              {/* Desktop / tablet table */}
              <div className="table-responsive d-none d-sm-block">
                <table className="table align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th style={{ minWidth: 120 }}>Banner</th>
                      <th>Title</th>
                      <th>Discount</th>
                      <th>Target</th>
                      <th>Window</th>
                      <th>Status</th>
                      <th style={{ width: 180 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((o, idx) => {
                      const img =
                        o.banner?.url ||
                        o.banner ||
                        o.image ||
                        "/assets/placeholder.jpg";
                      return (
                        <tr key={o._id}>
                          <td>{(page - 1) * limit + idx + 1}</td>
                          <td>
                            <img
                              src={img}
                              alt={o.title}
                              style={{
                                width: 100,
                                height: 60,
                                objectFit: "cover",
                                borderRadius: 6,
                              }}
                              loading="lazy"
                            />
                          </td>
                          <td className="fw-semibold">{o.title}</td>
                          <td>
                            <span className="badge bg-primary">
                              {discountBadge(o)}
                            </span>
                            {o.couponCode && (
                              <span className="badge bg-dark ms-2">
                                {o.couponCode}
                              </span>
                            )}
                          </td>
                          <td className="small">{o.target || "*"}</td>
                          <td className="small">
                            {o.startDate
                              ? new Date(o.startDate).toLocaleDateString()
                              : "—"}{" "}
                            →{" "}
                            {o.endDate
                              ? new Date(o.endDate).toLocaleDateString()
                              : "—"}
                          </td>
                          <td>
                            {!!o.isFeatured && (
                              <span className="badge bg-danger me-2">
                                Featured
                              </span>
                            )}
                            {statusChip(o)}
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-outline-secondary"
                                onClick={() => openEdit(o)}
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-outline-danger"
                                onClick={() => deleteOffer(o._id)}
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
                          No offers found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="d-sm-none">
                {list.length === 0 ? (
                  <div className="p-4 text-center text-muted">
                    No offers found
                  </div>
                ) : (
                  <div className="list-group list-group-flush">
                    {list.map((o) => {
                      const img =
                        o.banner?.url ||
                        o.banner ||
                        o.image ||
                        "/assets/placeholder.jpg";
                      return (
                        <div className="list-group-item" key={o._id}>
                          <div className="d-flex gap-2">
                            <img
                              src={img}
                              alt={o.title}
                              style={{
                                width: 96,
                                height: 56,
                                objectFit: "cover",
                                borderRadius: 6,
                              }}
                            />
                            <div className="flex-grow-1">
                              <div className="d-flex justify-content-between">
                                <div className="fw-semibold">{o.title}</div>
                                {!!o.isFeatured && (
                                  <span className="badge bg-danger">Feat.</span>
                                )}
                              </div>
                              <div className="small text-muted">
                                {o.startDate
                                  ? new Date(o.startDate).toLocaleDateString()
                                  : "—"}{" "}
                                →{" "}
                                {o.endDate
                                  ? new Date(o.endDate).toLocaleDateString()
                                  : "—"}
                              </div>
                              <div className="mt-1 d-flex gap-2 align-items-center">
                                <span className="badge bg-primary">
                                  {discountBadge(o)}
                                </span>
                                {statusChip(o)}
                              </div>
                              <div className="d-flex gap-2 mt-2">
                                <button
                                  className="btn btn-sm btn-outline-secondary"
                                  onClick={() => openEdit(o)}
                                >
                                  Edit
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => deleteOffer(o._id)}
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
            </>
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
              onClick={() => fetchOffers({ page: page - 1 })}
            >
              ← Prev
            </button>
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={page >= totalPages || loading}
              onClick={() => fetchOffers({ page: page + 1 })}
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <div
        className={`modal fade ${editing ? "show d-block" : ""}`}
        tabIndex="-1"
        style={{ background: editing ? "rgba(0,0,0,.35)" : "transparent" }}
        aria-hidden={!editing}
      >
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <form onSubmit={updateOffer}>
              <div className="modal-header">
                <h5 className="modal-title">Edit Offer</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setEditing(null)}
                />
              </div>
              <div className="modal-body">
                {editing && (
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label">Title</label>
                      <input
                        className="form-control"
                        value={editing.title || ""}
                        onChange={(e) =>
                          setEditing({ ...editing, title: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">Description</label>
                      <input
                        className="form-control"
                        value={editing.description || ""}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="col-6 col-md-3">
                      <label className="form-label">Type</label>
                      <select
                        className="form-select"
                        value={editing.discountType || "percent"}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            discountType: e.target.value,
                          })
                        }
                      >
                        <option value="percent">% off</option>
                        <option value="flat">Flat off</option>
                      </select>
                    </div>
                    <div className="col-6 col-md-3">
                      <label className="form-label">Value</label>
                      <input
                        type="number"
                        className="form-control"
                        value={editing.discountValue ?? 0}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            discountValue: Number(e.target.value),
                          })
                        }
                        min="0"
                        required
                      />
                    </div>

                    <div className="col-6 col-md-3">
                      <label className="form-label">Start</label>
                      <input
                        type="date"
                        className="form-control"
                        value={editing.startDate || ""}
                        onChange={(e) =>
                          setEditing({ ...editing, startDate: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-6 col-md-3">
                      <label className="form-label">End</label>
                      <input
                        type="date"
                        className="form-control"
                        value={editing.endDate || ""}
                        onChange={(e) =>
                          setEditing({ ...editing, endDate: e.target.value })
                        }
                      />
                    </div>

                    <div className="col-6 col-md-3">
                      <label className="form-label">Code</label>
                      <input
                        className="form-control"
                        value={editing.couponCode || ""}
                        onChange={(e) =>
                          setEditing({ ...editing, couponCode: e.target.value })
                        }
                      />
                    </div>

                    <div className="col-6 col-md-3">
                      <label className="form-label">Target</label>
                      <input
                        className="form-control"
                        value={editing.target || ""}
                        onChange={(e) =>
                          setEditing({ ...editing, target: e.target.value })
                        }
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label">Replace Banner</label>
                      <input
                        type="file"
                        className="form-control"
                        accept="image/*"
                        onChange={(e) =>
                          setEditFile(e.target.files?.[0] || null)
                        }
                      />
                      <div className="d-flex gap-2 mt-2">
                        <img
                          src={
                            editPreview ||
                            editing.banner?.url ||
                            editing.banner ||
                            "/assets/placeholder.jpg"
                          }
                          alt="preview"
                          style={{
                            width: 110,
                            height: 70,
                            objectFit: "cover",
                            borderRadius: 6,
                          }}
                        />
                      </div>
                    </div>

                    <div className="col-6 col-md-3">
                      <div className="form-check mt-4">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="activeEdit"
                          checked={!!editing.isActive}
                          onChange={(e) =>
                            setEditing({
                              ...editing,
                              isActive: e.target.checked,
                            })
                          }
                        />
                        <label
                          htmlFor="activeEdit"
                          className="form-check-label"
                        >
                          Active
                        </label>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="form-check mt-4">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="featuredEdit"
                          checked={!!editing.isFeatured}
                          onChange={(e) =>
                            setEditing({
                              ...editing,
                              isFeatured: e.target.checked,
                            })
                          }
                        />
                        <label
                          htmlFor="featuredEdit"
                          className="form-check-label"
                        >
                          Featured
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setEditing(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-pink"
                  disabled={updating}
                >
                  {updating ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageOffers;
