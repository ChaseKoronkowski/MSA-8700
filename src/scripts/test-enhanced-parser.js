// Test the enhanced parser and database saving
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Import the parsing function (assuming a CJS compatible version exists)
const { parseRecommendation } = require('../utils/parseRecommendationCjs');

// Initialize Supabase client
const supabaseUrl = 'https://jqhojaznhxopvbnkigzg.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Sample recommendation text
const sampleRecommendation = `1. **Barcelona, Spain**
A vibrant coastal city combining stunning architecture, delicious cuisine, and beautiful beaches.

- Why This Fits Your Preferences:
  Barcelona offers a perfect blend of cultural experiences, outdoor activities, and culinary delights. The city's walkable design and efficient public transportation make it ideal for your exploration style, and its Mediterranean climate ensures pleasant weather for your visit.

- Places to Visit:
  • Sagrada Familia - Gaudí's unfinished masterpiece and Barcelona's most iconic landmark. The intricate details and beautiful stained glass are mesmerizing.
  • Park Güell - A whimsical park showcasing more of Gaudí's unique architecture with stunning views of the city.
  • Gothic Quarter - The historic heart of Barcelona with narrow medieval streets, charming squares, and the impressive Barcelona Cathedral.
  • La Boqueria Market - A colorful and bustling food market offering fresh local produce, seafood, and specialty items.

- Restaurants You Should Try:
  • Can Solé - A historic establishment serving authentic Catalan cuisine and exceptional seafood paella (mid-range).
  • Bar Cañete - Popular tapas bar with high-quality local ingredients and lively atmosphere (mid-range to high-end).
  • Tickets - Award-winning tapas restaurant by Ferran Adrià with creative, avant-garde dishes (high-end).

- Activities for Your Trip:
  • Take a guided walking tour of Gaudí's architectural masterpieces, including Casa Batlló and Casa Milà.
  • Enjoy a sunset sailing trip along the Barcelona coastline.
  • Visit the Picasso Museum to explore an extensive collection of the artist's works.

- Accommodation Recommendations:
  • Hotel 1898 - Elegant hotel on La Rambla with a rooftop pool and views of the city (luxury).
  • H10 Casa Mimosa - Boutique hotel in an elegant modernist building near Casa Milà with a garden and terrace (mid-range).
  • Hostel One Paralelo - Social hostel with organized activities and friendly staff (budget).`;

// Generate a valid UUID - this is a simple implementation
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Use fixed UUID for test
const TEST_USER_ID = '3b9b8081-cf77-4dca-8bd6-9f02c1ab5711';

