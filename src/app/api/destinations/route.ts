import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const recommendationId = searchParams.get('recommendation_id');
    const id = searchParams.get('id');
    
    console.log(`Fetching destinations with: recommendationId=${recommendationId}, id=${id}`);
    
    // First, verify if the columns we need exist
    const { data: columnInfo, error: columnError } = await supabase
      .from('destinations')
      .select('id')
      .limit(1);
      
    if (columnError) {
      console.error('Error checking destinations table:', columnError);
      return NextResponse.json(
        { error: `Database error: ${columnError.message}` },
        { status: 500 }
      );
    }
    
    // Construct a simpler query that's less likely to fail
    let query = supabase.from('destinations').select('id, name, description, recommendation_id, why_it_fits');
    
    if (recommendationId) {
      query = query.eq('recommendation_id', recommendationId);
    }
    
    if (id) {
      query = query.eq('id', id);
    }
    
    // Execute the main query to get destinations
    const { data: destinations, error: destinationsError } = await query;
    
    if (destinationsError) {
      console.error('Error fetching destinations:', destinationsError);
      return NextResponse.json(
        { error: `Failed to fetch destinations: ${destinationsError.message}` },
        { status: 500 }
      );
    }
    
    if (!destinations || destinations.length === 0) {
      console.log('No destinations found for the given criteria');
      return NextResponse.json({ destinations: [] });
    }
    
    // For each destination, fetch its related data separately
    const destinationIds = destinations.map(dest => dest.id);
    console.log(`Found ${destinationIds.length} destinations, fetching related data...`);
    
    try {
      // Fetch places to visit
      const { data: placesToVisit, error: placesError } = await supabase
        .from('places_to_visit')
        .select('id, name, destination_id')
        .in('destination_id', destinationIds);
        
      if (placesError) {
        console.error('Error fetching places to visit:', placesError);
      }
      
      // Fetch restaurants
      const { data: restaurants, error: restaurantsError } = await supabase
        .from('restaurants')
        .select('id, name, destination_id')
        .in('destination_id', destinationIds);
        
      if (restaurantsError) {
        console.error('Error fetching restaurants:', restaurantsError);
      }
      
      // Fetch activities
      const { data: activities, error: activitiesError } = await supabase
        .from('activities')
        .select('id, name, destination_id')
        .in('destination_id', destinationIds);
        
      if (activitiesError) {
        console.error('Error fetching activities:', activitiesError);
      }
      
      // Fetch accommodations
      const { data: accommodations, error: accommodationsError } = await supabase
        .from('accommodations')
        .select('id, name, destination_id')
        .in('destination_id', destinationIds);
        
      if (accommodationsError) {
        console.error('Error fetching accommodations:', accommodationsError);
      }
      
      // Merge the data together
      const enrichedDestinations = destinations.map(destination => {
        return {
          ...destination,
          places_to_visit: (placesToVisit || []).filter(place => place.destination_id === destination.id),
          restaurants: (restaurants || []).filter(restaurant => restaurant.destination_id === destination.id),
          activities: (activities || []).filter(activity => activity.destination_id === destination.id),
          accommodations: (accommodations || []).filter(accommodation => accommodation.destination_id === destination.id)
        };
      });
      
      console.log(`Successfully enriched ${enrichedDestinations.length} destinations with related data`);
      return NextResponse.json({ destinations: enrichedDestinations });
      
    } catch (relatedDataError: any) {
      console.error('Error fetching related data:', relatedDataError);
      // Return the destinations without related data rather than failing completely
      return NextResponse.json({ 
        destinations: destinations,
        warning: "Could not fetch related data: " + relatedDataError.message
      });
    }
  } catch (error: any) {
    console.error('Error in destinations API:', error);
    return NextResponse.json(
      { error: `An unexpected error occurred: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { name, description, recommendation_id, why_it_fits } = await req.json();

    if (!name || !recommendation_id) {
      return NextResponse.json(
        { error: 'Name and recommendation_id are required' },
        { status: 400 }
      );
    }

    console.log(`Creating destination for recommendation: ${recommendation_id}`);
    
    const { data: destination, error } = await supabase
      .from('destinations')
      .insert({
        name,
        description: description || '',
        recommendation_id,
        why_it_fits: why_it_fits || ''
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating destination:', error);
      return NextResponse.json(
        { error: `Failed to create destination: ${error.message}` },
        { status: 500 }
      );
    }

    console.log(`Successfully created destination with ID: ${destination.id}`);
    return NextResponse.json(destination);
  } catch (error: any) {
    console.error('Error creating destination:', error);
    return NextResponse.json(
      { error: `Failed to create destination: ${error.message}` },
      { status: 500 }
    );
  }
} 