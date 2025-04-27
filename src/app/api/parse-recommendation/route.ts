import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting parse-recommendation API request');
    // Parse request body
    let body;
    try {
      body = await request.json();
      console.log('Request body parsed successfully');
    } catch (error) {
      console.error('Failed to parse request body:', error);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    const { id, content } = body;
    console.log(`Processing recommendation ID: ${id.substring(0, 8)}...`);
    
    // Validate required fields
    if (!id) {
      console.log('Missing recommendation ID');
      return NextResponse.json(
        { error: 'Recommendation ID is required' },
        { status: 400 }
      );
    }
    
    if (!content) {
      console.log('Missing recommendation content');
      return NextResponse.json(
        { error: 'Recommendation content is required' },
        { status: 400 }
      );
    }

    // Check if recommendation exists
    console.log('Checking if recommendation exists in database');
    const { data: existingRec, error: checkError } = await supabase
      .from('llm_results')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking recommendation:', checkError);
      return NextResponse.json(
        { error: `Database error when checking recommendation: ${checkError.message}` },
        { status: 500 }
      );
    }

    if (!existingRec) {
      console.log('Recommendation not found in database');
      return NextResponse.json(
        { error: 'Recommendation not found' },
        { status: 404 }
      );
    }
    
    console.log('Recommendation found, proceeding with parsing');

    try {
      // Use OpenAI to parse the content
      console.log('Sending content to OpenAI for parsing');
      const parsedData = await parseRecommendationWithOpenAI(content);
      console.log('OpenAI parsing successful, received data:', JSON.stringify(parsedData).substring(0, 200) + '...');
      
      // Delete existing parsed data for this recommendation
      console.log('Deleting any existing parsed data for this recommendation');
      await deleteExistingParsedData(id);
      console.log('Existing data deleted successfully');
      
      // Save the parsed data to database
      console.log('Saving parsed data to database');
      await saveRecommendationData(id, parsedData);
      console.log('Data saved successfully to database');
      
      return NextResponse.json({ 
        success: true, 
        message: 'Recommendation parsed and saved successfully',
        destinations: parsedData
      });
    } catch (parsingError: any) {
      console.error('Error in parsing or saving recommendation:', parsingError);
      return NextResponse.json(
        { error: `Error parsing recommendation: ${parsingError.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in parse recommendation API:', error);
    return NextResponse.json(
      { error: `An unexpected error occurred: ${error.message}` },
      { status: 500 }
    );
  }
}

// Parse recommendation with OpenAI
async function parseRecommendationWithOpenAI(content: string) {
  try {
    console.log('Starting OpenAI parsing');
    // Send content to OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a travel data extraction system. Extract structured data from travel recommendations. Parse the text into a JSON array following this EXACT structure:

{
  "destinations": [
    {
      "name": "City name, Country",
      "description": "Brief description of the destination",
      "whyFits": "Why this destination fits the user preferences",
      "placesToVisit": [
        {
          "name": "Place name",
          "description": "Description of the place" 
        }
      ],
      "restaurants": [
        {
          "name": "Restaurant name", 
          "description": "Description with cuisine details"
        }
      ],
      "activities": [
        {
          "name": "Activity name",
          "description": "Description of the activity"
        }
      ],
      "accommodations": [
        {
          "name": "Accommodation name",
          "description": "Description of the accommodation",
          "type": "hotel/resort/hostel/etc"
        }
      ]
    }
  ]
}

Important notes:
1. Your response MUST be a valid JSON object with a "destinations" array
2. Use "placesToVisit" (camelCase) not "places_to_visit"
3. The "whyFits" field is REQUIRED - extract any information about why the destination matches user preferences
4. Ensure all sections are properly parsed as arrays of objects, even if there's only one item per section
5. Try to distinguish accommodation types (hotel, resort, hostel, etc.) based on context clues
6. For restaurants, try to identify cuisine types from descriptions`
          },
          {
            role: "user",
            content: content
          }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API returned an error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    console.log('Received response from OpenAI');
    const data = await response.json();
    const contentStr = data.choices[0].message.content;
    console.log('OpenAI response content:', contentStr.substring(0, 200) + '...');
    
    // Parse the content string to JSON
    let parsedContent;
    try {
      parsedContent = JSON.parse(contentStr);
      console.log('Successfully parsed OpenAI response as JSON');
    } catch (e) {
      console.error('Failed to parse OpenAI response as JSON:', contentStr);
      throw new Error('Invalid JSON response from OpenAI');
    }
    
    // Check if the response has a destinations array, if so use that
    if (parsedContent.destinations && Array.isArray(parsedContent.destinations)) {
      console.log('Found destinations array in response, using it');
      return parsedContent.destinations;
    }
    
    // If the response is directly an array, use it
    if (Array.isArray(parsedContent)) {
      console.log('Response is directly an array, using it');
      return parsedContent;
    }
    
    // If we got here, the format is unexpected
    console.error('Unexpected response format from OpenAI:', parsedContent);
    throw new Error('Response format from OpenAI is not as expected. Expected an array or an object with destinations array.');
  } catch (error) {
    console.error('Error parsing with OpenAI:', error);
    throw error;
  }
}

