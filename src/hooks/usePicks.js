import { useEffect, useState } from "react";
import { mockPicks } from "../lib/mockPicks";

// VITE_API_BASE_URL must be set in Vercel environment variables to the Render backend URL.
// Locally this stays empty and the Vite proxy in vite.config.js forwards /api to localhost:8787.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export function usePicks() {
  const [data, setData] = useState(null);
  const [usingMock, setUsingMock] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const localDate = new Date().toLocaleDateString("sv"); // "YYYY-MM-DD" in local tz
        const res = await fetch(`${API_BASE_URL}/api/picks?localDate=${localDate}`);
        if (!res.ok) throw new Error(`status ${res.status}`);
        const json = await res.json();
        if (!cancelled) {
          setData(json);
          setUsingMock(false);
        }
      } catch {
        if (!cancelled) {
          setData(mockPicks);
          setUsingMock(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, usingMock, loading };
}
