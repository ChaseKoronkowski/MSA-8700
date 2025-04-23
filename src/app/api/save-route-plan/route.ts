import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    // First, make sure the route_plans table exists
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

    try {
      const { error: tableCreateError } = await supabase.rpc('execute_sql', { 
        sql: createRoutePlansTableSQL 
      });

      if (tableCreateError) {
        console.error('Error ensuring route_plans table exists:', tableCreateError);
        // Continue anyway, as the table might already exist
      }
      
      // Wait a moment to allow the schema cache to refresh
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (tableError) {
      console.error('Error creating route_plans table:', tableError);
      // Continue anyway, as the table might already exist
    }

    const { recommendation_id, days } = await request.json();
    
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
    
    // Simplified approach: Use a default destination name if needed
    let destinationName = "Unknown Destination";
    
    try {
      // Try to get the destination name from the recommendation
      const { data: recommendationData, error: recommendationError } = await supabase
        .from('recommendations')
        .select('destination, id')
        .eq('id', recommendation_id)
        .single();
      
      if (!recommendationError && recommendationData) {
        destinationName = recommendationData.destination || destinationName;
      }
    } catch (error) {
      console.error('Error fetching recommendation details (continuing anyway):', error);
      // Continue with the default destination name
    }
    
    // Try a direct SQL approach to insert the data
    try {
      console.log("Inserting route plan with SQL...");
      const insertSQL = `
        INSERT INTO route_plans (recommendation_id, destination_name, days)
        VALUES ('${recommendation_id}', '${destinationName.replace(/'/g, "''")}', '${JSON.stringify(processedDays)}'::jsonb)
        RETURNING id;
      `;
      
      const { data: insertData, error: insertError } = await supabase.rpc('execute_sql', { 
        sql: insertSQL 
      });
      
      if (insertError) {
        console.error('Error inserting with SQL:', insertError);
        throw insertError;
      }
      
      console.log("SQL Insert result:", insertData);
      
      return NextResponse.json({ 
        success: true,
        message: 'Route plan saved successfully with direct SQL'
      });
    } catch (sqlError) {
      console.error('SQL insert error:', sqlError);
      
      // Fall back to the original method if SQL insert fails
      try {
        console.log("Falling back to regular insert...");
        // Save the route plan to the database using the regular API
        const { data, error } = await supabase
          .from('route_plans')
          .insert({
            recommendation_id,
            destination_name: destinationName,
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
      } catch (apiError) {
        console.error('API insert error:', apiError);
        return NextResponse.json(
          { error: 'Failed with both SQL and API approaches', details: { sqlError, apiError } },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('Error processing route plan:', error);
    return NextResponse.json(
      { error: 'Failed to process and save route plan', details: error },
      { status: 500 }
    );
  }
} 