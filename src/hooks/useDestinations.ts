import { useState, useEffect } from 'react';

export type DestinationItem = {
  id: string;
  name: string;
};

export type Destination = {
  id: string;
  name: string;
  description: string;
  recommendation_id: string;
  why_it_fits: string;
  places_to_visit: DestinationItem[];
  restaurants: DestinationItem[];
  activities: DestinationItem[];
  accommodations: DestinationItem[];
};

export function useDestinations(recommendationId: string) {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDestinations() {
      if (!recommendationId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        const response = await fetch(
          `/api/destinations?recommendation_id=${recommendationId}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch destinations');
        }
        
        const data = await response.json();
        setDestinations(data.destinations || []);
      } catch (err: any) {
        console.error('Error fetching destinations:', err);
        setError(err.message || 'Failed to fetch destination data');
      } finally {
        setLoading(false);
      }
    }

    fetchDestinations();
  }, [recommendationId]);

  return { destinations, loading, error };
} 