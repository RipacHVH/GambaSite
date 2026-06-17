import { useEffect, useState } from "react";
import { useAuth, API_URL } from "../context/AuthContext";

export function useParlay() {
  const { user, apiFetch } = useAuth();
  const [parlay, setParlay] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.is_pro) { setParlay(null); return; }
    setLoading(true);
    apiFetch("/api/pro/parlay")
      .then(data => setParlay(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.is_pro]);

  return { parlay, loading };
}
