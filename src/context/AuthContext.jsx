// src/context/AuthContext.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Global auth state. Wrap <App> with <AuthProvider>.
// Any component can call useAuth() to get { user, token, login, logout, loading }.
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { login as loginService, register as registerService, logout as logoutService, getMe } from "../services/authService.js";
import { tokenStore, userStore } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(() => userStore.get());
  const [token,   setToken]   = useState(() => tokenStore.get());
  const [loading, setLoading] = useState(true);   // true while we verify the stored token

  // Verify stored token on mount — catches expired tokens silently
  useEffect(() => {
    const verify = async () => {
      if (!tokenStore.get()) { setLoading(false); return; }
      try {
        const data = await getMe();
        setUser(data.user);
        userStore.set(data.user);
      } catch {
        // Token expired or invalid — clear everything
        logoutService();
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, []);

  // Listen for the global "df:logout" event emitted by apiFetch on 401
  useEffect(() => {
    const handler = () => { setUser(null); setToken(null); };
    window.addEventListener("df:logout", handler);
    return () => window.removeEventListener("df:logout", handler);
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await loginService(credentials);
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  const register = useCallback(async (credentials) => {
    const data = await registerService(credentials);
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(() => {
    logoutService();
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Hook — use inside any component inside <AuthProvider> */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
