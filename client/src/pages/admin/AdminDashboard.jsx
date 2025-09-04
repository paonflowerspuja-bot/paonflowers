// src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// One source of truth for sidebar width (can be overriden via env)
const SIDEBAR_W =
  Number(import.meta.env.VITE_ADMIN_SIDEBAR_WIDTH) > 0
    ? Number(import.meta.env.VITE_ADMIN_SIDEBAR_WIDTH)
    : 260;

const CURRENCY = import.meta.env.VITE_CURRENCY || "AED";
const LOCALE = CURRENCY === "AED" ? "en-AE" : "en-IN";
const fmt = (n) =>
  new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: CURRENCY,
  }).format(Number(n) || 0);

const AdminDashboard = () => {
  const loc = useLocation();
  const isOverview = useMemo(
    () => /\/admin\/?$/.test(loc.pathname),
    [loc.pathname]
  );

  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    productsCount: null,
    ordersCount: null,
    revenueToday: null,
    lowStockCount: null,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [err, setErr] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const intervalRef = useRef(null);

  const fetchJSON = async (path) => {
    const r = await fetch(`${API_BASE}${path}`, { credentials: "include" });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  };

  const loadOverviewData = async () => {
    setErr("");
    if (!isOverview) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      let m;
      try {
        m = await fetchJSON("/admin/metrics");
      } catch {
        const [ordersLite, productsLite] = await Promise.allSettled([
          fetchJSON("/orders?limit=5&sort=-createdAt"),
          fetchJSON("/products?limit=5&sort=-createdAt"),
        ]);
        m = {
          productsCount:
            productsLite.status === "fulfilled"
              ? (Array.isArray(productsLite.value)
                  ? productsLite.value.length
                  : productsLite.value?.products?.length) ?? null
              : null,
          ordersCount:
            ordersLite.status === "fulfilled"
              ? (Array.isArray(ordersLite.value)
                  ? ordersLite.value.length
                  : ordersLite.value?.orders?.length) ?? null
              : null,
          revenueToday: null,
          lowStockCount: null,
        };
      }

      const [ordersRes, productsRes] = await Promise.allSettled([
        fetchJSON("/orders?limit=5&sort=-createdAt"),
        fetchJSON("/products?limit=5&sort=-createdAt"),
      ]);

      const recentOrdersList =
        ordersRes.status === "fulfilled"
          ? Array.isArray(ordersRes.value)
            ? ordersRes.value
            : ordersRes.value?.orders || []
          : [];
      const recentProductsList =
        productsRes.status === "fulfilled"
          ? Array.isArray(productsRes.value)
            ? productsRes.value
            : productsRes.value?.products || []
          : [];

      setMetrics((prev) => ({ ...prev, ...m }));
      setRecentOrders(recentOrdersList);
      setRecentProducts(recentProductsList);
      setLastUpdated(new Date());
    } catch (e) {
      setErr(e?.message || "Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverviewData();

    if (isOverview && autoRefresh) {
      intervalRef.current = setInterval(loadOverviewData, 60000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOverview, autoRefresh]);

  const isActive = (path) =>
    loc.pathname === path ||
    (path !== "/admin" && loc.pathname.startsWith(path));

  // Refresh overview when products change (emitted by ManageProducts)
  useEffect(() => {
    const onChanged = () => {
      if (isOverview) {
        const btn = document.querySelector('[aria-label="Refresh"]');
        btn?.click();
      }
    };
    window.addEventListener("products:changed", onChanged);
    return () => window.removeEventListener("products:changed", onChanged);
  }, [isOverview]);
  //refresh overview when product changes
  useEffect(() => {
    const onChanged = () => isOverview && loadOverviewData();
    window.addEventListener("orders:changed", onChanged);
    return () => window.removeEventListener("orders:changed", onChanged);
  }, [isOverview]);

  // inside src/pages/admin/AdminDashboard.jsx
  useEffect(() => {
    const onOffersChanged = () => {
      if (isOverview) loadOverviewData();
    };
    window.addEventListener("offers:changed", onOffersChanged);
    return () => window.removeEventListener("offers:changed", onOffersChanged);
  }, [isOverview]);

  return (
    <div className="admin-shell d-flex flex-nowrap min-vh-100">
      {/* Desktop Sidebar */}
      <aside
        className="admin-sidebar d-none d-lg-flex flex-column p-3"
        // Lock width so it cannot be overridden elsewhere
        style={{ width: `${SIDEBAR_W}px`, flex: `0 0 ${SIDEBAR_W}px` }}
        role="navigation"
        aria-label="Admin sidebar"
      >
        <h3 className="text-center text-white mb-4">🌸 Paon Admin</h3>
        <nav className="flex-grow-1">
          <ul className="list-unstyled m-0">
            <li className="mb-2">
              <Link
                className={`admin-nav-link ${
                  isActive("/admin") ? "active" : ""
                }`}
                to="/admin"
              >
                Dashboard
              </Link>
            </li>
            <li className="mb-2">
              <Link
                className={`admin-nav-link ${
                  isActive("/admin/products") ? "active" : ""
                }`}
                to="/admin/products"
              >
                <i className="bi bi-box me-2"></i>Manage Products
              </Link>
            </li>
            <li className="mb-2">
              <Link
                className={`admin-nav-link ${
                  isActive("/admin/orders") ? "active" : ""
                }`}
                to="/admin/orders"
              >
                <i className="bi bi-receipt me-2"></i>Manage Orders
              </Link>
            </li>
            <li className="mb-2">
              <Link
                className={`admin-nav-link ${
                  isActive("/admin/offers") ? "active" : ""
                }`}
                to="/admin/offers"
              >
                <i className="bi bi-tag me-2"></i>Manage Offers
              </Link>
            </li>
            <li className="mb-2">
              <Link
                className={`admin-nav-link ${
                  isActive("/admin/delivery") ? "active" : ""
                }`}
                to="/admin/delivery"
              >
                <i className="bi bi-truck me-2"></i>Delivery Status
              </Link>
            </li>
            <li className="mb-2">
              <Link
                className={`admin-nav-link ${
                  isActive("/admin/customers") ? "active" : ""
                }`}
                to="/admin/customers"
              >
                <i className="bi bi-people me-2"></i>Customers
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Offcanvas Sidebar (Mobile/Tablet) */}
      <div
        className="offcanvas offcanvas-start"
        tabIndex="-1"
        id="adminSidebarOffcanvas"
        aria-labelledby="adminSidebarLabel"
        // Force width here so other pages can’t override it
        style={{ ["--bs-offcanvas-width"]: `${SIDEBAR_W}px` }}
        data-bs-scroll="true"
      >
        <div className="offcanvas-header">
          <h5 className="offcanvas-title" id="adminSidebarLabel">
            🌸 Paon Admin
          </h5>
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          />
        </div>
        <div className="offcanvas-body d-flex flex-column">
          <nav className="flex-grow-1">
            <ul className="list-unstyled m-0">
              {[
                { to: "/admin", label: "Dashboard" },
                { to: "/admin/products", label: "Manage Products" },
                { to: "/admin/orders", label: "Manage Orders" },
                { to: "/admin/offers", label: "Manage Offers" },
                { to: "/admin/delivery", label: "Delivery Status" },
                { to: "/admin/customers", label: "Customers" },
              ].map(({ to, label }) => (
                <li className="mb-2" key={to}>
                  <Link
                    className={`admin-nav-link ${isActive(to) ? "active" : ""}`}
                    to={to}
                    data-bs-dismiss="offcanvas"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="small text-muted mt-auto">
            <i className="bi bi-gear me-2"></i>Settings
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="admin-main flex-grow-1 min-w-0">
        {/* Topbar */}
        <header className="admin-topbar d-flex align-items-center justify-content-between px-3 px-md-4 py-2 shadow-sm bg-white sticky-top">
          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-outline-secondary d-lg-none"
              type="button"
              data-bs-toggle="offcanvas"
              data-bs-target="#adminSidebarOffcanvas"
              aria-controls="adminSidebarOffcanvas"
            >
              <i className="bi bi-list"></i>
            </button>
            <h5 className="mb-0 fw-semibold">Admin Dashboard</h5>
          </div>

          <div className="d-flex align-items-center gap-2">
            {isOverview && (
              <>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={loadOverviewData}
                  disabled={loading}
                  aria-label="Refresh"
                  title="Refresh"
                >
                  <i className="bi bi-arrow-clockwise"></i>
                </button>
                <div className="form-check form-switch mb-0">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="autoRefreshSwitch"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                  />
                  <label
                    className="form-check-label small"
                    htmlFor="autoRefreshSwitch"
                  >
                    Auto refresh
                  </label>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="p-3 p-md-4">
          {isOverview && (
            <>
              {/* Stat Cards */}
              <div className="row g-3 g-md-4">
                <div className="col-12 col-sm-6 col-xl-3">
                  <div className="card stat-card h-100 shadow-sm">
                    <div className="card-body">
                      <div className="d-flex align-items-center justify-content-between">
                        <div>
                          <div className="stat-label">Products</div>
                          <div className="stat-value">
                            {metrics.productsCount ?? (
                              <span className="placeholder-glow">
                                <span className="placeholder col-6" />
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="stat-icon bg-pink-subtle">
                          <i className="bi bi-box"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-sm-6 col-xl-3">
                  <div className="card stat-card h-100 shadow-sm">
                    <div className="card-body">
                      <div className="d-flex align-items-center justify-content-between">
                        <div>
                          <div className="stat-label">Orders</div>
                          <div className="stat-value">
                            {metrics.ordersCount ?? (
                              <span className="placeholder-glow">
                                <span className="placeholder col-6" />
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="stat-icon bg-pink-subtle">
                          <i className="bi bi-receipt"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-sm-6 col-xl-3">
                  <div className="card stat-card h-100 shadow-sm">
                    <div className="card-body">
                      <div className="d-flex align-items-center justify-content-between">
                        <div>
                          <div className="stat-label">Revenue (Today)</div>
                          <div className="stat-value">
                            {metrics.revenueToday != null ? (
                              fmt(metrics.revenueToday)
                            ) : (
                              <span className="placeholder-glow">
                                <span className="placeholder col-8" />
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="stat-icon bg-pink-subtle">
                          <i className="bi bi-currency-exchange"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-sm-6 col-xl-3">
                  <div className="card stat-card h-100 shadow-sm">
                    <div className="card-body">
                      <div className="d-flex align-items-center justify-content-between">
                        <div>
                          <div className="stat-label">Low Stock</div>
                          <div className="stat-value">
                            {metrics.lowStockCount ?? (
                              <span className="placeholder-glow">
                                <span className="placeholder col-6" />
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="stat-icon bg-pink-subtle">
                          <i className="bi bi-exclamation-triangle"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {!!err && (
                <div className="alert alert-danger my-3">{String(err)}</div>
              )}

              {/* Meta: last updated */}
              <div className="d-flex align-items-center gap-2 small text-muted mt-2">
                <i className="bi bi-clock"></i>
                <span>
                  Last updated:{" "}
                  {lastUpdated ? lastUpdated.toLocaleString() : "—"}
                </span>
              </div>

              {/* Recent Orders & New Products */}
              <div className="row g-3 g-md-4 mt-1">
                <div className="col-12 col-lg-7">
                  <div className="card shadow-sm h-100">
                    <div className="card-header bg-white d-flex justify-content-between align-items-center">
                      <h6 className="mb-0">Recent Orders</h6>
                      <Link to="/admin/orders" className="small">
                        View all
                      </Link>
                    </div>
                    <div className="card-body p-0">
                      <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>Order</th>
                              <th>Customer</th>
                              <th>Total</th>
                              <th>Status</th>
                              <th>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {loading && (
                              <tr>
                                <td colSpan={5} className="text-center p-4">
                                  <div
                                    className="spinner-border"
                                    role="status"
                                    aria-hidden="true"
                                  ></div>
                                </td>
                              </tr>
                            )}
                            {!loading && recentOrders.length === 0 && (
                              <tr>
                                <td
                                  colSpan={5}
                                  className="text-center p-4 text-muted"
                                >
                                  No recent orders
                                </td>
                              </tr>
                            )}
                            {recentOrders.map((o) => (
                              <tr key={o._id}>
                                <td className="fw-semibold">
                                  #{String(o._id).slice(-6)}
                                </td>
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
                                <td>
                                  {o?.createdAt
                                    ? new Date(o.createdAt).toLocaleString()
                                    : "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-lg-5">
                  <div className="card shadow-sm h-100">
                    <div className="card-header bg-white d-flex justify-content-between align-items-center">
                      <h6 className="mb-0">New Products</h6>
                      <Link to="/admin/products" className="small">
                        Manage
                      </Link>
                    </div>
                    <div className="list-group list-group-flush">
                      {loading && (
                        <div className="p-4 text-center">
                          <div
                            className="spinner-border"
                            role="status"
                            aria-hidden="true"
                          ></div>
                        </div>
                      )}
                      {!loading && recentProducts.length === 0 && (
                        <div className="p-4 text-center text-muted">
                          No products yet
                        </div>
                      )}
                      {recentProducts.map((p) => (
                        <div
                          className="list-group-item d-flex align-items-center"
                          key={p._id}
                        >
                          <img
                            src={
                              p?.images?.[0]?.url ||
                              p?.images?.[0] ||
                              "/assets/placeholder.jpg"
                            }
                            alt={p?.name}
                            style={{
                              width: 48,
                              height: 48,
                              objectFit: "cover",
                              borderRadius: 8,
                            }}
                            loading="lazy"
                          />
                          <div className="ms-3">
                            <div className="fw-semibold">{p?.name}</div>
                            <div className="small text-muted">
                              {fmt(p?.price)}
                            </div>
                          </div>
                          <div className="ms-auto">
                            <Link
                              to={`/admin/products/edit/${p?._id}`}
                              className="btn btn-sm btn-outline-secondary"
                            >
                              Edit
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Nested admin pages render here */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
