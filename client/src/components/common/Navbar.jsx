// src/components/layout/Navbar.jsx
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { gsap } from "gsap";
import { useCart } from "../../context/CartContext";
import UserMenu from "../../pages/user/profileIcon/UserMenu";

const Navbar = () => {
  const topHeaderRef = useRef(null);
  const mainNavRef = useRef(null);
  const logoRef = useRef(null);
  const lastScrollY = useRef(0);
  const scrollingLock = useRef(false); // simple throttle
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  // Cart count (defensive default)
  const { state } = useCart();
  const cartCount = (state?.cart || []).reduce(
    (total, item) => total + (Number(item?.quantity) || 1),
    0
  );

  // GSAP quick setters for smooth transforms
  const quickTopY = useRef(null);
  const quickLogoH = useRef(null);

  useLayoutEffect(() => {
    // Initial states
    if (topHeaderRef.current) gsap.set(topHeaderRef.current, { y: 0 });
    if (mainNavRef.current) gsap.set(mainNavRef.current, { y: 0 });
    if (logoRef.current) gsap.set(logoRef.current, { height: 80 });

    // Create quickTo setters
    if (topHeaderRef.current) {
      quickTopY.current = gsap.quickTo(topHeaderRef.current, "y", {
        duration: 0.35,
        ease: "power2.out",
      });
    }
    if (logoRef.current) {
      quickLogoH.current = gsap.quickTo(logoRef.current, "height", {
        duration: 0.25,
        ease: "power2.out",
      });
    }

    // Scroll handler with simple throttle via rAF
    const onScroll = () => {
      if (scrollingLock.current) return;
      scrollingLock.current = true;

      requestAnimationFrame(() => {
        const y = window.scrollY || 0;
        const goingDown = y > lastScrollY.current;
        const pastHeader = y > 80;

        // Toggle top header
        if (quickTopY.current) {
          // Hide when scrolling down beyond threshold, show when scrolling up / near top
          if (goingDown && pastHeader) quickTopY.current("-100%");
          else quickTopY.current("0%");
        }

        // Shrink logo after small scroll for a sleeker, premium feel
        if (quickLogoH.current) {
          quickLogoH.current(pastHeader ? 56 : 80);
        }

        // Add shadow to main nav when scrolled
        setIsScrolled(pastHeader);

        lastScrollY.current = y;
        scrollingLock.current = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Auto-close collapsed navbar on route change (mobile UX)
  useEffect(() => {
    const nav = document.getElementById("mainNavbar");
    if (nav && nav.classList.contains("show")) {
      nav.classList.remove("show");
    }
    // also scroll to top for cleaner transitions
    // window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);

  // Manually close collapse when clicking a link (if needed)
  const closeCollapse = () => {
    const nav = document.getElementById("mainNavbar");
    if (nav && nav.classList.contains("show")) {
      nav.classList.remove("show");
    }
  };

  return (
    <>
      {/* Top Header */}
      <div
        ref={topHeaderRef}
        className="py-2 px-3 d-flex justify-content-between align-items-center border-bottom position-relative bg-white top-header"
        style={{ zIndex: 1030, willChange: "transform" }}
      >
        {/* Centered Logo */}
        <div className="d-flex justify-content-center w-100 position-relative">
          <Link to="/" aria-label="Paon Flowers Home" className="d-inline-flex">
            <img
              ref={logoRef}
              src="/images/logo.png"
              alt="Paon Flowers Logo"
              style={{ height: 80, width: "auto", transition: "height .2s" }}
            />
          </Link>
        </div>

        {/* Right-side icons (absolute) */}
        <div className="d-flex gap-3 align-items-center position-absolute end-0 me-3">
          {/* Hide extra links on small screens to avoid overlap with toggler */}
          <li className="list-unstyled d-none d-lg-block">
            <Link
              to="/store-location"
              className="text-decoration-none text-muted"
              onClick={closeCollapse}
            >
              Store Location
            </Link>
          </li>

          <Link
            to="/about"
            className="text-decoration-none text-muted d-none d-md-inline"
            onClick={closeCollapse}
          >
            About Us
          </Link>

          {/* Profile / Auth */}
          <UserMenu />

          {/* Cart */}
          <Link
            to="/cart"
            className="nav-link position-relative p-0"
            onClick={closeCollapse}
            aria-label="Cart"
          >
            <img
              src="/images/cart.png"
              alt="Cart"
              style={{ height: 26, width: 26 }}
            />
            {cartCount > 0 && (
              <span
                className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                style={{ fontSize: "0.7rem" }}
              >
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Main Navbar */}
      <nav
        ref={mainNavRef}
        className={`navbar navbar-expand-lg navbar-light bg-white px-3 sticky-top ${
          isScrolled ? "shadow-sm" : ""
        }`}
        style={{ zIndex: 1020, top: 0, willChange: "transform" }}
        aria-label="Primary Navigation"
      >
        <div className="container-fluid">
          {/* Toggler */}
          <button
            className="navbar-toggler ms-auto"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#mainNavbar"
            aria-controls="mainNavbar"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Links */}
          <div className="collapse navbar-collapse" id="mainNavbar">
            <ul className="navbar-nav mx-auto">
              {/* Store Location (mobile/tablet) */}
              <li className="nav-item d-lg-none">
                <Link
                  className="nav-link"
                  to="/store-location"
                  onClick={closeCollapse}
                >
                  Store Location
                </Link>
              </li>

              {/* All Flowers Mega Menu (desktop-friendly) */}
              <li className="nav-item dropdown position-static">
                <Link
                  className="nav-link dropdown-toggle"
                  to="#"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  All Flowers
                </Link>
                <div className="dropdown-menu w-100 w-lg-75 shadow p-4 mega-menu">
                  <div className="row">
                    <div className="col-12 col-md-3 mb-3 mb-md-0">
                      <h6>Shop</h6>
                      <Link
                        className="dropdown-item"
                        to="/shop"
                        onClick={closeCollapse}
                      >
                        Shop All Flowers
                      </Link>
                      <h6 className="mt-3">Add-ons</h6>
                      <Link
                        className="dropdown-item"
                        to="/addons"
                        onClick={closeCollapse}
                      >
                        Balloon & Teddy Bear
                      </Link>
                    </div>

                    <div className="col-12 col-md-3 mb-3 mb-md-0">
                      <h6>Collections</h6>
                      <Link
                        className="dropdown-item"
                        to="/flowers/collections/summer"
                        onClick={closeCollapse}
                      >
                        Summer Collection
                      </Link>
                      <Link
                        className="dropdown-item"
                        to="/flowers/collections/balloons"
                        onClick={closeCollapse}
                      >
                        Balloons
                      </Link>
                      <Link
                        className="dropdown-item"
                        to="/flowers/collections/teddy-bear"
                        onClick={closeCollapse}
                      >
                        Teddy Bear
                      </Link>
                    </div>

                    <div className="col-12 col-md-3 mb-3 mb-md-0">
                      <h6>Flower Types</h6>
                      <Link
                        className="dropdown-item"
                        to="/flowers/type/hydrangeia"
                        onClick={closeCollapse}
                      >
                        Hydrangeia
                      </Link>
                      <Link
                        className="dropdown-item"
                        to="/flowers/type/rose"
                        onClick={closeCollapse}
                      >
                        Rose
                      </Link>
                      <Link
                        className="dropdown-item"
                        to="/flowers/type/lemonium"
                        onClick={closeCollapse}
                      >
                        Lemonium
                      </Link>
                      <Link
                        className="dropdown-item"
                        to="/flowers/type/lilly"
                        onClick={closeCollapse}
                      >
                        Lilly
                      </Link>
                      <Link
                        className="dropdown-item"
                        to="/flowers/type/tulip"
                        onClick={closeCollapse}
                      >
                        Tulip
                      </Link>
                      <Link
                        className="dropdown-item"
                        to="/flowers/type/foliage"
                        onClick={closeCollapse}
                      >
                        Foliage
                      </Link>
                    </div>

                    <div className="col-12 col-md-3">
                      <h6>Flower Colors</h6>
                      <Link
                        className="dropdown-item"
                        to="/flowers/color/pink"
                        onClick={closeCollapse}
                      >
                        Pink
                      </Link>
                      <Link
                        className="dropdown-item"
                        to="/flowers/color/red"
                        onClick={closeCollapse}
                      >
                        Red
                      </Link>
                      <Link
                        className="dropdown-item"
                        to="/flowers/color/white"
                        onClick={closeCollapse}
                      >
                        White
                      </Link>
                      <Link
                        className="dropdown-item"
                        to="/flowers/color/yellow"
                        onClick={closeCollapse}
                      >
                        Yellow
                      </Link>
                    </div>
                  </div>
                </div>
              </li>

              {/* Occasions */}
              <li className="nav-item dropdown  position-lg-relative">
                <Link
                  className="nav-link dropdown-toggle"
                  to="#"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Occasions
                </Link>
                <div className="dropdown-menu mt-2 shadow p-3 p-md-4 mega-menu text-center">
                  {[
                    ["Birthday", "/flowers/birthday"],
                    ["Valentine Day", "/flowers/valentine"],
                    ["Graduation Day", "/flowers/GraduationDay"],
                    ["New Baby", "/flowers/newbaby"],
                    ["Mother's Day", "/flowers/MothersDay"],
                    ["Bridal Boutique", "/flowers/BridalBoutique"],
                    ["Eid", "/flowers/Eid"],
                  ].map(([label, to]) => (
                    <Link
                      key={to}
                      className="dropdown-item"
                      to={to}
                      onClick={closeCollapse}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </li>

              {/* Same Day */}
              <li className="nav-item dropdown  position-lg-relative">
                <Link
                  className="nav-link dropdown-toggle"
                  to="#"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Same Day
                </Link>
                <div className="dropdown-menu mt-2 shadow p-3 p-md-4 mega-menu text-center">
                  {[
                    ["Birthday", "/flowers/birthday"],
                    ["Valentine Day", "/flowers/valentine"],
                    ["Graduation Day", "/flowers/GraduationDay"],
                    ["New Baby", "/flowers/newbaby"],
                    ["Mother's Day", "/flowers/MothersDay"],
                    ["Bridal Boutique", "/flowers/BridalBoutique"],
                    ["Eid", "/flowers/Eid"],
                  ].map(([label, to]) => (
                    <Link
                      key={to}
                      className="dropdown-item"
                      to={to}
                      onClick={closeCollapse}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </li>

              <li className="nav-item">
                <Link
                  className="nav-link"
                  to="/nextday"
                  onClick={closeCollapse}
                >
                  Next Day
                </Link>
              </li>

              <li className="nav-item">
                <Link
                  className="nav-link"
                  to="/weddings"
                  onClick={closeCollapse}
                >
                  Weddings
                </Link>
              </li>

              <li className="nav-item">
                <Link
                  className="nav-link"
                  to="/custom-flowers"
                  onClick={closeCollapse}
                >
                  Customs
                </Link>
              </li>

              <li className="nav-item">
                <Link className="nav-link" to="/blog" onClick={closeCollapse}>
                  Blog
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
