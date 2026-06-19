import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { scheduleRefreshes, msUntilEarliestResult } from "./useScheduledRefresh";

const API_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export function useProPicks() {
  const { user } = useAuth();
  const [proBoard, setProBoard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!user?.is_pro) { setProBoard(null); return; }
    setLoading(true);
    const token = localStorage.getItem("cb_token");
    try {
      const r = await fetch(`${API_URL}/api/pro/picks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      if (d.proBoard) setProBoard(d.proBoard);
      else setError(d.error);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user?.is_pro]);

  useEffect(() => {
    load();
  }, [load]);

  // Schedule refresh at sports-day rollover and after earliest match finishes
  useEffect(() => {
    if (!proBoard) return;
    const kickoffs = proBoard.flatMap(m => m.kickoff ? [m.kickoff] : []);
    const resultMs = msUntilEarliestResult(kickoffs);
    const cancel = scheduleRefreshes(load, resultMs);
    return cancel;
  }, [proBoard, load]);

  return { proBoard, loading, error };
}
