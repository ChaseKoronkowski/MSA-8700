import { SupabaseClient } from '@supabase/supabase-js';
import { parseRecommendation } from './parseRecommendation';

// Parse and store LLM result components in separate tables
export async function parseLLMResult(
  supabase: SupabaseClient<any>,
  llmResultId: string,
  llmResultContent: string
) {
  try {
    // First try to parse as JSON, if it fails, use the text parser
    let parsedResult;
    let destinations = [];
    
    try {
      // Try to parse as JSON first
      parsedResult = JSON.parse(llmResultContent);
      
      // Single destination format
      if (parsedResult.destinationName || parsedResult.destination) {
        return await saveStructuredDestination(supabase, llmResultId, parsedResult);
      } 
      // Multiple destinations in array format
      else if (Array.isArray(parsedResult) && parsedResult.length > 0) {
        // Process the first destination for now
        return await saveStructuredDestination(supabase, llmResultId, parsedResult[0]);
      }
    } catch (jsonError) {
      console.log('Not a JSON format, trying text parsing...');
      // If JSON parsing failed, try to parse the text format
      destinations = parseRecommendation(llmResultContent);
      
      if (destinations.length > 0) {
        return await saveStructuredRecommendationData(supabase, llmResultId, destinations);
      }
    }
    
    throw new Error('Could not parse LLM result into a known format');
  } catch (error) {
    console.error('Error parsing LLM result:', error);
    return { success: false, error };
  }
}

// Save a structured destination from JSON format
async function saveStructuredDestination(
  supabase: SupabaseClient<any>,
  llmResultId: string,
  parsedResult: any
) {
  // First, create the destination record
  const { data: destinationData, error: destinationError } = await supabase
    .from('destinations')
    .insert({
      recommendation_id: llmResultId,
      name: parsedResult.destinationName || parsedResult.destination || parsedResult.name,
      description: parsedResult.description || "",
      country: parsedResult.country || "",
      region: parsedResult.region || "",
      why_it_fits: parsedResult.whyItFits || parsedResult.why_it_fits || ""
    })
    .select()
    .single();
  
  if (destinationError) {
    console.error('Error creating destination:', destinationError);
    return { success: false, error: destinationError };
  }
  
  const destinationId = destinationData.id;
  
  // Process places to visit
  if (parsedResult.placesToVisit && Array.isArray(parsedResult.placesToVisit)) {
    await savePlacesToVisit(supabase, destinationId, parsedResult.placesToVisit);
  }
  
  // Process restaurants
  if (parsedResult.restaurants && Array.isArray(parsedResult.restaurants)) {
    await saveRestaurants(supabase, destinationId, parsedResult.restaurants);
  }
  
  // Process activities
  if (parsedResult.activities && Array.isArray(parsedResult.activities)) {
    await saveActivities(supabase, destinationId, parsedResult.activities);
  }
  
  // Process accommodations
  if (parsedResult.accommodations && Array.isArray(parsedResult.accommodations)) {
    await saveAccommodations(supabase, destinationId, parsedResult.accommodations);
  }
  
  return { success: true, destinationId };
}

// Save places to visit
async function savePlacesToVisit(
  supabase: SupabaseClient<any>,
  destinationId: string,
  places: any[]
) {
  for (const place of places) {
    // Handle both string items and object items
    if (typeof place === 'string') {
      await supabase.from('places_to_visit').insert({
        destination_id: destinationId,
        name: place,
        description: "",
        created_at: new Date().toISOString()
      });
    } else {
      await supabase.from('places_to_visit').insert({
        destination_id: destinationId,
        name: place.name,
        description: place.description || "",
        created_at: new Date().toISOString()
      });
    }
  }
}

// Save restaurants
async function saveRestaurants(
  supabase: SupabaseClient<any>,
  destinationId: string,
  restaurants: any[]
) {
  for (const restaurant of restaurants) {
    // Handle both string items and object items
    if (typeof restaurant === 'string') {
      await supabase.from('restaurants').insert({
        destination_id: destinationId,
        name: restaurant,
        type: "",
        price_range: "",
        description: "",
        created_at: new Date().toISOString()
      });
    } else {
      await supabase.from('restaurants').insert({
        destination_id: destinationId,
        name: restaurant.name,
        type: restaurant.cuisineType || restaurant.cuisine_type || "",
        price_range: restaurant.priceRange || restaurant.price_range || "",
        description: restaurant.description || "",
        created_at: new Date().toISOString()
      });
    }
  }
}

