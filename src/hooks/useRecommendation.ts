import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { PostgrestError } from '@supabase/supabase-js';

interface Recommendation {
  id: string;
  title?: string;
  content: string;
  created_at: string;
  user_identifier?: string;
  type: string;
}

export function useRecommendation(id: string) {
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecommendation() {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('llm_results')
          .select('*')
          .eq('id', id)
          .eq('type', 'travel-recommendation')
          .single();

        if (error) {
          throw new Error(error.message);
        }

        setRecommendation(data);
      } catch (error: any) {
        console.error('Error fetching recommendation:', error);
        setError(error.message || 'Failed to fetch recommendation');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchRecommendation();
    }
  }, [id]);

  return { recommendation, loading, error };
}
