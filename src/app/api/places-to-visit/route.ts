import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const destinationId = searchParams.get('destination_id');
    
    if (!destinationId) {
      return NextResponse.json(
        { error: 'Destination ID is required' },
        { status: 400 }
      );
    }
    
    const { data, error } = await supabase
      .from('places_to_visit')
      .select('*')
      .eq('destination_id', destinationId);
    
    if (error) {
      console.error('Error fetching places to visit:', error);
      return NextResponse.json(
        { error: 'Failed to fetch places to visit' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ places: data });
  } catch (error) {
    console.error('Error in places to visit API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { destination_id, places } = await request.json();
    
    if (!destination_id || !places || !Array.isArray(places)) {
      return NextResponse.json(
        { error: 'Destination ID and places array are required' },
        { status: 400 }
      );
    }
    
    const placesToInsert = places.map(place => ({
      name: place.name,
      destination_id
    }));
    
    const { error } = await supabase
      .from('places_to_visit')
      .insert(placesToInsert);
    
    if (error) {
      console.error('Error saving places to visit:', error);
      return NextResponse.json(
        { error: 'Failed to save places to visit' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in places to visit API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 