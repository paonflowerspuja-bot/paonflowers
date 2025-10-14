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
  const [token, setToken] = useState(() => localStorage.getItem("pf_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        if (!token) {
          setLoading(false);
          return;
        }
        const { data } = await getMeAPI(token);
        if (data?.ok && data.user) {
          setUser(data.user);
        } else {
          localStorage.removeItem("pf_token");
          setToken(null);
          setUser(null);
        }
      } catch {
        localStorage.removeItem("pf_token");
        setToken(null);
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

  return (
    <AuthContext.Provider value={value}>
      {/* ✅ Hide children until auth check finishes, but no text or flicker */}
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
