import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const apiKey = process.env.SETUP_API_KEY;

  // Basic security check
  if (!authHeader || !apiKey || authHeader !== `Bearer ${apiKey}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient();
  const tableCreationResults = {
    extensions: false,
    access_codes: false,
    llm_results: false,
    destinations: false,
    places_to_visit: false,
    restaurants: false,
    activities: false,
    accommodations: false
  };

  try {
    // Enable UUID extension if not already enabled
    const { error: extensionError } = await supabase.rpc('create_uuid_extension');
    if (extensionError) {
      console.error('Error enabling UUID extension:', extensionError);
    } else {
      tableCreationResults.extensions = true;
    }

    // Load SQL functions from file
    const { data: sqlFunctionsData, error: sqlFunctionsError } = await supabase
      .storage
      .from('sql')
      .download('table_setup_functions.sql');

    if (sqlFunctionsError) {
      console.error('Error loading SQL functions:', sqlFunctionsError);
      return NextResponse.json({ 
        error: 'Failed to load SQL functions', 
        details: sqlFunctionsError 
      }, { status: 500 });
    }

    const sqlFunctions = await sqlFunctionsData.text();
    
    // Execute SQL functions
    const { error: functionCreateError } = await supabase.rpc('execute_sql', { sql: sqlFunctions });
    if (functionCreateError) {
      console.error('Error creating SQL functions:', functionCreateError);
      return NextResponse.json({ 
        error: 'Failed to create SQL functions', 
        details: functionCreateError 
      }, { status: 500 });
    }

    // Create access_codes table
    const { error: accessCodesError } = await supabase.rpc('create_access_codes_table');
    if (accessCodesError) {
      console.error('Error creating access_codes table:', accessCodesError);
    } else {
      tableCreationResults.access_codes = true;
    }

    // Create llm_results table
    const { error: llmResultsError } = await supabase.rpc('create_llm_results_table');
    if (llmResultsError) {
      console.error('Error creating llm_results table:', llmResultsError);
    } else {
      tableCreationResults.llm_results = true;
    }

    // Create destinations table
    const { error: destinationsError } = await supabase.rpc('create_destinations_table');
    if (destinationsError) {
      console.error('Error creating destinations table:', destinationsError);
    } else {
      tableCreationResults.destinations = true;
    }

    // Create places_to_visit table
    const { error: placesToVisitError } = await supabase.rpc('create_places_to_visit_table');
    if (placesToVisitError) {
      console.error('Error creating places_to_visit table:', placesToVisitError);
    } else {
      tableCreationResults.places_to_visit = true;
    }

    // Create restaurants table
    const { error: restaurantsError } = await supabase.rpc('create_restaurants_table');
    if (restaurantsError) {
      console.error('Error creating restaurants table:', restaurantsError);
    } else {
      tableCreationResults.restaurants = true;
    }

    // Create activities table
    const { error: activitiesError } = await supabase.rpc('create_activities_table');
    if (activitiesError) {
      console.error('Error creating activities table:', activitiesError);
    } else {
      tableCreationResults.activities = true;
    }

    // Create accommodations table
    const { error: accommodationsError } = await supabase.rpc('create_accommodations_table');
    if (accommodationsError) {
      console.error('Error creating accommodations table:', accommodationsError);
    } else {
      tableCreationResults.accommodations = true;
    }

    return NextResponse.json({
      message: 'Database setup initiated',
      results: tableCreationResults
    });
  } catch (error) {
    console.error('Error setting up database:', error);
    return NextResponse.json({ error: 'Failed to set up database', details: error }, { status: 500 });
  }
} 