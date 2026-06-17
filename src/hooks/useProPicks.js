import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
const API_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export function useProPicks() {
  const { user } = useAuth();
  const [proBoard, setProBoard] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  useEffect(() => {
    if (!user?.is_pro) { setProBoard(null); return; }
    setLoading(true);
    const token = localStorage.getItem("cb_token");
    fetch(`${API_URL}/api/pro/picks`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => { if (d.proBoard) setProBoard(d.proBoard); else setError(d.error); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user?.is_pro]);

  return { proBoard, loading, error };
}
