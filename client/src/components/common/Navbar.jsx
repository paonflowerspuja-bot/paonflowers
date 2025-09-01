import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { useCart } from "../../context/CartContext"; //
import UserMenu from "../../pages/user/profileIcon/UserMenu";

const Navbar = () => {
  const topHeaderRef = useRef(null);
  const mainNavRef = useRef(null);
  const lastScrollY = useRef(window.scrollY);

  const { state } = useCart(); // ✅ Access state
  const cartCount = state.cart.reduce(
    (total, item) => total + item.quantity,
    0
  ); // total items

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY.current) {
        gsap.to(topHeaderRef.current, {
          y: "-100%",
          duration: 0.4,
          ease: "power2.out",
        });
      } else if (currentScrollY < lastScrollY.current) {
        gsap.to(topHeaderRef.current, {
          y: "0%",
          duration: 0.4,
          ease: "power2.out",
        });
      }

      gsap.to(mainNavRef.current, {
        y: "0%",
        duration: 0.4,
        ease: "power2.out",
      });

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Top Header */}
      <div
        ref={topHeaderRef}
        className="py-2 px-4 d-flex justify-content-between align-items-center border-bottom position-relative bg-white"
        style={{ zIndex: 1030 }}
      >
        <div className="d-flex justify-content-center w-100">
          <Link to={"/"}>
            <img
              src="/images/logo.png"
              alt="Paon Logo"
              style={{ height: "80px" }}
            />
          </Link>
        </div>

        {/* Right side icons */}
        <div className="d-flex gap-3 align-items-center position-absolute end-0 me-3">
          {/* Store Location: show on lg+ only (moved to menu for mobile) */}
          <li className="list-unstyled d-none d-lg-block">
            <Link
              to="/store-location"
              className="text-decoration-none text-muted"
            >
              Store Location
            </Link>
          </li>

          <Link to="/about" className="text-decoration-none text-muted">
            About Us
          </Link>

          <UserMenu />

          <Link to="/cart" className="nav-link position-relative">
            <img src="/images/cart.png" alt="cart" />
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
        className="navbar navbar-expand-lg navbar-light bg-white px-4 sticky-top shadow-sm bg-light"
        style={{ zIndex: 1020, top: 0 }}
      >
        <div className="container-fluid">
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#mainNavbar"
            aria-controls="mainNavbar"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="mainNavbar">
            <ul className="navbar-nav mx-auto">
              {/* Store Location: mobile/tablet only */}
              <li className="nav-item d-lg-none">
                <Link className="nav-link" to="/store-location">
                  Store Location
                </Link>
              </li>

              {/* All Flowers Mega Menu */}
              <li className="nav-item dropdown position-static">
                <Link
                  className="nav-link dropdown-toggle"
                  to="#"
                  role="button"
                  data-bs-toggle="dropdown"
                >
                  All Flowers
                </Link>
                <div className="dropdown-menu w-75 shadow p-4 mega-menu">
                  <div className="row">
                    <div className="col-md-3">
                      <h6>Shop</h6>
                      <Link className="dropdown-item" to="/shop">
                        Shop All Flowers
                      </Link>
                      <h6>Add ons</h6>
                      <Link className="dropdown-item" to="/#">
                        Balloon & Teddy Bear
                      </Link>
                    </div>
                    <div className="col-md-3">
                      <h6>Collections</h6>
                      <Link
                        className="dropdown-item"
                        to="/flowers/collections/summer"
                      >
                        Summer Collection
                      </Link>
                      <Link
                        className="dropdown-item"
                        to="/flowers/collections/balloons"
                      >
                        Balloons
                      </Link>
                      <Link
                        className="dropdown-item"
                        to="/flowers/collections/teddy-bear"
                      >
                        Teddy Bear
                      </Link>
                    </div>
                    <div className="col-md-3">
                      <h6>Flower Types</h6>
                      <Link
                        className="dropdown-item"
                        to="/flowers/type/hydrangeia"
                      >
                        Hydrangeia
                      </Link>
                      <Link className="dropdown-item" to="/flowers/type/rose">
                        Rose
                      </Link>
                      <Link
                        className="dropdown-item"
                        to="/flowers/type/lemonium"
                      >
                        Lemonium
                      </Link>
                      <Link className="dropdown-item" to="/flowers/type/lilly">
                        Lilly
                      </Link>
                      <Link className="dropdown-item" to="/flowers/type/tulip">
                        Tulip
                      </Link>
                      <Link
                        className="dropdown-item"
                        to="/flowers/type/foliage"
                      >
                        Foliage
                      </Link>
                    </div>
                    <div className="col-md-3">
                      <h6>Flower Colors</h6>
                      <Link className="dropdown-item" to="/flowers/color/pink">
                        Pink
                      </Link>
                      <Link className="dropdown-item" to="/flowers/color/red">
                        Red
                      </Link>
                      <Link className="dropdown-item" to="/flowers/color/white">
                        White
                      </Link>
                      <Link
                        className="dropdown-item"
                        to="/flowers/color/yellow"
                      >
                        Yellow
                      </Link>
                    </div>
                  </div>
                </div>
              </li>

              {/* Occasions */}
              <li className="nav-item dropdown position-dynamic">
                <Link
                  className="nav-link dropdown-toggle"
                  to="#"
                  role="button"
                  data-bs-toggle="dropdown"
                >
                  Occasions
                </Link>
                <div className="dropdown-menu mt-2 shadow p-4 mega-menu text-center">
                  <Link className="dropdown-item" to="/flowers/birthday">
                    Birthday
                  </Link>
                  <Link className="dropdown-item" to="/flowers/valentine">
                    Valentine Day
                  </Link>
                  <Link className="dropdown-item" to="/flowers/GraduationDay">
                    Graduation Day
                  </Link>
                  <Link className="dropdown-item" to="/flowers/newbaby">
                    New Baby
                  </Link>
                  <Link className="dropdown-item" to="/flowers/MothersDay">
                    Mother's Day
                  </Link>
                  <Link className="dropdown-item" to="/flowers/BridalBoutique">
                    Bridal Boutique
                  </Link>
                  <Link className="dropdown-item" to="/flowers/Eid">
                    Eid
                  </Link>
                </div>
              </li>

              {/* Same Day */}
              <li className="nav-item dropdown position-dynamic">
                <Link
                  className="nav-link dropdown-toggle"
                  to="#"
                  role="button"
                  data-bs-toggle="dropdown"
                >
                  Same Day
                </Link>
                <div className="dropdown-menu mt-2 shadow p-4 mega-menu text-center">
                  <Link className="dropdown-item" to="/flowers/birthday">
                    Birthday
                  </Link>
                  <Link className="dropdown-item" to="/flowers/valentine">
                    Valentine Day
                  </Link>
                  <Link className="dropdown-item" to="/flowers/GraduationDay">
                    Graduation Day
                  </Link>
                  <Link className="dropdown-item" to="/flowers/newbaby">
                    New Baby
                  </Link>
                  <Link className="dropdown-item" to="/flowers/MothersDay">
                    Mother's Day
                  </Link>
                  <Link className="dropdown-item" to="/flowers/BridalBoutique">
                    Bridal Boutique
                  </Link>
                  <Link className="dropdown-item" to="/flowers/Eid">
                    Eid
                  </Link>
                </div>
              </li>

              <li className="nav-item">
                <Link className="nav-link" to="/nextday">
                  Next Day
                </Link>
              </li>

              <li className="nav-item">
                <Link className="nav-link" to="/weddings">
                  Weddings
                </Link>
              </li>

              <li className="nav-item">
                <Link className="nav-link" to="/custom-flowers">
                  Customs
                </Link>
              </li>

              <li className="nav-item">
                <Link className="nav-link" to="/blog">
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
