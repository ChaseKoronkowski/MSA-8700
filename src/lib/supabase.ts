import { createClient } from '@supabase/supabase-js';

// These values should be moved to environment variables in a production environment
const supabaseUrl = 'https://jqhojaznhxopvbnkigzg.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseKey) {
  console.warn('Supabase key is missing. Please add NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables.');
}

// Create Supabase client with proper headers
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false, // We're handling our own session persistence
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  },
});

// Types for database tables
export type AccessCode = {
  id: string;
  code: string;
  is_active: boolean;
  created_at: string;
};

export type LLMResult = {
  id: string;
  content: string;
  type: string; // e.g., 'travel-recommendation', 'route-plan', etc.
  metadata: any;
  created_at: string;
  user_identifier?: string; // Optional: could be used to associate results with users if needed
}; 