import { useEffect, useState, useCallback } from "react";
import { useAuth, API_URL } from "../context/AuthContext";
import { scheduleRefreshes, msUntilEarliestResult } from "./useScheduledRefresh";

export function useParlay() {
  const { user, apiFetch } = useAuth();
  const [parlay, setParlay] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (showSpinner = false) => {
    if (!user?.is_pro) { setParlay(null); return; }
    if (showSpinner) setLoading(true);
    try {
      const data = await apiFetch("/api/pro/parlay");
      setParlay(data);
    } catch {}
    finally { if (showSpinner) setLoading(false); }
  }, [user?.is_pro]);

  useEffect(() => {
    load(true); // show spinner on initial load only
  }, [load]);

  // Schedule refresh at sports-day rollover and after earliest leg finishes
  useEffect(() => {
    if (!parlay?.legs) return;
    const kickoffs = parlay.legs.flatMap(l => l.kickoff ? [l.kickoff] : []);
    const resultMs = msUntilEarliestResult(kickoffs);
    const cancel = scheduleRefreshes(load, resultMs);
    return cancel;
  }, [parlay, load]);

  return { parlay, loading };
}