// Delete existing parsed data for a recommendation
async function deleteExistingParsedData(recommendationId: string) {
  try {
    console.log('Starting deletion of existing parsed data');
    // First get all destinations for this recommendation
    const { data: destinations, error: destFetchError } = await supabase
      .from('destinations')
      .select('id')
      .eq('recommendation_id', recommendationId);
    
    if (destFetchError) {
      console.error('Error fetching destinations:', destFetchError);
      return;
    }
    
    console.log(`Found ${destinations?.length || 0} existing destinations to delete`);
    
    if (destinations && destinations.length > 0) {
      const destinationIds = destinations.map(d => d.id);
      
      // Delete all related records in child tables
      for (const destId of destinationIds) {
        console.log(`Deleting related data for destination ${destId.substring(0, 8)}...`);
        // Delete places to visit
        const { error: placesError } = await supabase
          .from('places_to_visit')
          .delete()
          .eq('destination_id', destId);
        
        if (placesError) {
          console.error(`Error deleting places for destination ${destId}:`, placesError);
        }
        
        // Delete restaurants
        const { error: restaurantsError } = await supabase
          .from('restaurants')
          .delete()
          .eq('destination_id', destId);
        
        if (restaurantsError) {
          console.error(`Error deleting restaurants for destination ${destId}:`, restaurantsError);
        }
        
        // Delete activities
        const { error: activitiesError } = await supabase
          .from('activities')
          .delete()
          .eq('destination_id', destId);
        
        if (activitiesError) {
          console.error(`Error deleting activities for destination ${destId}:`, activitiesError);
        }
        
        // Delete accommodations
        const { error: accommodationsError } = await supabase
          .from('accommodations')
          .delete()
          .eq('destination_id', destId);
        
        if (accommodationsError) {
          console.error(`Error deleting accommodations for destination ${destId}:`, accommodationsError);
        }
      }
    }
    
    // Finally delete all destinations
    const { error: destDeleteError } = await supabase
      .from('destinations')
      .delete()
      .eq('recommendation_id', recommendationId);
    
    if (destDeleteError) {
      console.error('Error deleting destinations:', destDeleteError);
    }
    
    console.log('Successfully deleted all existing parsed data');
      
  } catch (error) {
    console.error('Error deleting existing parsed data:', error);
    throw error;
  }
}

