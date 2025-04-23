// Test the full recommendation flow
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabaseUrl = 'https://jqhojaznhxopvbnkigzg.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Import the parsing function directly
const parseRecommendation = (content) => {
  const destinations = [];
  
  // Split content by numbered destinations (e.g., "1. Barcelona, Spain")
  const destinationRegex = /(\d+)\.\s+\*\*([^*]+)\*\*\s*([^\n]+)\n([\s\S]*?)(?=\d+\.\s+\*\*|$)/g;
  
  let match;
  while ((match = destinationRegex.exec(content)) !== null) {
    const name = match[2].trim();
    const description = match[3].trim();
    const detailBlock = match[4].trim();
    
    let whyItFits = '';
    const placesToVisit = [];
    const restaurants = [];
    const activities = [];
    const accommodations = [];
    
    // Extract "Why This Fits Your Preferences" section
    const whyFitsMatch = detailBlock.match(/-\s*Why This Fits[^:]*:([\s\S]*?)(?=-\s*Places to Visit|$)/i);
    if (whyFitsMatch) {
      whyItFits = whyFitsMatch[1].trim();
    }
    
    // Extract "Places to Visit" section
    const placesMatch = detailBlock.match(/-\s*Places to Visit[^:]*:([\s\S]*?)(?=-\s*Restaurants|$)/i);
    if (placesMatch) {
      placesToVisit.push(
        ...placesMatch[1]
          .split(/•|\*/)
          .map(item => item.trim())
          .filter(item => item && !item.match(/^[\s•\*]*$/))
      );
    }
    
    // Extract "Restaurants You Should Try" section
    const restaurantsMatch = detailBlock.match(/-\s*Restaurants[^:]*:([\s\S]*?)(?=-\s*Activities|$)/i);
    if (restaurantsMatch) {
      restaurants.push(
        ...restaurantsMatch[1]
          .split(/•|\*/)
          .map(item => item.trim())
          .filter(item => item && !item.match(/^[\s•\*]*$/))
      );
    }
    
    // Extract "Activities for Your Trip" section
    const activitiesMatch = detailBlock.match(/-\s*Activities[^:]*:([\s\S]*?)(?=-\s*Accommodation|$)/i);
    if (activitiesMatch) {
      activities.push(
        ...activitiesMatch[1]
          .split(/•|\*/)
          .map(item => item.trim())
          .filter(item => item && !item.match(/^[\s•\*]*$/))
      );
    }
    
    // Extract "Accommodation Recommendations" section
    const accommodationsMatch = detailBlock.match(/-\s*Accommodation[^:]*:([\s\S]*?)$/i);
    if (accommodationsMatch) {
      accommodations.push(
        ...accommodationsMatch[1]
          .split(/•|\*/)
          .map(item => item.trim())
          .filter(item => item && !item.match(/^[\s•\*]*$/))
      );
    }
    
    destinations.push({
      name,
      description,
      whyItFits,
      placesToVisit,
      restaurants,
      activities,
      accommodations
    });
  }
  
  return destinations;
};

