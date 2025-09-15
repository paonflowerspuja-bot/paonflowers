// client/src/components/ui/Cards.jsx
import React from "react";

// Optional CartContext (won't crash if missing)
let useCart;
try {
  ({ useCart } = await import("../../context/CartContext.jsx"));
} catch {
  /* CartContext not available in this route – that's fine */
}

const CURRENCY = import.meta.env.VITE_CURRENCY || "AED";
const LOCALE =
  CURRENCY === "AED" ? "en-AE" : import.meta.env.VITE_LOCALE || "en-AE";

const fmt = (n) =>
  new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: CURRENCY,
  }).format(Number(n) || 0);

// Safe image getter
const firstImg = (p) =>
  p?.images?.[0]?.url || p?.image || "/assets/placeholder.png";

// Compute price with percent discount
const computePrice = (p) => {
  const price = Number(p?.price) || 0;
  const discount = Math.max(0, Number(p?.discount) || 0);
  const final = discount > 0 ? price - (price * discount) / 100 : price;
  return {
    original: price,
    final: Math.max(0, Number(final.toFixed(2))),
    discount,
  };
};

/**
 * Props:
 * - products: array (unchanged)
 * - onClick(product): optional, fires when image is clicked (unchanged)
 * - showAddToCart: boolean (optional, default false) -> renders "Add to Cart" button
 * - onAddToCart(product): optional; if not provided, uses CartContext.addToCart if available
 * - addButtonText: string (optional, default "Add to Cart")
 * - buttonClassName: string (optional) extra classes for the add button
 * - quantity: number (optional, default 1)
 */
export default function Cards({
  products = [],
  onClick,
  showAddToCart = false,
  onAddToCart,
  addButtonText = "Add to Cart",
  buttonClassName = "btn btn-dark",
  quantity = 1,
}) {
  // Cart context (if available)
  const cartApi = useCart ? useCart() : null;

  const handleAdd = (e, product, price) => {
    e?.stopPropagation?.();
    const item = {
      _id: product._id,
      name: product.name,
      price, // use the computed final price for cart line item
      image: firstImg(product),
      qty: quantity > 0 ? quantity : 1,
    };

    if (typeof onAddToCart === "function") {
      onAddToCart(item, product);
      return;
    }
    if (cartApi?.addToCart) {
      cartApi.addToCart(item);
    }
    // If neither provided, silently no-op (prevents breaking other pages)
  };

  return (
    <div className="row g-3">
      {products.map((p) => {
        const img = firstImg(p);
        const { original, final, discount } = computePrice(p);
        const hasDiscount = discount > 0;

        return (
          <div className="col-6 col-md-4 col-lg-3" key={p._id || p.slug || img}>
            <div className="card h-100 shadow-sm">
              <div className="position-relative" onClick={() => onClick?.(p)}>
                <img
                  src={img}
                  alt={p.name}
                  className="card-img-top"
                  style={{ objectFit: "cover", aspectRatio: "1/1" }}
                  loading="lazy"
                />
                {hasDiscount && (
                  <span className="badge bg-danger position-absolute top-0 start-0 m-2">
                    -{discount}%
                  </span>
                )}
                {p.isFeatured && (
                  <span className="badge bg-success position-absolute top-0 end-0 m-2">
                    Featured
                  </span>
                )}
              </div>

              <div className="card-body d-flex flex-column">
                <div className="fw-semibold mb-1" style={{ minHeight: 40 }}>
                  {p.name}
                </div>

                {/* price */}
                <div className="mt-auto mb-3">
                  {hasDiscount ? (
                    <div className="d-flex align-items-baseline gap-2">
                      <span className="text-muted text-decoration-line-through">
                        {fmt(original)}
                      </span>
                      <span className="fw-bold">{fmt(final)}</span>
                    </div>
                  ) : (
                    <div className="fw-bold">{fmt(original)}</div>
                  )}
                </div>

                {/* CTA: only render when requested (no hidden/ghost button) */}
                {showAddToCart && (
                  <div className="d-grid">
                    <button
                      type="button"
                      className={buttonClassName}
                      onClick={(e) => handleAdd(e, p, hasDiscount ? final : original)}
                    >
                      {addButtonText}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {!products?.length && (
        <div className="col-12 text-center text-muted py-4">No products found</div>
      )}
    </div>
  );
}
