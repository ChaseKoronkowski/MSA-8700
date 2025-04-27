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
    
    // Extract the duration from the prompt with expanded patterns
    const durationMatch = prompt.match(/Create a (\d+)-day travel itinerary/i) || 
                         prompt.match(/Create a ([a-z]+)-day travel itinerary/i) ||
                         prompt.match(/Create a (\d+) day travel itinerary/i) ||
                         prompt.match(/Create a ([a-z]+) day travel itinerary/i) ||
                         prompt.match(/(\d+)-day/i) ||
                         prompt.match(/(\d+) day/i) ||
                         prompt.match(/(\d+) days/i);
    
    let duration = "multi-day";
    if (durationMatch && durationMatch[1]) {
      duration = durationMatch[1] + "-day";
    }
    
    // Log the extracted duration for debugging
    console.log("Extracted duration:", duration);
    
    // If API key is not valid, return a demo response
    if (!isValidApiKey) {
      console.warn('Using demo response because OpenAI API key is not configured');
      content = generateDemoResponse(duration);
    } else {
      // Create a system prompt for itinerary generation
      const systemPrompt = `You are an expert travel planner. Create a detailed daily itinerary based on the user's preferences and available attractions. 
      
      The user is requesting a ${duration} itinerary. You MUST create an itinerary for EXACTLY the number of days specified.
      
      Format the response as:
      
      Day 1:
      Morning: [Activities or places]
      Afternoon: [Activities or places]
      Evening: [Activities or places]
      
      Day 2:
      Morning: [Activities or places]
      Afternoon: [Activities or places]
      Evening: [Activities or places]
      
      ... and so on until you have covered ALL ${duration} days.
      
      IMPORTANT: Make sure to create an itinerary for the EXACT number of days specified in the user's prompt. If they mention a 7-day trip, you MUST create a full 7-day itinerary with all 7 days clearly labeled and filled with appropriate activities.
      
      Make sure each day has a good balance of activities, not too crowded, and considers travel time between places.`;
      
      // Call OpenAI API with the prompt
      const response = await openai!.chat.completions.create({
        model: "gpt-4o-mini",
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
        max_tokens: 6000,
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
function generateDemoResponse(duration: string) {
  // If duration contains a number, extract it
  const durationDays = parseInt(duration) || 3;
  
  let response = '';
  
  for (let i = 1; i <= durationDays; i++) {
    response += `Day ${i}:
Morning: Start with breakfast at The Local Café ${i}, then visit the Main Museum to explore the city's history and culture.
Afternoon: Enjoy lunch at Seaside Restaurant with ocean views, followed by a walking tour of the Historic District.
Evening: Have dinner at The Gourmet Kitchen, then attend a local music performance at City Theater.

`;
  }
  
  return response.trim();
} 