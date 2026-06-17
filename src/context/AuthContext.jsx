import { createContext, useContext, useState, useEffect, useCallback } from "react";

export const API_URL = import.meta.env.VITE_API_BASE_URL ?? "";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const getToken = () => localStorage.getItem("cb_token");

  const apiFetch = useCallback(async (path, opts = {}) => {
    const token = getToken();
    const headers = { "Content-Type": "application/json", ...(opts.headers ?? {}) };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}${path}`, { ...opts, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  }, []);

  // Restore session on mount
  useEffect(() => {
    const token = getToken();
    if (!token) { setAuthLoading(false); return; }
    apiFetch("/api/auth/me")
      .then((d) => setUser(d.user))
      .catch(() => localStorage.removeItem("cb_token"))
      .finally(() => setAuthLoading(false));
  }, []);

  function handleAuthResponse({ token, user }) {
    localStorage.setItem("cb_token", token);
    setUser(user);
  }

  async function register(email, password) {
    const data = await apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    handleAuthResponse(data);
    return data;
  }

  async function login(email, password) {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    handleAuthResponse(data);
    return data;
  }

  async function refreshUser() {
    try {
      const data = await apiFetch("/api/auth/me");
      setUser(data.user);
      return data.user;
    } catch {
      return null;
    }
  }

  function logout() {
    localStorage.removeItem("cb_token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, authLoading, login, register, logout, refreshUser, apiFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
