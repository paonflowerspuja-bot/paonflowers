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
  const [token, setToken] = useState(() => localStorage.getItem("pf_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        if (!token) {
          setLoading(false);
          return;
        }
        // ✅ always include Authorization header in getMeAPI
        const { data } = await getMeAPI(token);
        if (data?.ok && data.user) {
          setUser(data.user);
        } else {
          localStorage.removeItem("pf_token");
          setToken(null);
          setUser(null);
        }
      } catch (e) {
        console.warn("getMe failed:", e);
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

  // ✅ memoized value
  const value = useMemo(
    () => ({ user, token, loading, login, logout }),
    [user, token, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {/* ✅ prevent routing redirects until loading done */}
      {loading ? (
        <div className="text-center py-5">Loading...</div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
