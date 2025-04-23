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
      .from('activities')
      .select('*')
      .eq('destination_id', destinationId);
    
    if (error) {
      console.error('Error fetching activities:', error);
      return NextResponse.json(
        { error: 'Failed to fetch activities' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ activities: data });
  } catch (error) {
    console.error('Error in activities API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { destination_id, activities } = await request.json();
    
    if (!destination_id || !activities || !Array.isArray(activities)) {
      return NextResponse.json(
        { error: 'Destination ID and activities array are required' },
        { status: 400 }
      );
    }
    
    const activitiesToInsert = activities.map(activity => ({
      name: activity.name,
      destination_id
    }));
    
    const { error } = await supabase
      .from('activities')
      .insert(activitiesToInsert);
    
    if (error) {
      console.error('Error saving activities:', error);
      return NextResponse.json(
        { error: 'Failed to save activities' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in activities API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 