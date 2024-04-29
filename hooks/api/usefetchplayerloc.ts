import { useState, useEffect } from "react";
import { fetchPlayerLocations } from "../../api/playerlocations";

export function useFetchLocations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchLocations() {
      try {
        const data = await fetchPlayerLocations();
        setLocations(data);
        setLoading(false);
      } catch (error) {
        
        setLoading(false);
      }
    }

    fetchLocations();

    // Cleanup function
    return () => {
      // Any cleanup code here
    };
  }, []); // Empty dependency array means this effect runs once on mount

  return { locations, loading, error };
}
