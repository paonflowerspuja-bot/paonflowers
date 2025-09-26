// client/src/pages/admin/ManageProducts.jsx
import React, { useEffect, useMemo, useState } from "react";
import api, { postMultipart, patchMultipart } from "../../utils/api"; // 👈 updated import

const CURRENCY = import.meta.env.VITE_CURRENCY || "AED";
const LOCALE = CURRENCY === "AED" ? "en-AE" : "en-IN";
const fmt = (n) =>
  new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: CURRENCY,
  }).format(Number(n) || 0);

// Helper to build FormData from plain object
function buildFormData(obj) {
  const fd = new FormData();
  Object.entries(obj || {}).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (k === "offerId" && String(v).trim() === "") return;
    if (k === "tags") {
      if (Array.isArray(v)) fd.append("tags", JSON.stringify(v));
      else fd.append("tags", v);
    } else if (k === "image" && v instanceof File) {
      fd.append("image", v);
    } else {
      fd.append(k, String(v));
    }
  });
  return fd;
}

// unify server response → product object
const asProduct = (data) => data?.product ?? data?.item ?? data;

const emptyForm = {
  name: "",
  description: "",
  price: "",
  stock: 100,

  // categorization
  flowerType: "",
  flowerColor: "",
  occasion: "",
  collection: "",

  isFeatured: false,

  // offers
  discount: "",
  offerId: "",

  tags: "",
  image: null, // File
};

