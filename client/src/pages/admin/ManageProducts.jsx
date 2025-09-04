// src/pages/admin/ManageProducts.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../../utils/api";

const CURRENCY = import.meta.env.VITE_CURRENCY || "AED";
const LOCALE = CURRENCY === "AED" ? "en-AE" : "en-IN";
const fmt = (n) =>
  new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: CURRENCY,
  }).format(Number(n) || 0);

// small helper to notify other admin pages (e.g., dashboard) + any listeners
const emitProductsChanged = () => {
  window.dispatchEvent(new CustomEvent("products:changed"));
};

const defaultForm = {
  name: "",
  price: "",
  description: "",
  category: "",
  stock: 100,
  isFeatured: false,
  isActive: true,
};

const ManageProducts = () => {
  // list / fetch state
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // filters & pagination
  const [q, setQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  // create/edit
  const [form, setForm] = useState(defaultForm);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);

  // edit modal
  const [editing, setEditing] = useState(null); // product object
  const [editFile, setEditFile] = useState(null);
  const [editPreview, setEditPreview] = useState("");

  // categories (optional — if you have endpoint)
  const [categories, setCategories] = useState([]);

  // image preview handlers
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

  const fetchProducts = async (opts = {}) => {
    const curPage = opts.page || page;
    setLoading(true);
    setErr("");
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (categoryFilter) params.set("category", categoryFilter);
      params.set("limit", String(limit));
      params.set("page", String(curPage));
      params.set("sort", "-createdAt");

      const { data } = await api.get(`/api/products?${params.toString()}`);
      // support both shapes: {items,total} or array
      const items = Array.isArray(data)
        ? data
        : data.items || data.products || [];
      const t = Array.isArray(data)
        ? items.length
        : data.total ?? data.count ?? items.length;

      setList(items);
      setTotal(t);
      if (opts.page) setPage(opts.page);
    } catch (e) {
      setErr(
        e?.response?.data?.message || e?.message || "Failed to load products"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      // optional endpoint; if you don’t have it, this silently keeps an empty list
      const { data } = await api.get("/api/categories");
      const arr = Array.isArray(data)
        ? data
        : data.items || data.categories || [];
      setCategories(arr);
    } catch {}
  };

  useEffect(() => {
    fetchProducts({ page: 1 });
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doSearch = () => fetchProducts({ page: 1 });

  const createProduct = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append("file", file);

      const { data } = await api.post("/api/products", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // optimistic update
      setList((prev) => [data, ...prev.slice(0, limit - 1)]);
      setForm(defaultForm);
      setFile(null);
      setPreview("");
      emitProductsChanged();
    } catch (e) {
      alert(
        e?.response?.data?.message || e?.message || "Failed to create product"
      );
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (p) => {
    setEditing(p);
    setEditFile(null);
    setEditPreview("");
  };

  const updateProduct = async (e) => {
    e.preventDefault();
    if (!editing?._id) return;

    try {
      setSaving(true);

      // if image is replaced, send multipart; else send JSON
      if (editFile) {
        const fd = new FormData();
        // keep basic fields editable
        fd.append("name", editing.name || "");
        fd.append("price", editing.price ?? 0);
        fd.append("description", editing.description || "");
        fd.append("category", editing.category || "");
        fd.append("stock", editing.stock ?? 0);
        fd.append("isFeatured", editing.isFeatured ? "true" : "false");
        fd.append("isActive", editing.isActive ? "true" : "false");
        fd.append("file", editFile);

        const { data } = await api.put(`/api/products/${editing._id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        applyLocalUpdate(data);
      } else {
        const payload = {
          name: editing.name,
          price: editing.price,
          description: editing.description,
          category: editing.category,
          stock: editing.stock,
          isFeatured: !!editing.isFeatured,
          isActive: !!editing.isActive,
        };
        const { data } = await api.put(`/api/products/${editing._id}`, payload);
        applyLocalUpdate(data);
      }
      setEditing(null);
      emitProductsChanged();
    } catch (e) {
      alert(
        e?.response?.data?.message || e?.message || "Failed to update product"
      );
    } finally {
      setSaving(false);
    }
  };

  const applyLocalUpdate = (updated) => {
    setList((prev) =>
      prev.map((p) =>
        p._id === (updated?._id || updated?.id) ? { ...p, ...updated } : p
      )
    );
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await api.delete(`/api/products/${id}`);
      setList((prev) => prev.filter((p) => p._id !== id));
      emitProductsChanged();
    } catch (e) {
      alert(
        e?.response?.data?.message || e?.message || "Failed to delete product"
      );
    }
  };

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / limit)),
    [total, limit]
  );

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <h2 className="mb-0">Manage Products</h2>

        <div className="d-flex flex-wrap gap-2">
          <div className="input-group" style={{ maxWidth: 340 }}>
            <input
              className="form-control"
              placeholder="Search name / description"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doSearch()}
            />
            <button className="btn btn-outline-secondary" onClick={doSearch}>
              Search
            </button>
          </div>

          <select
            className="form-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ minWidth: 180 }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option
                key={c._id || c.value || c}
                value={c.slug || c.value || c.name || c}
              >
                {c.name || c.label || c}
              </option>
            ))}
          </select>

          <button
            className="btn btn-outline-secondary"
            onClick={() => fetchProducts({ page: 1 })}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Create */}
      <form className="row g-3 mb-4 align-items-end" onSubmit={createProduct}>
        <div className="col-12 col-md-3">
          <label className="form-label">Name</label>
          <input
            className="form-control"
            placeholder="e.g., Blush Rose Box"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div className="col-6 col-md-2">
          <label className="form-label">Price ({CURRENCY})</label>
          <input
            type="number"
            className="form-control"
            placeholder="249"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            required
            min="0"
          />
        </div>
        <div className="col-6 col-md-2">
          <label className="form-label">Stock</label>
          <input
            type="number"
            className="form-control"
            placeholder="100"
            value={form.stock}
            onChange={(e) =>
              setForm({ ...form, stock: Number(e.target.value) })
            }
            min="0"
          />
        </div>
        <div className="col-12 col-md-2">
          <label className="form-label">Category</label>
          <input
            className="form-control"
            placeholder="e.g., Birthday"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
        </div>
        <div className="col-12 col-md-3">
          <label className="form-label">Description</label>
          <input
            className="form-control"
            placeholder="Short description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="col-12 col-md-3">
          <label className="form-label">Image</label>
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
              style={{ width: 100, height: 100, objectFit: "cover" }}
            />
          )}
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

        <div className="col-12 col-md-2 ms-auto">
          <button
            className="btn btn-pink w-100"
            type="submit"
            disabled={saving}
          >
            {saving ? "Saving…" : "+ Add Product"}
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
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th style={{ minWidth: 90 }}>Image</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th className="text-end">Price</th>
                    <th className="text-end">Stock</th>
                    <th>Flags</th>
                    <th style={{ width: 160 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((p, idx) => {
                    const img =
                      p.images?.[0]?.url ||
                      p.images?.[0] ||
                      p.image ||
                      "/assets/placeholder.jpg";
                    return (
                      <tr key={p._id}>
                        <td>{(page - 1) * limit + idx + 1}</td>
                        <td>
                          <img
                            src={img}
                            alt={p.name}
                            style={{
                              width: 60,
                              height: 60,
                              objectFit: "cover",
                              borderRadius: 6,
                            }}
                            loading="lazy"
                          />
                        </td>
                        <td className="fw-semibold">{p.name}</td>
                        <td>{p.category || "—"}</td>
                        <td className="text-end">{fmt(p.price)}</td>
                        <td className="text-end">{p.stock ?? "—"}</td>
                        <td>
                          {!!p.isFeatured && (
                            <span className="badge bg-danger me-2">
                              Featured
                            </span>
                          )}
                          {p.isActive ? (
                            <span className="badge bg-success">Active</span>
                          ) : (
                            <span className="badge bg-secondary">Hidden</span>
                          )}
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-outline-secondary"
                              onClick={() => openEdit(p)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-outline-danger"
                              onClick={() => deleteProduct(p._id)}
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
                        No products found
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
              onClick={() => fetchProducts({ page: page - 1 })}
            >
              ← Prev
            </button>
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={page >= totalPages}
              onClick={() => fetchProducts({ page: page + 1 })}
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal (Bootstrap) */}
      <div
        className={`modal fade ${editing ? "show d-block" : ""}`}
        tabIndex="-1"
        style={{ background: editing ? "rgba(0,0,0,.35)" : "transparent" }}
        aria-hidden={!editing}
      >
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <form onSubmit={updateProduct}>
              <div className="modal-header">
                <h5 className="modal-title">Edit Product</h5>
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
                      <label className="form-label">Name</label>
                      <input
                        className="form-control"
                        value={editing.name || ""}
                        onChange={(e) =>
                          setEditing({ ...editing, name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="col-6 col-md-3">
                      <label className="form-label">Price ({CURRENCY})</label>
                      <input
                        type="number"
                        className="form-control"
                        value={editing.price ?? 0}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            price: Number(e.target.value),
                          })
                        }
                        min="0"
                        required
                      />
                    </div>
                    <div className="col-6 col-md-3">
                      <label className="form-label">Stock</label>
                      <input
                        type="number"
                        className="form-control"
                        value={editing.stock ?? 0}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            stock: Number(e.target.value),
                          })
                        }
                        min="0"
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">Category</label>
                      <input
                        className="form-control"
                        value={editing.category || ""}
                        onChange={(e) =>
                          setEditing({ ...editing, category: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={editing.description || ""}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label">Replace Image</label>
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
                            editing.images?.[0]?.url ||
                            editing.images?.[0] ||
                            "/assets/placeholder.jpg"
                          }
                          alt="preview"
                          style={{
                            width: 100,
                            height: 100,
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
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageProducts;
