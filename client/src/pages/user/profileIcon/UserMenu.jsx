// UserMenu.jsx
import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext"; // adjust the relative path if needed

export default function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate("/");
  };

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const avatar = user?.name?.trim()?.[0]?.toUpperCase() || "U";

  return (
    <div className="user-menu" ref={menuRef} style={{ position: "relative" }}>
      <button
        onClick={() => setIsOpen((p) => !p)}
        aria-label="Open user menu"
        style={{ background: "none", border: "none", cursor: "pointer" }}
      >
        {/* If you have a profile image, show it; otherwise a circle avatar */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "#ffe3ef",
            color: "#a6003c",
            display: "grid",
            placeItems: "center",
            fontWeight: 700,
          }}
          title={user?.name || "Guest"}
        >
          {avatar}
        </div>
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "44px",
            right: 0,
            background: "#fff",
            boxShadow: "0px 2px 12px rgba(0,0,0,.1)",
            borderRadius: 10,
            width: 220,
            padding: 10,
            zIndex: 1000,
          }}
        >
          {user ? (
            <>
              <div
                className="px-2 py-1"
                style={{ fontSize: 12, color: "#666" }}
              >
                Signed in as <strong>{user.name || user.phone}</strong>
              </div>
              <hr className="my-2" />
              <Link
                to="/profile"
                className="dropdown-item btn-pink d-block py-2"
              >
                👤 My Profile
              </Link>
              <Link
                to="/profile#orders"
                className="dropdown-item btn-pink d-block py-2"
              >
                📦 My Orders
              </Link>
              <button
                onClick={handleLogout}
                className="dropdown-item btn-pink d-block py-2 w-100 text-start"
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="dropdown-item btn-pink d-block py-2">
              Login
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
