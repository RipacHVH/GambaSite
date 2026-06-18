import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";

const REFRESH_MS = 5 * 60 * 1000;

export function useLiveAdvisor(enabled) {
  const { apiFetch } = useAuth();
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [countdown, setCountdown] = useState(REFRESH_MS);

  const load = useCallback(async () => {
    if (!enabled) return;
    try {
      const d = await apiFetch("/api/pro/live-advisor");
      setData(d);
      setError(null);
      setCountdown(REFRESH_MS);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [apiFetch, enabled]);

  useEffect(() => {
    if (!enabled) return;
    load();
    const poll = setInterval(load, REFRESH_MS);
    return () => clearInterval(poll);
  }, [load, enabled]);

  // Countdown tick
  useEffect(() => {
    if (!enabled) return;
    const tick = setInterval(() => setCountdown(c => (c <= 1000 ? REFRESH_MS : c - 1000)), 1000);
    return () => clearInterval(tick);
  }, [enabled]);

  const refresh = load;

  return { data, loading, error, countdown, refresh };
}