async function saveStructuredRecommendationData(recommendationContent, recommendationId) {
  try {
    // Parse the recommendation text into structured data
    const destinations = parseRecommendation(recommendationContent);
    console.log(`Parsed ${destinations.length} destinations from recommendation ${recommendationId}`);
    
    // Log parsed destinations for debugging
    console.log('Parsed destination data:');
    console.log(JSON.stringify(destinations, null, 2));
    
    // For each destination in the recommendation
    for (const destination of destinations) {
      // 1. Create destination record
      console.log('Inserting destination:', {
        name: destination.name,
        description: destination.description,
        recommendation_id: recommendationId,
        why_it_fits: destination.whyItFits
      });
      
      const { data: destinationData, error: destinationError } = await supabase
        .from('destinations')
        .insert([{
          name: destination.name,
          description: destination.description,
          recommendation_id: recommendationId,
          why_it_fits: destination.whyItFits
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
          console.log(`Inserting place: "${place}"`);
          
          const placeData = {
            name: place,
            destination_id: destinationId,
            description: "",
            created_at: new Date().toISOString()
          };
          
          console.log('Place data to insert:', placeData);
          
          const { data: placeResult, error: placeError } = await supabase
            .from('places_to_visit')
            .insert([placeData])
            .select('id');
          
          if (placeError) {
            console.error(`Error saving place "${place}":`, placeError);
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
          console.log(`Inserting restaurant: "${restaurant}"`);
          
          const restaurantData = {
            name: restaurant,
            destination_id: destinationId,
            type: "",
            price_range: "",
            description: "",
            created_at: new Date().toISOString()
          };
          
          console.log('Restaurant data to insert:', restaurantData);
          
          const { data: restaurantResult, error: restaurantError } = await supabase
            .from('restaurants')
            .insert([restaurantData])
            .select('id');
          
          if (restaurantError) {
            console.error(`Error saving restaurant "${restaurant}":`, restaurantError);
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
          console.log(`Inserting activity: "${activity}"`);
          
          const activityData = {
            name: activity,
            destination_id: destinationId,
            day_number: null,
            description: "",
            created_at: new Date().toISOString()
          };
          
          console.log('Activity data to insert:', activityData);
          
          const { data: activityResult, error: activityError } = await supabase
            .from('activities')
            .insert([activityData])
            .select('id');
          
          if (activityError) {
            console.error(`Error saving activity "${activity}":`, activityError);
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
          console.log(`Inserting accommodation: "${accommodation}"`);
          
          const accommodationData = {
            name: accommodation,
            destination_id: destinationId,
            type: "",
            price_range: "",
            description: "",
            created_at: new Date().toISOString()
          };
          
          console.log('Accommodation data to insert:', accommodationData);
          
          const { data: accommodationResult, error: accommodationError } = await supabase
            .from('accommodations')
            .insert([accommodationData])
            .select('id');
          
          if (accommodationError) {
            console.error(`Error saving accommodation "${accommodation}":`, accommodationError);
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

// Sample recommendation text (simplified)
const sampleRecommendation = `1. **Barcelona, Spain**
A vibrant coastal city combining stunning architecture, delicious cuisine, and beautiful beaches.

- Why This Fits Your Preferences:
  Barcelona offers a perfect blend of cultural experiences and culinary delights.

- Places to Visit:
  • Sagrada Familia - Gaudí's unfinished masterpiece
  • Park Güell - A whimsical park

- Restaurants You Should Try:
  • Can Solé - A historic establishment
  • Bar Cañete - Popular tapas bar

- Activities for Your Trip:
  • Take a guided walking tour
  • Enjoy a sunset sailing trip

- Accommodation Recommendations:
  • Hotel 1898 - Elegant hotel
  • H10 Casa Mimosa - Boutique hotel

2. **Kyoto, Japan**
A city of ancient temples and traditional gardens.

- Why This Fits Your Preferences:
  Kyoto offers an immersive cultural experience.

- Places to Visit:
  • Fushimi Inari Shrine - Famous for torii gates
  • Arashiyama Bamboo Grove - A magical path

- Restaurants You Should Try:
  • Nishiki Market - Called "Kyoto's Kitchen"
  • Pontocho Alley - A narrow lane

- Activities for Your Trip:
  • Participate in a traditional tea ceremony
  • Rent a kimono

- Accommodation Recommendations:
  • Hoshinoya Kyoto - Luxurious ryokan
  • Hotel Kanra Kyoto - Modern hotel`;

async function runTest() {
  try {
    console.log('Testing full recommendation flow...');
    
    // 1. Save test recommendation to llm_results
    const { data: llmResult, error: llmError } = await supabase
      .from('llm_results')
      .insert({
        content: sampleRecommendation,
        type: 'travel-recommendation',
        metadata: { test: true }
      })
      .select('id');
    
    if (llmError) {
      console.error('Error saving to llm_results:', llmError);
      return;
    }
    
    console.log('Saved test recommendation to llm_results:', llmResult[0].id);
    
    // 2. Process the recommendation
    const success = await saveStructuredRecommendationData(sampleRecommendation, llmResult[0].id);
    
    if (success) {
      console.log('Test completed successfully');
    } else {
      console.error('Test failed');
    }
  } catch (error) {
    console.error('Error running test:', error);
  }
}

runTest(); 