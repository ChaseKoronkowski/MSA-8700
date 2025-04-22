import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    // For security, this endpoint should be protected in production
    const apiKey = req.nextUrl.searchParams.get('key');
    if (apiKey !== process.env.SETUP_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if the access_codes table exists
    const { error: accessCodesTableError } = await supabase
      .from('access_codes')
      .select('*')
      .limit(1);
    
    // Create access_codes table if it doesn't exist
    if (accessCodesTableError) {
      const { error: createAccessCodesError } = await supabase.rpc('create_access_codes_table');
      
      if (createAccessCodesError) {
        console.error('Error creating access_codes table:', createAccessCodesError);
        return NextResponse.json(
          { error: 'Failed to create access_codes table' },
          { status: 500 }
        );
      }
      
      // Insert default access code
      const { error: insertAccessCodeError } = await supabase
        .from('access_codes')
        .insert([
          { code: 'ACCESS2024', is_active: true },
        ]);
      
      if (insertAccessCodeError) {
        console.error('Error inserting default access code:', insertAccessCodeError);
      }
    }

    // Check if the llm_results table exists
    const { error: llmResultsTableError } = await supabase
      .from('llm_results')
      .select('*')
      .limit(1);
    
    // Create llm_results table if it doesn't exist
    if (llmResultsTableError) {
      const { error: createLlmResultsError } = await supabase.rpc('create_llm_results_table');
      
      if (createLlmResultsError) {
        console.error('Error creating llm_results table:', createLlmResultsError);
        return NextResponse.json(
          { error: 'Failed to create llm_results table' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true, message: 'Database setup completed successfully' });
  } catch (error) {
    console.error('Error setting up database:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while setting up the database' },
      { status: 500 }
    );
  }
} 