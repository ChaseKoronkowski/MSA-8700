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
      .from('restaurants')
      .select('*')
      .eq('destination_id', destinationId);
    
    if (error) {
      console.error('Error fetching restaurants:', error);
      return NextResponse.json(
        { error: 'Failed to fetch restaurants' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ restaurants: data });
  } catch (error) {
    console.error('Error in restaurants API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { destination_id, restaurants } = await request.json();
    
    if (!destination_id || !restaurants || !Array.isArray(restaurants)) {
      return NextResponse.json(
        { error: 'Destination ID and restaurants array are required' },
        { status: 400 }
      );
    }
    
    const restaurantsToInsert = restaurants.map(restaurant => ({
      name: restaurant.name,
      destination_id
    }));
    
    const { error } = await supabase
      .from('restaurants')
      .insert(restaurantsToInsert);
    
    if (error) {
      console.error('Error saving restaurants:', error);
      return NextResponse.json(
        { error: 'Failed to save restaurants' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in restaurants API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 