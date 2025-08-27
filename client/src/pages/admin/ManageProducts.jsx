import React, { useEffect, useState } from "react";
import api from "../../utils/api";

const ManageProducts = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    price: "",
    description: "",
    category: "",
  });
  const [file, setFile] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/products");
      setList(data.items || data); // depending on your controller output
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (file) fd.append("file", file);
    const { data } = await api.post("/api/products", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    setList((prev) => [data, ...prev]);
    setForm({ name: "", price: "", description: "", category: "" });
    setFile(null);
  };

  const deleteProduct = async (id) => {
    await api.delete(`/api/products/${id}`);
    setList((prev) => prev.filter((p) => p._id !== id));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div>
      <h2>Manage Products</h2>

      {/* Create */}
      <form className="row g-2 mb-4" onSubmit={createProduct}>
        <div className="col-md-3">
          <input
            className="form-control"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div className="col-md-2">
          <input
            type="number"
            className="form-control"
            placeholder="Price"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            required
          />
        </div>
        <div className="col-md-3">
          <input
            className="form-control"
            placeholder="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
        </div>
        <div className="col-md-4">
          <input
            className="form-control"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="col-md-4">
          <input
            type="file"
            className="form-control"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>
        <div className="col-md-2">
          <button className="btn btn-primary w-100" type="submit">
            + Add Product
          </button>
        </div>
      </form>

      {/* List */}
      {loading ? (
        <div>Loading products…</div>
      ) : (
        <table className="table align-middle">
          <thead>
            <tr>
              <th>#</th>
              <th>Image</th>
              <th>Name</th>
              <th>Price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p, idx) => (
              <tr key={p._id}>
                <td>{idx + 1}</td>
                <td>
                  {p.images?.[0]?.url ? (
                    <img
                      src={p.images[0].url}
                      alt={p.name}
                      style={{ width: 60, height: 60, objectFit: "cover" }}
                    />
                  ) : (
                    "—"
                  )}
                </td>
                <td>{p.name}</td>
                <td>{p.price}</td>
                <td>
                  {/* TODO: add edit modal */}
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => deleteProduct(p._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ManageProducts;
