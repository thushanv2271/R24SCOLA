import { useCallback, useEffect, useRef, useState } from "react";
import { loadListings } from "../services/listingsCache";

// Home's category counts and recommendations always use the same snapshot.
export const useHomeListings = () => {
  const [listings, setListings] = useState(null);
  const [error, setError] = useState(false);
  const mounted = useRef(false);

  const refresh = useCallback(async (force = false) => {
    try {
      const data = await loadListings({ force });
      if (mounted.current) { setListings(data); setError(false); }
    } catch {
      if (mounted.current) setError(true);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    refresh();
    return () => { mounted.current = false; };
  }, [refresh]);

  return { listings, error, refresh };
};
