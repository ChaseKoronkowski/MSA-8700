import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // First, make sure the route_plans table exists
    const createRoutePlansTableSQL = `
      CREATE TABLE IF NOT EXISTS route_plans (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        recommendation_id UUID NOT NULL,
        destination_name TEXT NOT NULL,
        days JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    try {
      const { error: tableCreateError } = await supabase.rpc('execute_sql', { 
        sql: createRoutePlansTableSQL 
      });

      if (tableCreateError) {
        console.error('Error ensuring route_plans table exists:', tableCreateError);
        // Continue anyway, as the table might already exist
      }
    } catch (tableError) {
      console.error('Error creating route_plans table:', tableError);
      // Continue anyway, as the table might already exist
    }

    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Recommendation ID is required' },
        { status: 400 }
      );
    }
    
    const { data, error } = await supabase
      .from('route_plans')
      .select('*')
      .eq('recommendation_id', id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching route plans:', error);
      return NextResponse.json(
        { error: 'Failed to fetch route plans', details: error },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in route plans API:', error);
    return NextResponse.json(
      { error: 'Server error while fetching route plans', details: error },
      { status: 500 }
    );
  }
} 