// Save activities
async function saveActivities(
  supabase: SupabaseClient<any>,
  destinationId: string,
  activities: any[]
) {
  for (const activity of activities) {
    // Handle both string items and object items
    if (typeof activity === 'string') {
      await supabase.from('activities').insert({
        destination_id: destinationId,
        name: activity,
        day_number: null,
        description: "",
        created_at: new Date().toISOString()
      });
    } else {
      await supabase.from('activities').insert({
        destination_id: destinationId,
        name: activity.name,
        day_number: activity.day_number || activity.dayNumber || null,
        description: activity.description || "",
        created_at: new Date().toISOString()
      });
    }
  }
}

// Save accommodations
async function saveAccommodations(
  supabase: SupabaseClient<any>,
  destinationId: string,
  accommodations: any[]
) {
  for (const accommodation of accommodations) {
    // Handle both string items and object items
    if (typeof accommodation === 'string') {
      await supabase.from('accommodations').insert({
        destination_id: destinationId,
        name: accommodation,
        type: "",
        price_range: "",
        description: "",
        created_at: new Date().toISOString()
      });
    } else {
      await supabase.from('accommodations').insert({
        destination_id: destinationId,
        name: accommodation.name,
        type: accommodation.type || "",
        price_range: accommodation.priceRange || accommodation.price_range || "",
        description: accommodation.description || "",
        created_at: new Date().toISOString()
      });
    }
  }
}

// Function to save structured recommendation data to database
async function saveStructuredRecommendationData(
  supabase: SupabaseClient<any>,
  llmResultId: string,
  destinations: any[]
) {
  try {
    // Track the first destination ID to return
    let firstDestinationId = null;
    
    // For each destination in the recommendation
    for (const destination of destinations) {
      // 1. Create destination record
      const { data: destinationData, error: destinationError } = await supabase
        .from('destinations')
        .insert([{
          name: destination.name,
          description: destination.description,
          recommendation_id: llmResultId,
          why_it_fits: destination.whyItFits
        }])
        .select('id');
      
      if (destinationError) {
        console.error('Error saving destination:', destinationError);
        continue;
      }
      
      if (!destinationData || destinationData.length === 0) {
        console.error('No destination ID returned');
        continue;
      }
      
      const destinationId = destinationData[0].id;
      
      // Store the first destination ID
      if (!firstDestinationId) {
        firstDestinationId = destinationId;
      }
      
      // 2. Save places to visit
      if (destination.placesToVisit && destination.placesToVisit.length > 0) {
        for (const place of destination.placesToVisit) {
          await supabase.from('places_to_visit').insert({
            destination_id: destinationId,
            name: place,
            description: "",
            created_at: new Date().toISOString()
          });
        }
      }
      
      // 3. Save restaurants
      if (destination.restaurants && destination.restaurants.length > 0) {
        for (const restaurant of destination.restaurants) {
          await supabase.from('restaurants').insert({
            destination_id: destinationId,
            name: restaurant,
            type: "",
            price_range: "",
            description: "",
            created_at: new Date().toISOString()
          });
        }
      }
      
      // 4. Save activities
      if (destination.activities && destination.activities.length > 0) {
        for (const activity of destination.activities) {
          await supabase.from('activities').insert({
            destination_id: destinationId,
            name: activity,
            day_number: null,
            description: "",
            created_at: new Date().toISOString()
          });
        }
      }
      
      // 5. Save accommodations
      if (destination.accommodations && destination.accommodations.length > 0) {
        for (const accommodation of destination.accommodations) {
          await supabase.from('accommodations').insert({
            destination_id: destinationId,
            name: accommodation,
            type: "",
            price_range: "",
            description: "",
            created_at: new Date().toISOString()
          });
        }
      }
    }
    
    console.log(`Successfully saved structured data for recommendation ${llmResultId}`);
    return { success: true, destinationId: firstDestinationId };
  } catch (error) {
    console.error('Error in saveStructuredRecommendationData:', error);
    return { success: false, error };
  }
} 