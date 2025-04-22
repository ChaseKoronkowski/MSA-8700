import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { content, type, metadata = {}, user_identifier } = data;

    // Validate required fields
    if (!content || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: content and type are required' },
        { status: 400 }
      );
    }

    // Save the LLM result to Supabase
    const { data: result, error } = await supabase
      .from('llm_results')
      .insert([
        {
          content,
          type,
          metadata,
          user_identifier,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error saving LLM result:', error);
      return NextResponse.json(
        { error: 'Failed to save LLM result' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error in LLM results API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const type = request.nextUrl.searchParams.get('type');
    const user_identifier = request.nextUrl.searchParams.get('user_identifier');
    
    let query = supabase.from('llm_results').select('*');
    
    // Apply filters if provided
    if (type) {
      query = query.eq('type', type);
    }
    
    if (user_identifier) {
      query = query.eq('user_identifier', user_identifier);
    }
    
    // Order by most recent
    query = query.order('created_at', { ascending: false });
    
    const { data, error } = await query;

    if (error) {
      console.error('Error fetching LLM results:', error);
      return NextResponse.json(
        { error: 'Failed to fetch LLM results' },
        { status: 500 }
      );
    }

    return NextResponse.json({ results: data });
  } catch (error) {
    console.error('Error in LLM results API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 