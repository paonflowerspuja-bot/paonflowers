// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { getMeAPI } from "../utils/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // null = unknown/not loaded; falsey is fine

  const login = (userData) => setUser(userData);
  const logout = () => {
    localStorage.removeItem("pf_token");
    setUser(null);
  };

  // hydrate user if token exists
  useEffect(() => {
    const token = localStorage.getItem("pf_token");
    if (!token) {
      setUser(null);
      return;
    }
    let cancelled = false;
    getMeAPI()
      .then(({ data }) => !cancelled && setUser(data?.user || null))
      .catch(() => !cancelled && setUser(null));
    return () => {
      cancelled = true;
    };
  }, []);

  // global 401 handler from api interceptor
  useEffect(() => {
    const handler = () => setUser(null);
    window.addEventListener("pf:unauthorized", handler);
    return () => window.removeEventListener("pf:unauthorized", handler);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
