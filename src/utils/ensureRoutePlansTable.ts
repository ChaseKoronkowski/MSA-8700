import { supabase } from '@/lib/supabase';

/**
 * Ensures that the route_plans table exists in the database
 * This is useful to call before attempting to insert or select from the table
 */
export async function ensureRoutePlansTable(): Promise<boolean> {
  try {
    const createRoutePlansTableSQL = `
      CREATE TABLE IF NOT EXISTS route_plans (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        recommendation_id UUID NOT NULL,
        destination_name TEXT NOT NULL,
        days JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const { error } = await supabase.rpc('execute_sql', { 
      sql: createRoutePlansTableSQL 
    });

    if (error) {
      console.error('Error ensuring route_plans table exists:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error creating route_plans table:', error);
    return false;
  }
} 