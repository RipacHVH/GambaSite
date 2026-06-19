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
        const res = await fetch(`${API_BASE_URL}/api/picks`);
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
    // Re-fetch every 5 minutes so result appears automatically after game ends
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { data, usingMock, loading };
}
