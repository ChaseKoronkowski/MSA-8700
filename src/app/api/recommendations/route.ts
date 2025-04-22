import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Fetch all recommendations from database
export async function GET(request: NextRequest) {
  try {
    // Get user_identifier from query params if available
    const searchParams = request.nextUrl.searchParams;
    const user_identifier = searchParams.get('user_identifier');
    const id = searchParams.get('id');
    
    let query = supabase
      .from('llm_results')
      .select('*')
      .eq('type', 'travel-recommendation')
      .order('created_at', { ascending: false });
    
    // Filter by user_identifier if provided
    if (user_identifier) {
      query = query.eq('user_identifier', user_identifier);
    }
    
    // Get a specific recommendation by ID if provided
    if (id) {
      query = query.eq('id', id);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching recommendations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch recommendations' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ recommendations: data });
  } catch (error) {
    console.error('Error in recommendations API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 