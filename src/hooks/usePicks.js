import { useEffect, useState } from "react";
import { mockPicks } from "../lib/mockPicks";

// In production there's no Vite dev proxy, so the backend's real URL must be
// baked in at build time via VITE_API_BASE_URL (e.g. https://edgefinder-api.onrender.com).
// Locally this stays empty and the Vite proxy in vite.config.js forwards /api to localhost:8787.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

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
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, usingMock, loading };
}