async function saveStructuredRecommendationData(recommendationContent, recommendationId) {
  try {
    // Parse the recommendation text into structured data
    const destinations = parseRecommendation(recommendationContent);
    console.log(`Parsed ${destinations.length} destinations from recommendation ${recommendationId}`);
    
    // Log the structured data for inspection
    console.log('Parsed destination data:');
    console.log(JSON.stringify(destinations, null, 2));
    
    // For each destination in the recommendation
    for (const destination of destinations) {
      // Extract country name from destination (if present)
      const nameParts = destination.name.split(',');
      const cityName = nameParts[0].trim();
      const countryName = nameParts.length > 1 ? nameParts[1].trim() : null;
      
      // 1. Create destination record
      console.log('Inserting destination:', {
        name: cityName,
        country: countryName,
        description: destination.description,
        recommendation_id: recommendationId,
        user_id: TEST_USER_ID // Use valid UUID
      });
      
      const { data: destinationData, error: destinationError } = await supabase
        .from('destinations')
        .insert([{
          name: cityName,
          country: countryName,
          description: destination.description,
          recommendation_id: recommendationId,
          user_id: TEST_USER_ID // Use valid UUID
        }])
        .select('id');
      
      if (destinationError) {
        console.error('Error saving destination:', destinationError);
        console.error('Error details:', destinationError.code, destinationError.details, destinationError.hint);
        continue;
      }
      
      if (!destinationData || destinationData.length === 0) {
        console.error('No destination ID returned');
        continue;
      }
      
      const destinationId = destinationData[0].id;
      console.log(`Created destination with ID: ${destinationId}`);
      
      // 2. Save places to visit
      if (destination.placesToVisit && destination.placesToVisit.length > 0) {
        console.log(`Saving ${destination.placesToVisit.length} places to visit`);
        
        for (const place of destination.placesToVisit) {
          console.log(`Inserting place: "${place.name}"`);
          
          const placeData = {
            name: place.name,
            destination_id: destinationId,
            description: place.description,
            created_at: new Date().toISOString()
          };
          
          const { data: placeResult, error: placeError } = await supabase
            .from('places_to_visit')
            .insert([placeData])
            .select('id');
          
          if (placeError) {
            console.error(`Error saving place "${place.name}":`, placeError);
            console.error('Error details:', placeError.code, placeError.details, placeError.hint);
          } else {
            console.log(`Successfully saved place with ID: ${placeResult?.[0]?.id}`);
          }
        }
      } else {
        console.log('No places to visit to save');
      }
      
      // 3. Save restaurants
      if (destination.restaurants && destination.restaurants.length > 0) {
        console.log(`Saving ${destination.restaurants.length} restaurants`);
        
        for (const restaurant of destination.restaurants) {
          console.log(`Inserting restaurant: "${restaurant.name}"`);
          
          const restaurantData = {
            name: restaurant.name,
            destination_id: destinationId,
            cuisine: restaurant.type, // Changed from type to cuisine
            price_range: restaurant.priceRange,
            description: restaurant.description,
            created_at: new Date().toISOString()
          };
          
          const { data: restaurantResult, error: restaurantError } = await supabase
            .from('restaurants')
            .insert([restaurantData])
            .select('id');
          
          if (restaurantError) {
            console.error(`Error saving restaurant "${restaurant.name}":`, restaurantError);
            console.error('Error details:', restaurantError.code, restaurantError.details, restaurantError.hint);
          } else {
            console.log(`Successfully saved restaurant with ID: ${restaurantResult?.[0]?.id}`);
          }
        }
      } else {
        console.log('No restaurants to save');
      }
      
      // 4. Save activities
      if (destination.activities && destination.activities.length > 0) {
        console.log(`Saving ${destination.activities.length} activities`);
        
        for (const activity of destination.activities) {
          console.log(`Inserting activity: "${activity.name}"`);
          
          const activityData = {
            name: activity.name,
            destination_id: destinationId,
            day_number: null,
            description: activity.description,
            created_at: new Date().toISOString()
          };
          
          const { data: activityResult, error: activityError } = await supabase
            .from('activities')
            .insert([activityData])
            .select('id');
          
          if (activityError) {
            console.error(`Error saving activity "${activity.name}":`, activityError);
            console.error('Error details:', activityError.code, activityError.details, activityError.hint);
          } else {
            console.log(`Successfully saved activity with ID: ${activityResult?.[0]?.id}`);
          }
        }
      } else {
        console.log('No activities to save');
      }
      
      // 5. Save accommodations
      if (destination.accommodations && destination.accommodations.length > 0) {
        console.log(`Saving ${destination.accommodations.length} accommodations`);
        
        for (const accommodation of destination.accommodations) {
          console.log(`Inserting accommodation: "${accommodation.name}"`);
          
          const accommodationData = {
            name: accommodation.name,
            destination_id: destinationId,
            type: accommodation.type,
            price_range: accommodation.priceRange, // Keep the field name as price_range
            description: accommodation.description,
            created_at: new Date().toISOString()
          };
          
          const { data: accommodationResult, error: accommodationError } = await supabase
            .from('accommodations')
            .insert([accommodationData])
            .select('id');
          
          if (accommodationError) {
            console.error(`Error saving accommodation "${accommodation.name}":`, accommodationError);
            console.error('Error details:', accommodationError.code, accommodationError.details, accommodationError.hint);
          } else {
            console.log(`Successfully saved accommodation with ID: ${accommodationResult?.[0]?.id}`);
          }
        }
      } else {
        console.log('No accommodations to save');
      }
    }
    
    console.log(`Successfully saved all structured data for recommendation ${recommendationId}`);
    return true;
  } catch (error) {
    console.error('Error in saveStructuredRecommendationData:', error);
    return false;
  }
}

async function runTest() {
  try {
    console.log('Testing enhanced parser and database saving...');
    
    // 1. Save test recommendation to llm_results
    const { data: llmResult, error: llmError } = await supabase
      .from('llm_results')
      .insert({
        content: sampleRecommendation,
        type: 'travel-recommendation',
        metadata: { test: true, source: 'enhanced-parser-test' }
      })
      .select('id');
    
    if (llmError) {
      console.error('Error saving to llm_results:', llmError);
      return;
    }
    
    console.log('Saved test recommendation to llm_results:', llmResult[0].id);
    
    // 2. Process the recommendation with enhanced parser
    const success = await saveStructuredRecommendationData(sampleRecommendation, llmResult[0].id);
    
    if (success) {
      console.log('✅ Test completed successfully');
      
      // 3. Verify the data was saved correctly by retrieving it
      console.log('\nVerifying saved data...');
      
      const { data: destinations, error: destError } = await supabase
        .from('destinations')
        .select(`
          id,
          name,
          description,
          places_to_visit (id, name, description),
          restaurants (id, name, cuisine, price_range, description),
          activities (id, name, description),
          accommodations (id, name, type, price_range, description)
        `)
        .eq('recommendation_id', llmResult[0].id);
      
      if (destError) {
        console.error('Error fetching saved data:', destError);
      } else {
        console.log('Retrieved saved data:');
        console.log(JSON.stringify(destinations, null, 2));
      }
    } else {
      console.error('❌ Test failed');
    }
  } catch (error) {
    console.error('Error running test:', error);
  }
}

runTest(); 