// Save recommendation data to database
async function saveRecommendationData(recommendationId: string, parsedData: any) {
  try {
    console.log('Starting to save recommendation data to database');
    // Ensure parsedData is iterable
    if (!parsedData || !Array.isArray(parsedData)) {
      console.error('Invalid parsedData format, expected an array:', parsedData);
      throw new Error('parsedData is not iterable');
    }
    
    if (parsedData.length === 0) {
      console.warn('No destinations found in parsed data');
    }
    
    console.log(`Processing ${parsedData.length} destinations`);
    
    // Process each destination
    for (const dest of parsedData) {
      // Ensure destination has required fields
      if (!dest || typeof dest !== 'object' || !dest.name) {
        console.warn('Skipping invalid destination:', dest);
        continue;
      }
      
      console.log(`Processing destination: ${dest.name}`);
      
      // Extract country from destination name if possible
      const nameParts = dest.name.split(',');
      const country = nameParts.length > 1 ? nameParts[1].trim() : null;
      
      // Insert destination with basic info
      console.log('Inserting destination into database');
      const destId = uuidv4();
      const { data: destData, error: destError } = await supabase
        .from('destinations')
        .insert({
          id: destId,
          recommendation_id: recommendationId,
          name: dest.name,
          description: dest.description || '',
          country: country,
          region: null, // Could be extracted with more complex parsing
          budget_range: null,
          why_it_fits: dest.whyFits || ''
        })
        .select()
        .single();
      
      if (destError) {
        console.error('Error saving destination:', destError);
        continue; // Try next destination
      }
      
      // If successful and we have the destination ID
      if (destData) {
        console.log(`Destination saved with ID: ${destData.id.substring(0, 8)}...`);
        
        // Handle different field name conventions from OpenAI
        // Sometimes OpenAI returns placesToVisit, sometimes places_to_visit
        const placesToVisit = dest.placesToVisit || dest.places_to_visit;
        
        // Save places to visit
        if (placesToVisit && Array.isArray(placesToVisit)) {
          console.log(`Saving ${placesToVisit.length} places to visit`);
          const places = placesToVisit.map((place: any) => ({
            id: uuidv4(),
            destination_id: destData.id,
            name: place.name,
            description: place.description || '',
            type: 'attraction'
          }));
          
          if (places.length > 0) {
            const { error: placesError } = await supabase
              .from('places_to_visit')
              .insert(places);
            
            if (placesError) {
              console.error('Error saving places to visit:', placesError);
            } else {
              console.log(`Successfully saved ${places.length} places to visit`);
            }
          }
        }
        
        // Save restaurants
        if (dest.restaurants && Array.isArray(dest.restaurants)) {
          console.log(`Saving ${dest.restaurants.length} restaurants`);
          const restaurants = dest.restaurants.map((restaurant: any) => {
            // Try to extract cuisine type from description
            let cuisineType: string | null = null;
            if (restaurant.description) {
              // Look for common cuisine indicators in the description
              const cuisines = ['Italian', 'French', 'Chinese', 'Japanese', 'Mexican', 'Thai', 'Indian', 'Mediterranean', 'Middle Eastern', 'American', 'Seafood', 'Vegetarian', 'Vegan'];
              for (const cuisine of cuisines) {
                if (restaurant.description.includes(cuisine)) {
                  cuisineType = cuisine;
                  break;
                }
              }
            }
            
            return {
              id: uuidv4(),
              destination_id: destData.id,
              name: restaurant.name,
              description: restaurant.description || '',
              cuisine_type: cuisineType
            };
          });
          
          if (restaurants.length > 0) {
            const { error: restaurantsError } = await supabase
              .from('restaurants')
              .insert(restaurants);
            
            if (restaurantsError) {
              console.error('Error saving restaurants:', restaurantsError);
            } else {
              console.log(`Successfully saved ${restaurants.length} restaurants`);
            }
          }
        }
        
        // Save activities
        if (dest.activities && Array.isArray(dest.activities)) {
          console.log(`Saving ${dest.activities.length} activities`);
          const activities = dest.activities.map((activity: any) => ({
            id: uuidv4(),
            destination_id: destData.id,
            name: activity.name,
            description: activity.description || '',
            type: 'activity'
          }));
          
          if (activities.length > 0) {
            const { error: activitiesError } = await supabase
              .from('activities')
              .insert(activities);
            
            if (activitiesError) {
              console.error('Error saving activities:', activitiesError);
            } else {
              console.log(`Successfully saved ${activities.length} activities`);
            }
          }
        }
        
        // Handle different field name conventions from OpenAI
        const accommodations = dest.accommodations || dest.accommodation;
        
        // Save accommodations
        if (accommodations && Array.isArray(accommodations)) {
          console.log(`Saving ${accommodations.length} accommodations`);
          const accommodationsData = accommodations.map((accommodation: any) => ({
            id: uuidv4(),
            destination_id: destData.id,
            name: accommodation.name,
            description: accommodation.description || '',
            type: accommodation.type || 'accommodation'
          }));
          
          if (accommodationsData.length > 0) {
            const { error: accommodationsError } = await supabase
              .from('accommodations')
              .insert(accommodationsData);
            
            if (accommodationsError) {
              console.error('Error saving accommodations:', accommodationsError);
            } else {
              console.log(`Successfully saved ${accommodationsData.length} accommodations`);
            }
          }
        }
      }
    }
    
    // Mark the original recommendation as saved and parsed
    console.log('Updating recommendation as saved and parsed');
    const { error: updateError } = await supabase
      .from('llm_results')
      .update({ is_saved: true, is_parsed: true })
      .eq('id', recommendationId);
      
    if (updateError) {
      console.error('Error updating recommendation status:', updateError);
    } else {
      console.log('Successfully updated recommendation as saved and parsed');
    }
      
  } catch (error) {
    console.error('Error saving recommendation data:', error);
    throw error;
  }
} 