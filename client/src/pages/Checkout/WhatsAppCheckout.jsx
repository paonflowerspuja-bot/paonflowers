// src/pages/WhatsAppCheckout.jsx
import React, { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useCart } from "../../context/CartContext";

const CURRENCY = import.meta.env.VITE_CURRENCY || "AED";
const LOCALE = CURRENCY === "AED" ? "en-AE" : "en-IN";
const formatCurrency = (n) =>
  new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: CURRENCY,
  }).format(Number(n) || 0);

// IMPORTANT: put your WhatsApp number in E.164 format without "+" (e.g. 9715XXXXXXXX for UAE)
const RAW_WA_NUMBER = (
  import.meta.env.VITE_WHATSAPP_NUMBER || "971500000000"
).replace(/\D/g, "");

const WhatsAppCheckout = () => {
  const { state } = useCart();
  const cartItems = state?.cart || [];

  // Billing basics we’ll include in the WhatsApp message
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState(""); // customer's phone (optional)
  const [address, setAddress] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [notes, setNotes] = useState("");

  const qty = (item) => Number(item.quantity || 1);
  const subtotal = useMemo(
    () => cartItems.reduce((t, it) => t + Number(it.price || 0) * qty(it), 0),
    [cartItems]
  );

  const buildMessage = () => {
    const orderId = `PO-${Date.now().toString().slice(-6)}`;
    const lines = [];

    lines.push(`🛍️ New Order Request (${orderId})`);
    lines.push(`Name: ${fullName || "-"}`);
    if (phone) lines.push(`Customer Phone: ${phone}`);
    lines.push(`Address: ${address || "-"}`);
    if (deliveryDate || deliveryTime) {
      lines.push(
        `Delivery: ${deliveryDate || ""} ${deliveryTime || ""}`.trim()
      );
    }
    lines.push("");
    lines.push("Items:");
    cartItems.forEach((it, i) => {
      const qtyVal = qty(it);
      const lineTotal = Number(it.price || 0) * qtyVal || 0;
      lines.push(
        `${i + 1}. ${it.name || "Item"} x${qtyVal} = ${formatCurrency(
          lineTotal
        )}`
      );
    });
    lines.push(`Subtotal: ${formatCurrency(subtotal)}`);
    if (notes) lines.push(`Notes: ${notes}`);
    lines.push("");
    lines.push("Payment: via WhatsApp (to be finalized)");
    lines.push("— Sent from Paon Flowers website");

    return lines.join("\n");
  };

  const openWhatsApp = () => {
    if (!cartItems.length) {
      alert("Your cart is empty. Please add some items first.");
      return;
    }
    const text = encodeURIComponent(buildMessage());
    const wa = `https://wa.me/${RAW_WA_NUMBER}?text=${text}`;
    window.open(wa, "_blank", "noopener,noreferrer");
  };

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(buildMessage());
      alert(
        "Order details copied. Paste in WhatsApp if the button didn’t open it."
      );
    } catch {
      alert("Could not copy. Long-press the preview to select & copy.");
    }
  };

  return (
    <div className="container-fluid p-0 whatsapp-checkout-page">
      <Helmet>
        <title>WhatsApp Checkout | Paon Flowers</title>
        <meta
          name="description"
          content="Place your order via WhatsApp: review items, share delivery details, and confirm payment directly in chat."
        />
      </Helmet>

      {/* HERO */}
      <section
        className="position-relative text-dark"
        style={{
          background:
            "linear-gradient(120deg, rgba(255,192,203,0.20), rgba(255,255,255,0.85)), url('/assets/hero/whatsapp-checkout.jpg') center/cover no-repeat",
        }}
      >
        <div className="container py-5">
          <div className="row align-items-center g-4">
            <div className="col-lg-7">
              <h1 className="display-5 fw-bold mb-2">WhatsApp Checkout</h1>
              <p className="lead mb-0 text-muted">
                Review your order and continue on WhatsApp to confirm, pay, or
                negotiate. Same-day Dubai delivery available.
              </p>
            </div>
            <div className="col-lg-5">
              <div className="bg-white shadow rounded-4 p-3 p-md-4">
                <div className="row g-2">
                  <div className="col-md-6">
                    <label className="form-label small mb-1">Full Name</label>
                    <input
                      className="form-control"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small mb-1">
                      Your Phone (optional)
                    </label>
                    <input
                      className="form-control"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+9715XXXXXXX"
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label small mb-1">
                      Delivery Address
                    </label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Building, Street, Area, Emirate"
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small mb-1">
                      DeliveryDate
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small mb-1">
                      Delivery Time
                    </label>
                    <input
                      type="time"
                      className="form-control"
                      value={deliveryTime}
                      onChange={(e) => setDeliveryTime(e.target.value)}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label small mb-1">
                      Notes (card message, gate code, etc.)
                    </label>
                    <input
                      className="form-control"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div className="d-flex gap-2 mt-3">
                  <button
                    type="button"
                    className="btn btn-success d-flex align-items-center gap-2 flex-grow-1"
                    onClick={openWhatsApp}
                    disabled={!cartItems.length}
                    title={
                      cartItems.length
                        ? "Open WhatsApp with order details"
                        : "Cart is empty"
                    }
                  >
                    {/* WhatsApp icon (inline SVG) */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                      role="img"
                      aria-label="WhatsApp"
                    >
                      <path d="M13.601 2.326A7.87 7.87 0 0 0 8.04.003C3.642.003.07 3.575.07 7.972c0 1.402.366 2.77 1.06 3.975L0 16l4.151-1.11a7.93 7.93 0 0 0 3.89 1.006h.003c4.396 0 7.969-3.572 7.969-7.969a7.91 7.91 0 0 0-2.412-5.601zM8.044 14.5h-.003a6.52 6.52 0 0 1-3.326-.913l-.238-.141-2.464.659.658-2.404-.155-.247A6.51 6.51 0 0 1 1.57 7.97c0-3.584 2.915-6.5 6.47-6.5a6.45 6.45 0 0 1 4.6 1.9 6.43 6.43 0 0 1 1.888 4.6c0 3.584-2.915 6.5-6.484 6.5z" />
                      <path d="M11.2 9.86c-.174-.087-1.03-.508-1.189-.566-.16-.058-.276-.087-.392.088-.116.174-.451.566-.553.682-.102.116-.203.13-.377.043-.174-.087-.734-.27-1.398-.86-.516-.46-.865-1.027-.967-1.201-.102-.174-.011-.268.077-.355.079-.078.174-.203.26-.305.087-.102.116-.174.174-.29.058-.116.029-.217-.014-.305-.043-.087-.392-.946-.537-1.294-.14-.337-.284-.291-.392-.296l-.334-.006c-.116 0-.305.043-.465.217-.16.174-.61.596-.61 1.453 0 .857.625 1.685.712 1.802.087.116 1.232 1.877 2.983 2.629.417.18.742.287.996.367.418.133.8.114 1.102.069.336-.05 1.03-.421 1.176-.828.145-.406.145-.754.101-.828-.043-.073-.159-.116-.333-.203z" />
                    </svg>
                    Continue on WhatsApp
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={copySummary}
                  >
                    Copy details
                  </button>
                </div>

                <details className="mt-2">
                  <summary className="small text-muted">
                    Preview WhatsApp message
                  </summary>
                  <pre
                    className="small bg-light p-2 rounded mt-2"
                    style={{ whiteSpace: "pre-wrap" }}
                  >
                    {buildMessage()}
                  </pre>
                </details>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROCESS STEPS */}
      <section className="container py-4 py-md-5">
        <div className="text-center mb-4">
          <h4 className="fw-semibold">How it works</h4>
          <p className="text-muted mb-0">
            A simple 4-step process to place your order via WhatsApp
          </p>
        </div>

        {/* Horizontal on md+, stacked on mobile */}
        <div className="steps-wrapper position-relative">
          <div className="row g-4 justify-content-center">
            {[
              {
                n: 1,
                t: "Review your cart",
                d: "Check items and add delivery details.",
              },
              {
                n: 2,
                t: "Open WhatsApp",
                d: "Tap the green button to start chat.",
              },
              {
                n: 3,
                t: "Confirm & negotiate",
                d: "Confirm address, time, and price if needed.",
              },
              {
                n: 4,
                t: "Pay & deliver",
                d: "Complete payment and receive your flowers.",
              },
            ].map((s) => (
              <div className="col-12 col-md-3" key={s.n}>
                <div className="card h-100 border-0 shadow-sm rounded-4 text-center p-3 step-card">
                  <div className="step-number rounded-circle mx-auto">
                    {s.n}
                  </div>
                  <h6 className="mt-2 mb-1">{s.t}</h6>
                  <p className="small text-muted mb-0">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ORDER SUMMARY */}
      <section className="container pb-5">
        <div className="row g-4">
          <div className="col-12 col-lg-7">
            <div className="bg-white border-0 shadow-sm rounded-4 p-3 p-md-4 h-100">
              <h5 className="fw-semibold mb-3">Order Summary</h5>
              {!cartItems.length ? (
                <div className="text-center py-5">
                  <h6 className="mb-1">Your cart is empty</h6>
                  <p className="text-muted mb-3">
                    Add some flowers to continue on WhatsApp.
                  </p>
                  <a href="/featured" className="btn btn-outline-dark">
                    Browse Featured
                  </a>
                </div>
              ) : (
                <>
                  <div className="list-group mb-3 shadow-sm">
                    {cartItems.map((item, idx) => {
                      const q = qty(item);
                      const lineTotal = Number(item.price || 0) * q;
                      return (
                        <div
                          key={idx}
                          className="list-group-item d-flex justify-content-between align-items-center"
                        >
                          <div className="d-flex align-items-center gap-3">
                            <img
                              src={item.image || "/assets/rose.jpg"}
                              alt=""
                              width="56"
                              height="56"
                              style={{ objectFit: "cover", borderRadius: 8 }}
                              onError={(e) =>
                                (e.currentTarget.src = "/assets/rose.jpg")
                              }
                            />
                            <div>
                              <h6 className="my-0">{item.name}</h6>
                              <small className="text-muted">
                                {q} × {formatCurrency(item.price)}
                              </small>
                            </div>
                          </div>
                          <span className="fw-semibold">
                            {formatCurrency(lineTotal)}
                          </span>
                        </div>
                      );
                    })}
                    <div className="list-group-item d-flex justify-content-between">
                      <strong>Subtotal</strong>
                      <strong>{formatCurrency(subtotal)}</strong>
                    </div>
                  </div>
                  <div className="d-grid gap-2">
                    <button
                      className="btn btn-success d-flex align-items-center justify-content-center gap-2"
                      onClick={openWhatsApp}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                        role="img"
                        aria-label="WhatsApp"
                      >
                        <path d="M13.601 2.326A7.87 7.87 0 0 0 8.04.003C3.642.003.07 3.575.07 7.972c0 1.402.366 2.77 1.06 3.975L0 16l4.151-1.11a7.93 7.93 0 0 0 3.89 1.006h.003c4.396 0 7.969-3.572 7.969-7.969a7.91 7.91 0 0 0-2.412-5.601zM8.044 14.5h-.003a6.52 6.52 0 0 1-3.326-.913l-.238-.141-2.464.659.658-2.404-.155-.247A6.51 6.51 0 0 1 1.57 7.97c0-3.584 2.915-6.5 6.47-6.5a6.45 6.45 0 0 1 4.6 1.9 6.43 6.43 0 0 1 1.888 4.6c0 3.584-2.915 6.5-6.484 6.5z" />
                        <path d="M11.2 9.86c-.174-.087-1.03-.508-1.189-.566-.16-.058-.276-.087-.392.088-.116.174-.451.566-.553.682-.102.116-.203.13-.377.043-.174-.087-.734-.27-1.398-.86-.516-.46-.865-1.027-.967-1.201-.102-.174-.011-.268.077-.355.079-.078.174-.203.26-.305.087-.102.116-.174.174-.29.058-.116.029-.217-.014-.305-.043-.087-.392-.946-.537-1.294-.14-.337-.284-.291-.392-.296l-.334-.006c-.116 0-.305.043-.465.217-.16.174-.61.596-.61 1.453 0 .857.625 1.685.712 1.802.087.116 1.232 1.877 2.983 2.629.417.18.742.287.996.367.418.133.8.114 1.102.069.336-.05 1.03-.421 1.176-.828.145-.406.145-.754.101-.828-.043-.073-.159-.116-.333-.203z" />
                      </svg>
                      Continue on WhatsApp
                    </button>
                    <button
                      className="btn btn-outline-secondary"
                      onClick={copySummary}
                    >
                      Copy details (fallback)
                    </button>
                    <p className="text-muted small mb-0">
                      By continuing, you agree to chat with our team on WhatsApp
                      to finalize payment & delivery.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Info / FAQ */}
          <div className="col-12 col-lg-5">
            <div className="bg-white border-0 shadow-sm rounded-4 p-3 p-md-4 h-100">
              <h5 className="fw-semibold mb-3">Good to know</h5>
              <ul className="small text-muted mb-0">
                <li>
                  Negotiation friendly: adjust bouquet size or add-ons in chat.
                </li>
                <li>
                  Secure payment links are shared in WhatsApp by our team.
                </li>
                <li>
                  Same-day delivery typically available before 7 PM Dubai time.
                </li>
                <li>Please share building access instructions if any.</li>
              </ul>

              <div
                className="mt-4 p-3 rounded-3"
                style={{ background: "rgba(233,30,99,0.07)" }}
              >
                <strong>Business WhatsApp:</strong>
                <div className="d-flex align-items-center gap-2 mt-2">
                  <span className="badge text-bg-success">{RAW_WA_NUMBER}</span>
                  <a
                    className="btn btn-sm btn-outline-success"
                    href={`https://wa.me/${RAW_WA_NUMBER}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Chat now
                  </a>
                </div>
                <small className="text-muted d-block mt-2">
                  If the green button doesn’t open WhatsApp, use “Copy details”
                  and paste into the chat.
                </small>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default WhatsAppCheckout;
