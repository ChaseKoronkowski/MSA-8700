// Test script to diagnose database insertion issues
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = 'https://jqhojaznhxopvbnkigzg.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('Missing SUPABASE_ANON_KEY env variable');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseInsertions() {
  console.log('Starting database insertion tests...');
  
  // 1. Test llm_results insertion
  try {
    const { data: llmResult, error: llmError } = await supabase
      .from('llm_results')
      .insert({
        content: 'Test recommendation content',
        type: 'travel-recommendation',
        metadata: { test: true },
      })
      .select('id');
    
    if (llmError) {
      console.error('Error inserting into llm_results:', llmError);
    } else {
      console.log('Successfully inserted test record into llm_results:', llmResult[0].id);
      
      const recommendationId = llmResult[0].id;
      
      // 2. Test destinations insertion
      const { data: destination, error: destError } = await supabase
        .from('destinations')
        .insert({
          name: 'Test Destination',
          description: 'Test description',
          recommendation_id: recommendationId,
          why_it_fits: 'Test reason'
        })
        .select('id');
      
      if (destError) {
        console.error('Error inserting into destinations:', destError);
      } else {
        console.log('Successfully inserted test record into destinations:', destination[0].id);
        
        const destinationId = destination[0].id;
        
        // 3. Test places_to_visit insertion
        const { data: place, error: placeError } = await supabase
          .from('places_to_visit')
          .insert({
            name: 'Test Place',
            destination_id: destinationId,
            description: 'Test place description',
            created_at: new Date().toISOString()
          })
          .select('id');
        
        if (placeError) {
          console.error('Error inserting into places_to_visit:', placeError);
          console.error('Error details:', placeError.details, placeError.hint, placeError.code);
        } else {
          console.log('Successfully inserted test record into places_to_visit:', place[0].id);
        }
        
        // 4. Test restaurants insertion
        const { data: restaurant, error: restaurantError } = await supabase
          .from('restaurants')
          .insert({
            name: 'Test Restaurant',
            destination_id: destinationId,
            type: 'Test type',
            price_range: 'Test price range',
            description: 'Test restaurant description',
            created_at: new Date().toISOString()
          })
          .select('id');
        
        if (restaurantError) {
          console.error('Error inserting into restaurants:', restaurantError);
          console.error('Error details:', restaurantError.details, restaurantError.hint, restaurantError.code);
        } else {
          console.log('Successfully inserted test record into restaurants:', restaurant[0].id);
        }
        
        // 5. Test activities insertion
        const { data: activity, error: activityError } = await supabase
          .from('activities')
          .insert({
            name: 'Test Activity',
            destination_id: destinationId,
            day_number: 1,
            description: 'Test activity description',
            created_at: new Date().toISOString()
          })
          .select('id');
        
        if (activityError) {
          console.error('Error inserting into activities:', activityError);
          console.error('Error details:', activityError.details, activityError.hint, activityError.code);
        } else {
          console.log('Successfully inserted test record into activities:', activity[0].id);
        }
        
        // 6. Test accommodations insertion
        const { data: accommodation, error: accommodationError } = await supabase
          .from('accommodations')
          .insert({
            name: 'Test Accommodation',
            destination_id: destinationId,
            type: 'Test type',
            price_range: 'Test price range',
            description: 'Test accommodation description',
            created_at: new Date().toISOString()
          })
          .select('id');
        
        if (accommodationError) {
          console.error('Error inserting into accommodations:', accommodationError);
          console.error('Error details:', accommodationError.details, accommodationError.hint, accommodationError.code);
        } else {
          console.log('Successfully inserted test record into accommodations:', accommodation[0].id);
        }
      }
    }
  } catch (error) {
    console.error('Unexpected error during test:', error);
  }
}

// Run the test
testDatabaseInsertions()
  .then(() => console.log('Tests completed'))
  .catch(err => console.error('Error running tests:', err)); 