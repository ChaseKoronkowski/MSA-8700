import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/lib/supabase';

// Check if API key is valid or the placeholder
const apiKey = process.env.OPENAI_API_KEY || '';
const isValidApiKey = apiKey && apiKey !== 'your-api-key-here';

// Initialize OpenAI client if API key is valid
const openai = isValidApiKey 
  ? new OpenAI({ apiKey }) 
  : null;

export async function POST(request: Request) {
  try {
    const { recommendationData, user_identifier } = await request.json();
    
    if (!recommendationData) {
      return NextResponse.json(
        { error: 'Recommendation data is required' },
        { status: 400 }
      );
    }
    
    let routePlan: string;
    
    // If API key is not valid, return a demo response
    if (!isValidApiKey) {
      console.warn('Using demo response because OpenAI API key is not configured');
      routePlan = generateDemoRoutePlan();
    } else {
      // Create prompt for OpenAI based on recommendation data
      const prompt = `Based on the following travel recommendation details, create an optimized daily itinerary that efficiently routes between locations, minimizing travel time and maximizing experiences:

${recommendationData}

Create a detailed day-by-day plan with:
1. A logical sequence to visit attractions, considering proximity and opening hours
2. Suggested timing for each activity/place
3. Recommended transportation between locations
4. Meal breaks at suggested restaurants at appropriate times
5. Consider any specific accommodation locations when planning start/end points

Format the response as a detailed daily itinerary across all recommended days, with efficient routing between locations. Make it easy to follow with clear time blocks and directions.`;
      
      // Call OpenAI API with the prompt
      const response = await openai!.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a professional travel planner who specializes in creating optimized travel routes and itineraries that maximize efficiency and experience."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2500,
      });

      routePlan = response.choices[0].message.content || '';
    }

    // Save the LLM result to Supabase
    try {
      await supabase.from('llm_results').insert([
        {
          content: routePlan,
          type: 'route-plan',
          metadata: { recommendation_data: recommendationData },
          user_identifier: user_identifier || null,
        },
      ]);
    } catch (dbError) {
      console.error('Error saving route plan to database:', dbError);
      // Continue with the response even if saving fails
    }

    // Return the response
    return NextResponse.json({ routePlan });
  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate route plan' },
      { status: 500 }
    );
  }
}

// Provide a fallback demo response when API key is not available
function generateDemoRoutePlan(): string {
  return `# Berlin Optimized Travel Plan

## Day 1: Historical Berlin
**Morning**
* 9:00 AM - 10:30 AM: Brandenburg Gate exploration
  * Start your day at this iconic landmark
  * Take photos and learn about its historical significance
  * Transportation: Take U-Bahn to Brandenburger Tor station

* 10:45 AM - 12:30 PM: Checkpoint Charlie
  * Walk south from Brandenburg Gate (15 min walk)
  * Explore the museum and historical displays

**Lunch**
* 12:45 PM - 2:00 PM: Curry 36
  * Famous Berlin street food
  * Try the authentic currywurst
  * Short 10-minute walk from Checkpoint Charlie

**Afternoon**
* 2:30 PM - 5:00 PM: Museum Island
  * Take U-Bahn from Checkpoint Charlie to Museum Island (15 min)
  * Visit Pergamon Museum or Neues Museum
  * Allow 2-3 hours for museum exploration

**Evening**
* 6:30 PM - 8:30 PM: Dinner at Cookies Cream
  * Upscale vegetarian dining experience
  * Make reservations in advance
  * Take U-Bahn to Französische Straße station

**Night**
* Return to accommodation: Hüttenpalast
  * Take U-Bahn from Französische Straße to Hermannplatz
  * Short walk to the quirky indoor camping experience

## Day 2: Art & Culture Day
**Morning**
* 9:30 AM - 11:30 AM: East Side Gallery
  * Explore the longest remaining stretch of the Berlin Wall
  * View the colorful murals at a leisurely pace
  * Take U-Bahn to Warschauer Straße station

**Lunch**
* 12:00 PM - 1:30 PM: Mustafa's Gemüse Kebap
  * Popular Turkish-style kebabs
  * Might have a queue but worth the wait
  * 20-minute walk or short U-Bahn ride from East Side Gallery

**Afternoon**
* 2:00 PM - 5:00 PM: More art galleries
  * Visit Hamburger Bahnhof for contemporary art
  * Take U-Bahn from Kreuzberg to Hauptbahnhof

**Evening**
* 6:00 PM - 7:30 PM: Early dinner near Potsdamer Platz
  * Visit Sony Center for dining options
  * Take U-Bahn from Hauptbahnhof to Potsdamer Platz

* 8:00 PM onwards: Berlin nightlife experience
  * Visit Watergate club (if it's your scene)
  * Take U-Bahn/taxi to Kreuzberg area

## Day 3: Leisure Day
**Morning**
* 10:00 AM - 1:00 PM: Tiergarten Park
  * Perfect for autumn walks and relaxation
  * Rent a bike to explore the large park
  * Visit the Victory Column in the center
  * Take U-Bahn to Tiergarten station

**Lunch**
* 1:30 PM - 3:00 PM: Lunch near Tiergarten
  * Find a café along the park edges
  * Relax and refresh after morning activities

**Afternoon**
* 3:30 PM - 6:00 PM: Potsdamer Platz
  * Modern square with shopping and entertainment
  * Just a short walk from Tiergarten
  * Explore the Mall of Berlin if interested in shopping

**Evening**
* 7:00 PM - 9:00 PM: Dinner at upscale restaurant
  * Try another local favorite near your accommodation
  * Take U-Bahn back toward your accommodations

## Day 4: Day Trip to Potsdam
**Morning**
* 9:00 AM: Depart for Potsdam
  * Take RE train from Berlin Hauptbahnhof to Potsdam (30-40 mins)

* 10:00 AM - 1:00 PM: Sanssouci Palace and Gardens
  * UNESCO World Heritage Site
  * Allow plenty of time for the beautiful gardens

**Lunch**
* 1:30 PM - 2:30 PM: Lunch in Potsdam old town
  * Dutch Quarter has charming restaurants

**Afternoon**
* 3:00 PM - 5:00 PM: Explore Potsdam town center
  * Visit the Brandenburg Gate of Potsdam
  * Stroll through the historic center

**Evening**
* 6:00 PM: Return to Berlin
  * Take RE train back to Berlin

* 7:30 PM - 9:30 PM: Final dinner in Berlin
  * Try any restaurant from your recommendation list you haven't visited yet

## Transportation Tips:
* Purchase a Berlin WelcomeCard for unlimited public transportation and discounts
* U-Bahn and S-Bahn trains run frequently during the day (every 5-10 minutes)
* Consider using bike-sharing services for shorter distances in good weather
* Taxis/Uber are readily available but more expensive

## Accommodation: Hüttenpalast
* Central location makes it easy to start/end your days
* Close to public transportation
* Staff can help with directions and recommendations`;
} 