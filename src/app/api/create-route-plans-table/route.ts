import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Create the route_plans table with schema refresh
    const createRoutePlansTableSQL = `
      -- Drop the table if it exists (to ensure a clean start)
      DROP TABLE IF EXISTS route_plans;
      
      -- Create the table with proper structure
      CREATE TABLE route_plans (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        recommendation_id UUID NOT NULL,
        destination_name TEXT NOT NULL,
        days JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Force PostgREST to refresh its schema cache
      NOTIFY pgrst, 'reload schema';
    `;

    const { error } = await supabase.rpc('execute_sql', { 
      sql: createRoutePlansTableSQL 
    });

    if (error) {
      console.error('Error creating route_plans table:', error);
      return NextResponse.json({ 
        error: 'Failed to create route_plans table', 
        details: error 
      }, { status: 500 });
    }
    
    // Create a test record to ensure the table works
    try {
      // Wait a moment to allow the schema cache to refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const testSQL = `
        INSERT INTO route_plans (recommendation_id, destination_name, days)
        VALUES ('00000000-0000-0000-0000-000000000000', 'Test Destination', '[{"dayNumber":1,"morning":"Test morning","afternoon":"Test afternoon","evening":"Test evening"}]'::jsonb);
      `;
      
      const { error: testError } = await supabase.rpc('execute_sql', { 
        sql: testSQL 
      });
      
      if (testError) {
        console.error('Error creating test record:', testError);
      }
    } catch (testError) {
      console.error('Error testing route_plans table:', testError);
    }

    return NextResponse.json({
      message: 'Route plans table created successfully',
      note: 'Schema cache has been refreshed'
    });
  } catch (error) {
    console.error('Error creating route_plans table:', error);
    return NextResponse.json({ 
      error: 'Failed to create route_plans table', 
      details: error 
    }, { status: 500 });
  }
} 