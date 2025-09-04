// src/components/ui/Cards.jsx
import React from "react";
import { Card as BsCard, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";

const CURRENCY = import.meta.env.VITE_CURRENCY || "AED";
const LOCALE = CURRENCY === "AED" ? "en-AE" : "en-IN";
const fmt = (n) =>
  new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: CURRENCY,
    maximumFractionDigits: 2,
  }).format(Number(n) || 0);

// Safe image helper (supports http(s), data:, /uploads, /assets)
const IMG = (p) => {
  if (!p) return "/assets/placeholder.jpg";
  if (/^(https?:|data:)/i.test(p)) return p;
  return p.startsWith("/") ? p : `/uploads/${p}`;
};

const Cards = ({
  product,
  id,
  image,
  title,
  price,
  slug,
  stock,
  isFeatured,
}) => {
  // Works with both addToCart(product, qty) and reducer dispatch
  const { addToCart, dispatch } = useCart?.() || {};

  // Normalize input: prefer product object, else build one from props
  const p = product || {
    _id: id,
    id,
    name: title,
    slug,
    price,
    images: [{ url: image }],
    stock,
    isFeatured,
  };

  const firstImage = p?.images?.[0]?.url || p?.images?.[0] || image;
  const inStock = (typeof p?.stock === "number" ? p.stock : 100) > 0;

  const handleAddToCart = () => {
    const payload = {
      id: p?._id || p?.id,
      _id: p?._id || p?.id,
      slug: p?.slug,
      name: p?.name || title,
      price: p?.price ?? price ?? 0,
      image: IMG(firstImage),
      quantity: 1,
    };

    if (typeof addToCart === "function") {
      addToCart(payload, 1);
    } else if (dispatch) {
      dispatch({ type: "ADD_TO_CART", payload });
    } else {
      alert("Added to cart");
    }
  };

  return (
    <BsCard className="h-100 shadow-sm border-0">
      <div className="position-relative">
        <BsCard.Img
          variant="top"
          src={IMG(firstImage)}
          alt={p?.name || title || "Product image"}
          className="w-100"
          style={{ height: 240, objectFit: "cover" }}
          loading="lazy"
        />
        {p?.isFeatured && (
          <span className="badge bg-danger position-absolute top-0 start-0 m-2">
            Featured
          </span>
        )}
        {!inStock && (
          <span className="badge bg-secondary position-absolute top-0 end-0 m-2">
            Out of stock
          </span>
        )}
      </div>

      <BsCard.Body className="d-flex flex-column">
        <BsCard.Title className="mb-1 text-truncate">
          {p?.name || title}
        </BsCard.Title>
        <div className="text-pink fw-semibold mb-2">
          {fmt(p?.price ?? price)}
        </div>

        {p?.description && (
          <BsCard.Text className="text-muted" style={{ fontSize: ".95rem" }}>
            {(p.description || "").slice(0, 90)}
            {(p.description || "").length > 90 ? "…" : ""}
          </BsCard.Text>
        )}

        <div className="mt-auto d-grid gap-2">
          <Button
            as={Link}
            to={`/product/${p?.slug || p?._id || id}`}
            variant="outline-secondary"
          >
            View Details
          </Button>
          <Button
            variant="dark"
            className="btn-pink"
            onClick={handleAddToCart}
            disabled={!inStock}
          >
            {inStock ? "Add to Cart" : "Unavailable in Dubai"}
          </Button>
        </div>
      </BsCard.Body>
    </BsCard>
  );
};

export default Cards;
