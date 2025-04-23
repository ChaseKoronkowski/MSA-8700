import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Check if API key is valid or the placeholder
const apiKey = process.env.OPENAI_API_KEY || '';
const isValidApiKey = apiKey && apiKey !== 'your-api-key-here';

// Initialize OpenAI client if API key is valid
const openai = isValidApiKey 
  ? new OpenAI({ apiKey }) 
  : null;

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }
    
    let content: string;
    
    // If API key is not valid, return a demo response
    if (!isValidApiKey) {
      console.warn('Using demo response because OpenAI API key is not configured');
      content = generateDemoResponse();
    } else {
      // Create a system prompt for itinerary generation
      const systemPrompt = `You are an expert travel planner. Create a detailed daily itinerary based on the user's preferences and available attractions. 
      Format the response as:
      
      Day 1:
      Morning: [Activities or places]
      Afternoon: [Activities or places]
      Evening: [Activities or places]
      
      Day 2:
      ... and so on.
      
      Make sure each day has a good balance of activities, not too crowded, and considers travel time between places.`;
      
      // Call OpenAI API with the prompt
      const response = await openai!.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      content = response.choices[0].message.content || '';
    }

    // Return the response
    return NextResponse.json({ 
      content
    });
  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate itinerary' },
      { status: 500 }
    );
  }
}

// Function to generate a demo response when API key is not available
function generateDemoResponse() {
  return `Day 1:
Morning: Start with breakfast at The Local Café, then visit the Main Museum to explore the city's history and culture.
Afternoon: Enjoy lunch at Seaside Restaurant with ocean views, followed by a walking tour of the Historic District.
Evening: Have dinner at The Gourmet Kitchen, then attend a local music performance at City Theater.

Day 2:
Morning: Take a morning hike at Nature Park, followed by brunch at Mountain View Café.
Afternoon: Visit the Art Gallery, then relax at Central Park with a picnic lunch.
Evening: Experience fine dining at Luxury Restaurant, followed by drinks at Skybar for panoramic night views.

Day 3:
Morning: Join a guided tour of the Ancient Ruins, then have breakfast at Heritage Café.
Afternoon: Go shopping at the Local Market for souvenirs, followed by lunch at Traditional Eatery.
Evening: Enjoy a sunset cruise along the coast, followed by dinner at Seafood Grill.`;
} 