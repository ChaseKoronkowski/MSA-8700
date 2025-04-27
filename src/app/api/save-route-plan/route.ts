import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
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

    const { recommendation_id, destination_name, days } = await request.json();
    
    if (!recommendation_id) {
      return NextResponse.json(
        { error: 'Recommendation ID is required' },
        { status: 400 }
      );
    }
    
    if (!days || !Array.isArray(days) || days.length === 0) {
      return NextResponse.json(
        { error: 'Days array is required and must not be empty' },
        { status: 400 }
      );
    }
    
    // Process the days data to structure it properly
    const processedDays = days.map((day, index) => {
      // Extract day number from the day string or use the index+1
      let dayNumber = index + 1;
      if (day.day && typeof day.day === 'string') {
        const match = day.day.match(/\d+/);
        if (match) {
          dayNumber = parseInt(match[0], 10);
        }
      }
      
      // Parse the content to extract morning, afternoon, and evening
      const content = day.content || '';
      
      // Default structure
      const dayStructure = {
        dayNumber,
        morning: '',
        afternoon: '',
        evening: ''
      };
      
      // Extract sections if possible
      const morningMatch = content.match(/Morning:([\s\S]*?)(?=Afternoon:|Evening:|$)/);
      if (morningMatch && morningMatch[1]) {
        dayStructure.morning = morningMatch[1].trim();
      }
      
      const afternoonMatch = content.match(/Afternoon:([\s\S]*?)(?=Evening:|$)/);
      if (afternoonMatch && afternoonMatch[1]) {
        dayStructure.afternoon = afternoonMatch[1].trim();
      }
      
      const eveningMatch = content.match(/Evening:([\s\S]*?)(?=$)/);
      if (eveningMatch && eveningMatch[1]) {
        dayStructure.evening = eveningMatch[1].trim();
      }
      
      return dayStructure;
    });
    
    // Use the provided destination name or default if not provided
    const destinationNameToUse = destination_name || "Unknown Destination";
    
    // Save the route plan to the database
    const { data, error } = await supabase
      .from('route_plans')
      .insert({
        recommendation_id,
        destination_name: destinationNameToUse,
        days: processedDays
      })
      .select();
    
    if (error) {
      console.error('Error saving route plan:', error);
      return NextResponse.json(
        { error: 'Failed to save route plan', details: error },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      id: data?.[0]?.id || null,
      message: 'Route plan saved successfully'
    });
  } catch (error) {
    console.error('Error processing route plan:', error);
    return NextResponse.json(
      { error: 'Failed to process and save route plan', details: error },
      { status: 500 }
    );
  }
} 