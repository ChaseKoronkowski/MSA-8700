// Check database permissions
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://jqhojaznhxopvbnkigzg.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableSchema(tableName) {
  try {
    console.log(`Checking schema for table: ${tableName}`);
    
    // Get table schema
    const { data, error } = await supabase.rpc('get_table_definition', { 
      target_table: tableName 
    });
    
    if (error) {
      console.error(`Error getting schema for ${tableName}:`, error);
      return false;
    }
    
    console.log(`Schema for ${tableName}:`, data);
    return true;
  } catch (error) {
    console.error(`Error checking schema for ${tableName}:`, error);
    return false;
  }
}

async function testTableAccess() {
  const tables = [
    'llm_results',
    'destinations',
    'places_to_visit',
    'restaurants',
    'activities',
    'accommodations'
  ];
  
  for (const table of tables) {
    console.log(`\n--- Testing access for table: ${table} ---`);
    
    // 1. Try reading from table
    console.log(`Testing READ on ${table}...`);
    const { data: readData, error: readError } = await supabase
      .from(table)
      .select('*')
      .limit(1);
    
    if (readError) {
      console.error(`❌ READ permission denied for ${table}:`, readError);
    } else {
      console.log(`✅ READ permission granted for ${table}`);
    }
    
    // 2. Try describing the table
    console.log(`\nDescribing ${table} table...`);
    const schemaResult = await checkTableSchema(table);
    
    if (!schemaResult) {
      console.error(`❌ Unable to get schema for ${table}`);
    }
    
    // 3. Try insertion
    console.log(`\nTesting INSERT on ${table}...`);
    
    let testRecord = {};
    
    switch (table) {
      case 'llm_results':
        testRecord = {
          content: 'Test content',
          type: 'test',
          metadata: { test: true }
        };
        break;
      case 'destinations':
        // First get an llm_result id
        const { data: llmData } = await supabase
          .from('llm_results')
          .select('id')
          .limit(1);
        
        if (!llmData || llmData.length === 0) {
          console.log('No llm_results to reference, creating one...');
          const { data: newLlm, error: newLlmError } = await supabase
            .from('llm_results')
            .insert({
              content: 'Test content',
              type: 'test',
              metadata: { test: true }
            })
            .select('id');
            
          if (newLlmError) {
            console.error('Error creating llm_result:', newLlmError);
            continue;
          }
          
          testRecord = {
            name: 'Test Destination',
            description: 'Test description',
            recommendation_id: newLlm[0].id,
            why_it_fits: 'Test reason'
          };
        } else {
          testRecord = {
            name: 'Test Destination',
            description: 'Test description',
            recommendation_id: llmData[0].id,
            why_it_fits: 'Test reason'
          };
        }
        break;
      case 'places_to_visit':
      case 'restaurants':
      case 'activities':
      case 'accommodations':
        // First get a destination id
        const { data: destData } = await supabase
          .from('destinations')
          .select('id')
          .limit(1);
          
        if (!destData || destData.length === 0) {
          console.log('No destination to reference, skipping...');
          continue;
        }
        
        testRecord = {
          name: `Test ${table} item`,
          destination_id: destData[0].id,
          description: 'Test description',
          created_at: new Date().toISOString()
        };
        
        if (table === 'restaurants' || table === 'accommodations') {
          testRecord.type = 'Test type';
          testRecord.price_range = 'Test price range';
        }
        
        if (table === 'activities') {
          testRecord.day_number = 1;
        }
        break;
    }
    
    const { data: insertData, error: insertError } = await supabase
      .from(table)
      .insert([testRecord])
      .select();
      
    if (insertError) {
      console.error(`❌ INSERT permission denied for ${table}:`, insertError);
      console.error('Error code:', insertError.code);
      console.error('Error message:', insertError.message);
      console.error('Error details:', insertError.details);
    } else {
      console.log(`✅ INSERT permission granted for ${table}`);
      console.log('Inserted record:', insertData[0].id);
      
      // Clean up the test record
      console.log(`Cleaning up test record...`);
      const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .eq('id', insertData[0].id);
        
      if (deleteError) {
        console.error(`❌ DELETE permission denied for ${table}:`, deleteError);
      } else {
        console.log(`✅ DELETE permission granted for ${table}`);
      }
    }
  }
}

testTableAccess()
  .then(() => console.log('\nTable access tests completed'))
  .catch(err => console.error('Error testing table access:', err)); 