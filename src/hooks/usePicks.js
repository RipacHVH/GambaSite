import { useEffect, useState, useCallback } from "react";
import { mockPicks } from "../lib/mockPicks";
import { scheduleRefreshes, msUntilEarliestResult, msUntilResultTime } from "./useScheduledRefresh";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export function usePicks() {
  const [data, setData] = useState(null);
  const [usingMock, setUsingMock] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/picks`);
      if (!res.ok) throw new Error(`status ${res.status}`);
      const json = await res.json();
      setData(json);
      setUsingMock(false);
    } catch {
      setData(mockPicks);
      setUsingMock(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // After data loads, schedule refreshes:
  // 1. At 06:00 UTC (new sports day → new pick)
  // 2. At kickoff + 2h20min (match finished → show result)
  // 3. If game already ended but result is missing, poll every 30s until resolved
  useEffect(() => {
    if (!data) return;
    const kickoff = data.freePick?.kickoff ?? null;
    const hasResult = data.freePick?.result != null;
    const resultMs = msUntilEarliestResult(kickoff ? [kickoff] : []);

    const gameAlreadyOver = kickoff && msUntilResultTime(kickoff) === null;
    if (gameAlreadyOver && !hasResult) {
      // Poll every 30s until the score appears
      const id = setTimeout(load, 30_000);
      return () => clearTimeout(id);
    }

    const cancel = scheduleRefreshes(load, resultMs);
    return cancel;
  }, [data, load]);

  return { data, usingMock, loading };
}
