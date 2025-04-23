import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// Fetch all recommendations from database
export async function GET(request: NextRequest) {
  try {
    // Get user_identifier from query params if available
    const searchParams = request.nextUrl.searchParams;
    const user_identifier = searchParams.get('user_identifier');
    const id = searchParams.get('id');
    
    let query = supabase
      .from('llm_results')
      .select('*')
      .eq('type', 'travel-recommendation')
      .order('created_at', { ascending: false });
    
    // Filter by user_identifier if provided
    if (user_identifier) {
      query = query.eq('user_identifier', user_identifier);
    }
    
    // Get a specific recommendation by ID if provided
    if (id) {
      query = query.eq('id', id);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching recommendations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch recommendations' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ recommendations: data });
  } catch (error) {
    console.error('Error in recommendations API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// Create a new recommendation
export async function POST(request: NextRequest) {
  try {
    const { content, type, metadata } = await request.json();
    
    // Validate required fields
    if (!content) {
      return NextResponse.json(
        { error: 'Recommendation content is required' },
        { status: 400 }
      );
    }

    // Create unique ID for the recommendation
    const recommendationId = uuidv4();
    
    // Generate prompt from metadata if available
    const prompt = metadata?.original_prompt || 'Travel recommendation generated';
    
    // Insert the recommendation into the database
    const { data, error } = await supabase
      .from('llm_results')
      .insert({
        id: recommendationId,
        prompt: prompt,
        result: content,
        type: 'travel_recommendation', // Match the default type in the schema
        user_id: null, // Will be populated if user authentication is implemented
        is_saved: true // Mark as saved since we're explicitly saving it
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating recommendation:', error);
      return NextResponse.json(
        { error: 'Failed to create recommendation' },
        { status: 500 }
      );
    }
    
    // If metadata contains destinations, save them to the destinations table
    if (metadata?.destinations && Array.isArray(metadata.destinations)) {
      // Process each destination
      for (const dest of metadata.destinations) {
        // Insert destination with basic info
        const { data: destData, error: destError } = await supabase
          .from('destinations')
          .insert({
            id: uuidv4(),
            recommendation_id: recommendationId,
            name: dest.name,
            description: dest.description || '',
            country: dest.name.split(',').length > 1 ? dest.name.split(',')[1].trim() : null,
            region: null, // Could be extracted with more complex parsing
            budget_range: metadata?.preferences?.budget || null
          })
          .select()
          .single();
        
        if (destError) {
          console.error('Error saving destination:', destError);
          continue; // Try next destination
        }
        
        // If successful and we have the destination ID
        if (destData && destData.id) {
          const destId = destData.id;
          
          // Parse and save places to visit
          if (dest.placesToVisit) {
            try {
              const places = dest.placesToVisit.split('\n')
                .filter((place: string) => place.trim().length > 0)
                .map((place: string) => {
                  return {
                    id: uuidv4(),
                    destination_id: destId,
                    name: place.replace(/^\d+\.\s*/, '').split(' - ')[0].trim(),
                    description: place.includes(' - ') ? place.split(' - ').slice(1).join(' - ').trim() : '',
                    type: 'attraction'
                  };
                });
              
              if (places.length > 0) {
                const { error: placesError } = await supabase
                  .from('places_to_visit')
                  .insert(places);
                
                if (placesError) {
                  console.error('Error saving places to visit:', placesError);
                }
              }
            } catch (err) {
              console.error('Error parsing places to visit:', err);
            }
          }
          
          // Parse and save restaurants
          if (dest.restaurants) {
            try {
              const restaurants = dest.restaurants.split('\n')
                .filter((restaurant: string) => restaurant.trim().length > 0)
                .map((restaurant: string) => {
                  return {
                    id: uuidv4(),
                    destination_id: destId,
                    name: restaurant.replace(/^\d+\.\s*/, '').split(' - ')[0].trim(),
                    description: restaurant.includes(' - ') ? restaurant.split(' - ').slice(1).join(' - ').trim() : '',
                    cuisine_type: null // Would need more complex NLP to extract this
                  };
                });
              
              if (restaurants.length > 0) {
                const { error: restaurantsError } = await supabase
                  .from('restaurants')
                  .insert(restaurants);
                
                if (restaurantsError) {
                  console.error('Error saving restaurants:', restaurantsError);
                }
              }
            } catch (err) {
              console.error('Error parsing restaurants:', err);
            }
          }
          
          // Parse and save activities
          if (dest.activities) {
            try {
              const activities = dest.activities.split('\n')
                .filter((activity: string) => activity.trim().length > 0)
                .map((activity: string) => {
                  return {
                    id: uuidv4(),
                    destination_id: destId,
                    name: activity.replace(/^\d+\.\s*/, '').split(' - ')[0].trim(),
                    description: activity.includes(' - ') ? activity.split(' - ').slice(1).join(' - ').trim() : '',
                    type: 'activity'
                  };
                });
              
              if (activities.length > 0) {
                const { error: activitiesError } = await supabase
                  .from('activities')
                  .insert(activities);
                
                if (activitiesError) {
                  console.error('Error saving activities:', activitiesError);
                }
              }
            } catch (err) {
              console.error('Error parsing activities:', err);
            }
          }
          
          // Parse and save accommodations
          if (dest.accommodations) {
            try {
              const accommodations = dest.accommodations.split('\n')
                .filter((accommodation: string) => accommodation.trim().length > 0)
                .map((accommodation: string) => {
                  return {
                    id: uuidv4(),
                    destination_id: destId,
                    name: accommodation.replace(/^\d+\.\s*/, '').split(' - ')[0].trim(),
                    description: accommodation.includes(' - ') ? accommodation.split(' - ').slice(1).join(' - ').trim() : '',
                    type: accommodation.toLowerCase().includes('hotel') ? 'hotel' : 
                          accommodation.toLowerCase().includes('resort') ? 'resort' :
                          accommodation.toLowerCase().includes('hostel') ? 'hostel' : 'accommodation'
                  };
                });
              
              if (accommodations.length > 0) {
                const { error: accommodationsError } = await supabase
                  .from('accommodations')
                  .insert(accommodations);
                
                if (accommodationsError) {
                  console.error('Error saving accommodations:', accommodationsError);
                }
              }
            } catch (err) {
              console.error('Error parsing accommodations:', err);
            }
          }
        }
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      recommendation: data,
      message: 'Recommendation created successfully'
    });
  } catch (error: any) {
    console.error('Error in create recommendation API:', error);
    return NextResponse.json(
      { error: `An unexpected error occurred: ${error.message}` },
      { status: 500 }
    );
  }
}

// Delete a recommendation and all its associated data
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Recommendation ID is required' },
        { status: 400 }
      );
    }

    console.log(`Starting deletion process for recommendation ID: ${id}`);

    // Check if the recommendation exists
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
      console.log(`Recommendation ID ${id} not found`);
      return NextResponse.json(
        { error: 'Recommendation not found' },
        { status: 404 }
      );
    }

    // First, manually delete all associated destinations to handle missing cascade constraints
    console.log('Attempting to delete associated destinations...');
    const { error: destDeleteError } = await supabase
      .from('destinations')
      .delete()
      .eq('recommendation_id', id);
    
    if (destDeleteError) {
      console.error('Error deleting associated destinations:', destDeleteError);
      // Continue with deletion anyway - the destinations might not exist
    }

    // Finally delete the recommendation itself
    console.log('Deleting recommendation record...');
    const { error: recDeleteError } = await supabase
      .from('llm_results')
      .delete()
      .eq('id', id);

    if (recDeleteError) {
      console.error('Error deleting recommendation:', recDeleteError);
      return NextResponse.json(
        { error: `Failed to delete recommendation: ${recDeleteError.message}` },
        { status: 500 }
      );
    }
    
    console.log(`Successfully deleted recommendation ID: ${id}`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in delete recommendation API:', error);
    return NextResponse.json(
      { error: `An unexpected error occurred: ${error.message}` },
      { status: 500 }
    );
  }
} 