export default function ManageProducts() {
  // list state
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // form state
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); // product being edited
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // categories (from server)
  const [cats, setCats] = useState({
    types: [],
    colors: [],
    occasions: [],
    collections: [],
  });

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / limit)),
    [total, limit]
  );

  const loadCategories = async () => {
    try {
      const { data } = await api.get("/api/categories");
      setCats({
        types: data?.types || [],
        colors: data?.colors || [],
        occasions: data?.occasions || [],
        collections: data?.collections || [],
      });
    } catch {
      // fallback (hardcoded) if API missing
      setCats({
        types: ["Hydrangeia", "Rose", "Lemonium", "Lilly", "Tulip", "Foliage"],
        colors: ["Red", "Pink", "White", "Yellow"],
        occasions: [
          "Birthday",
          "Valentine Day",
          "Graduation Day",
          "New Baby",
          "Mother's Day",
          "Bridal Boutique",
          "Eid",
        ],
        collections: ["Summer Collection", "Balloons", "Teddy Bear"],
      });
    }
  };

  const fetchProducts = async (p = page) => {
    setLoading(true);
    setErr("");
    try {
      const params = new URLSearchParams({
        page: String(p),
        limit: String(limit),
        sort: "-createdAt",
      });
      const { data } = await api.get(`/api/products?${params.toString()}`);
      const arr = Array.isArray(data) ? data : data.items || [];
      const t = Array.isArray(data)
        ? arr.length
        : data.total ?? data.count ?? arr.length;
      setItems(arr);
      setTotal(t);
      setPage(p);
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
    fetchProducts(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name || "",
      description: p.description || "",
      price: p.price ?? "",
      stock: p.stock ?? 100,
      flowerType: p.flowerType || "",
      flowerColor: p.flowerColor || "",
      occasion: p.occasion || "",
      collection: p.collection || "",
      isFeatured: !!p.isFeatured,
      discount: p.discount ?? "",
      offerId: p.offerId || "",
      tags: Array.isArray(p.tags) ? p.tags.join(", ") : p.tags || "",
      image: null,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const onChange = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const saveProduct = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: form.price === "" ? "" : Number(form.price),
        stock: form.stock === "" ? "" : Number(form.stock),
        discount: form.discount === "" ? "" : Number(form.discount),
        // normalize tags (server accepts CSV or JSON)
        tags:
          typeof form.tags === "string"
            ? form.tags
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : form.tags || [],
      };

      // Build FormData for possible file upload
      const fd = buildFormData(payload);

      if (editing?._id) {
        // 👇 use upload-safe client (30s timeout; multipart headers auto)
        const { data } = await patchMultipart(
          `/api/products/${editing._id}`,
          fd
        );
        const updated = asProduct(data);
        if (!updated?._id) throw new Error("Update failed: invalid response");
        setItems((prev) =>
          prev.map((x) => (x._id === updated._id ? updated : x))
        );
      } else {
        // 👇 use upload-safe client (30s timeout; multipart headers auto)
        const { data } = await postMultipart(`/api/products`, fd);
        const created = asProduct(data);
        if (!created?._id) throw new Error("Create failed: invalid response");
        setItems((prev) => [created, ...prev]);
        setTotal((t) => t + 1);
      }

      closeForm();
    } catch (e) {
      alert(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to save product. Check fields."
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product? This cannot be undone.")) return;
    try {
      await api.delete(`/api/products/${id}`);
      setItems((prev) => prev.filter((x) => x._id !== id));
      setTotal((t) => Math.max(0, t - 1));
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || "Delete failed");
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">Manage Products</h2>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-secondary"
            onClick={() => fetchProducts(page)}
          >
            Refresh
          </button>
          <button className="btn btn-pink" onClick={openCreate}>
            + New Product
          </button>
        </div>
      </div>

      {/* List */}
      <div className="card shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="p-4 text-center">
              <div
                className="spinner-border"
                role="status"
                aria-hidden="true"
              />
            </div>
          ) : err ? (
            <div className="alert alert-danger m-3">{err}</div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Product</th>
                    <th>Type</th>
                    <th>Color</th>
                    <th>Occasion</th>
                    <th>Collection</th>
                    <th className="text-end">Price</th>
                    <th className="text-center">Featured</th>
                    <th className="text-center">Discount</th>
                    <th style={{ width: 200 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((p, idx) => {
                    const thumb =
                      p?.images?.[0]?.url ||
                      p?.image ||
                      "/assets/placeholder.png";
                    return (
                      <tr key={p?._id || p?.slug || `row-${idx}`}>
                        <td>{(page - 1) * limit + idx + 1}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <img
                              src={thumb}
                              alt={p?.name || "Product image"}
                              style={{
                                width: 44,
                                height: 44,
                                objectFit: "cover",
                                borderRadius: 8,
                                marginRight: 10,
                              }}
                              loading="lazy" // 👈 small perf win
                            />
                            <div>
                              <div className="fw-semibold">
                                {p?.name || "—"}
                              </div>
                              <div className="small text-muted">
                                {p?.slug || ""}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>{p?.flowerType || "—"}</td>
                        <td>{p?.flowerColor || "—"}</td>
                        <td>{p?.occasion || "—"}</td>
                        <td>{p?.collection || "—"}</td>
                        <td className="text-end">{fmt(p?.price)}</td>
                        <td className="text-center">
                          {p?.isFeatured ? (
                            <span className="badge bg-success">Yes</span>
                          ) : (
                            <span className="badge bg-secondary">No</span>
                          )}
                        </td>
                        <td className="text-center">
                          {p?.discount ? `${p.discount}` : "—"}
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
                              disabled={!p?._id}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!items.length && (
                    <tr key="no-items">
                      <td colSpan={10} className="text-center p-4 text-muted">
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
            Showing {(items?.length && (page - 1) * limit + 1) || 0}–
            {(page - 1) * limit + items.length} of {total}
          </small>
          <div className="btn-group">
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={page <= 1 || loading}
              onClick={() => fetchProducts(page - 1)}
            >
              ← Prev
            </button>
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={page >= totalPages || loading}
              onClick={() => fetchProducts(page + 1)}
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* Drawer (right) for Create/Edit */}
      {showForm && (
        <>
          <div
            className="position-fixed top-0 start-0 w-100 h-100"
            style={{ background: "rgba(0,0,0,.35)", zIndex: 1050 }}
            onClick={closeForm}
          />
          <div
            className="position-fixed top-0 end-0 bg-white shadow-lg"
            style={{
              width: "min(92vw, 720px)",
              height: "100vh",
              zIndex: 1055,
              overflowY: "auto",
              borderTopLeftRadius: "0.5rem",
              borderBottomLeftRadius: "0.5rem",
            }}
          >
            <div className="p-3 border-bottom d-flex align-items-center justify-content-between">
              <h5 className="mb-0">
                {editing ? "Edit Product" : "New Product"}
              </h5>
              <button type="button" className="btn-close" onClick={closeForm} />
            </div>

            <div className="p-3">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">Name</label>
                  <input
                    className="form-control"
                    value={form.name}
                    onChange={(e) => onChange("name", e.target.value)}
                    required
                  />
                </div>

                <div className="col-6">
                  <label className="form-label">Price</label>
                  <input
                    type="number"
                    className="form-control"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => onChange("price", e.target.value)}
                    required
                  />
                </div>
                <div className="col-6">
                  <label className="form-label">Stock</label>
                  <input
                    type="number"
                    className="form-control"
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={(e) => onChange("stock", e.target.value)}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={form.description}
                    onChange={(e) => onChange("description", e.target.value)}
                  />
                </div>

                {/* Categorization */}
                <div className="col-6">
                  <label className="form-label">Flower Type</label>
                  <select
                    className="form-select"
                    value={form.flowerType}
                    onChange={(e) => onChange("flowerType", e.target.value)}
                  >
                    <option value="">—</option>
                    {cats.types.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label">Flower Color</label>
                  <select
                    className="form-select"
                    value={form.flowerColor}
                    onChange={(e) => onChange("flowerColor", e.target.value)}
                  >
                    <option value="">—</option>
                    {cats.colors.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-6">
                  <label className="form-label">Occasion</label>
                  <select
                    className="form-select"
                    value={form.occasion}
                    onChange={(e) => onChange("occasion", e.target.value)}
                  >
                    <option value="">—</option>
                    {cats.occasions.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label">Collection</label>
                  <select
                    className="form-select"
                    value={form.collection}
                    onChange={(e) => onChange("collection", e.target.value)}
                  >
                    <option value="">—</option>
                    {cats.collections.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-6">
                  <label className="form-label">Featured</label>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={!!form.isFeatured}
                      onChange={(e) => onChange("isFeatured", e.target.checked)}
                    />
                    <label className="form-check-label">
                      Show on Featured Flowers
                    </label>
                  </div>
                </div>

                {/* Offers */}
                <div className="col-6">
                  <label className="form-label">Discount</label>
                  <input
                    type="number"
                    className="form-control"
                    min="0"
                    step="1"
                    placeholder="e.g. 10"
                    value={form.discount}
                    onChange={(e) => onChange("discount", e.target.value)}
                  />
                  <div className="form-text">
                    Interpreted by your UI (percent or AED)
                  </div>
                </div>

                <div className="col-12">
                  <label className="form-label">Tags (comma separated)</label>
                  <input
                    className="form-control"
                    placeholder="e.g. premium, bouquet, red"
                    value={form.tags}
                    onChange={(e) => onChange("tags", e.target.value)}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label">Image</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*"
                    onChange={(e) =>
                      onChange("image", e.target.files?.[0] || null)
                    }
                  />
                  <div className="form-text">
                    If omitted, existing image remains (on edit).
                  </div>
                </div>

                <div className="col-12 d-flex justify-content-end gap-2">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={closeForm}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-pink"
                    onClick={saveProduct}
                    disabled={saving}
                  >
                    {saving ? "Saving…" : editing ? "Save Changes" : "Create"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
