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
      .from('accommodations')
      .select('*')
      .eq('destination_id', destinationId);
    
    if (error) {
      console.error('Error fetching accommodations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch accommodations' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ accommodations: data });
  } catch (error) {
    console.error('Error in accommodations API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { destination_id, accommodations } = await request.json();
    
    if (!destination_id || !accommodations || !Array.isArray(accommodations)) {
      return NextResponse.json(
        { error: 'Destination ID and accommodations array are required' },
        { status: 400 }
      );
    }
    
    const accommodationsToInsert = accommodations.map(accommodation => ({
      name: accommodation.name,
      destination_id
    }));
    
    const { error } = await supabase
      .from('accommodations')
      .insert(accommodationsToInsert);
    
    if (error) {
      console.error('Error saving accommodations:', error);
      return NextResponse.json(
        { error: 'Failed to save accommodations' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in accommodations API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 