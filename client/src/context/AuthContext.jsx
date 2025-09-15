// client/src/context/AuthContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getMeAPI } from "../utils/api";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(
    () => localStorage.getItem("pf_token") || null
  );
  const [loading, setLoading] = useState(true);

  // Always try /auth/me on mount or when token changes.
  // - In normal mode: /me returns 401 if no token -> we handle it and stay logged out.
  // - In bypass mode (SKIP_AUTH=true): /me returns a fake user -> we become "logged in" without a token.
  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await getMeAPI(); // sends Authorization only if token exists
        if (data?.ok && data.user) {
          setUser(data.user);
        } else {
          // invalid/no token
          if (token) {
            localStorage.removeItem("pf_token");
            setToken(null);
          }
          setUser(null);
        }
      } catch {
        if (token) {
          localStorage.removeItem("pf_token");
          setToken(null);
        }
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [token]);

  const login = (u, jwt) => {
    if (jwt) {
      localStorage.setItem("pf_token", jwt);
      setToken(jwt);
    }
    setUser(u || null);
  };

  const logout = () => {
    localStorage.removeItem("pf_token");
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, token, loading, login, logout }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
