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
    const { prompt, user_identifier } = await request.json();
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }
    
    let recommendation: string;
    
    // If API key is not valid, return a demo response
    if (!isValidApiKey) {
      console.warn('Using demo response because OpenAI API key is not configured');
      recommendation = generateDemoResponse(prompt);
    } else {
      // Immediately after checking the API key validity
      const enhancedPrompt = `Based on the user's travel preferences: "${prompt}", recommend exactly 3 travel destinations.

      For each destination, follow this exact format with clear section headers:

      1. {City/Region Name, Country}
      A brief 1-2 sentence description of the destination that captures its essence.

      - Why This Fits Your Preferences:
        [Explain how this destination matches the user's specific preferences in 2-3 sentences]

      - Places to Visit:
        [List 4-5 must-see attractions or landmarks with a brief description of each. Use bullet points.]

      - Restaurants You Should Try:
        [Recommend 3-4 restaurants across different price points, including a brief note on cuisine type. Use bullet points.]

      - Activities for Your Trip:
        [Suggest activities tailored to the user's specified trip duration, organized day by day if possible. Use bullet points.]

      - Accommodation Recommendations:
        [Suggest 2-3 accommodations that match the user's preferences and budget, from luxury to budget options as appropriate. Use bullet points.]

      IMPORTANT: Do not use numbered points (1., 2., etc.) within any section except for the main destination headers. For all lists, use bullet points (•) instead.
      Make sure all information for each destination is grouped together - do not split a destination across multiple sections.
      Use this exact structure and formatting for all three destinations.`;
      
      // Call OpenAI API with the enhanced prompt
      const response = await openai!.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a knowledgeable travel assistant that provides detailed, personalized travel recommendations based on user preferences."
          },
          {
            role: "user",
            content: enhancedPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000,
      });

      recommendation = response.choices[0].message.content || '';
    }

    // Extract preferences from the prompt for structured storage
    const extractedPreferences = extractPreferencesFromPrompt(prompt);

    // Save the LLM result to Supabase
    let savedId = null;
    try {
      const { data, error } = await supabase.from('llm_results').insert([
        {
          content: recommendation,
          type: 'travel-recommendation',
          metadata: { 
            original_prompt: prompt,
            preferences: extractedPreferences
          },
          user_identifier: user_identifier || null,
        },
      ]).select('id');
      
      if (error) {
        console.error('Error saving to llm_results:', error);
      } else if (data && data.length > 0) {
        savedId = data[0].id;
      }
    } catch (dbError) {
      console.error('Error saving LLM result to database:', dbError);
      // Continue with the response even if saving fails
    }

    // Return the response
    return NextResponse.json({ 
      recommendation,
      id: savedId
    });
  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendation' },
      { status: 500 }
    );
  }
}

// Extract structured preferences from the prompt text
function extractPreferencesFromPrompt(prompt: string): Record<string, any> {
  const preferences: Record<string, any> = {};
  
  // Extract budget
  const budgetMatch = prompt.match(/Budget:\s*(\w+(?:-\w+)?)/i);
  if (budgetMatch) preferences.budget = budgetMatch[1];
  
  // Extract travel style
  const travelStyleMatch = prompt.match(/Travel Style:\s*([^]*?)(?=Activities|$)/i);
  if (travelStyleMatch) {
    preferences.travelStyle = travelStyleMatch[1]
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }
  
  // Extract activities
  const activitiesMatch = prompt.match(/Activities I enjoy:\s*([^]*?)(?=Preferred accommodation|$)/i);
  if (activitiesMatch) {
    preferences.activities = activitiesMatch[1]
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }
  
  // Extract accommodation
  const accommodationMatch = prompt.match(/Preferred accommodation:\s*([^]*?)(?=Preferred travel season|$)/i);
  if (accommodationMatch) {
    preferences.accommodation = accommodationMatch[1]
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }
  
  // Extract season
  const seasonMatch = prompt.match(/Preferred travel season:\s*([^]*?)(?=Trip duration|$)/i);
  if (seasonMatch) {
    preferences.season = seasonMatch[1]
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }
  
  // Extract duration
  const durationMatch = prompt.match(/Trip duration:\s*(\d+)\s*days/i);
  if (durationMatch) preferences.durationDays = parseInt(durationMatch[1], 10);
  
  // Extract accessibility
  const accessibilityMatch = prompt.match(/Accessibility requirements:\s*([^]*?)(?=Food preferences|$)/i);
  if (accessibilityMatch) {
    preferences.accessibility = accessibilityMatch[1]
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }
  
  // Extract food preferences
  const foodMatch = prompt.match(/Food preferences:\s*([^]*?)(?=I will be|$)/i);
  if (foodMatch) {
    preferences.foodPreferences = foodMatch[1]
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }
  
  // Extract with children
  preferences.withChildren = prompt.includes('I will be traveling with children');
  
  // Extract with pets
  preferences.withPets = prompt.includes('I will be traveling with pets');
  
  return preferences;
}

// Provide a fallback demo response when API key is not available
function generateDemoResponse(prompt: string): string {
  // Extract information from the prompt if available
  const budget = prompt.toLowerCase().includes('budget') ? 'medium' : 
                 prompt.toLowerCase().includes('luxury') ? 'high' : 'medium';
  
  return `1. Queenstown, New Zealand
A breathtaking alpine resort town surrounded by majestic mountains and situated on the shores of the crystal clear Lake Wakatipu.

- Why This Fits Your Preferences:
  Queenstown offers the perfect blend of adventure activities and stunning natural landscapes that you're looking for. It's known as the adventure capital of the world but also provides beautiful scenery and relaxation opportunities.

- Places to Visit:
  • Skyline Queenstown - Enjoy panoramic views of Lake Wakatipu and the Remarkables mountain range
  • Milford Sound - Take a day trip to one of New Zealand's most famous natural wonders
  • Coronet Peak - Premier ski resort in winter and scenic hiking area in summer
  • Lake Wakatipu - The lightning bolt-shaped lake offers gorgeous views and lakeside walks
  • Arrowtown - Charming historic gold mining town just 20 minutes from Queenstown

- Restaurants You Should Try:
  • Rata - Contemporary fine dining featuring local ingredients and New Zealand wines (High-end)
  • Fergburger - World-famous burger joint known for massive, gourmet burgers (Mid-range)
  • The Bunker - Hidden gem serving game-focused dishes in a cozy atmosphere (High-end)
  • Fergbaker - Sister establishment to Fergburger offering delicious pastries and pies (Budget-friendly)

- Activities for Your Trip:
  • Day 1: Take the Skyline Gondola for panoramic views and enjoy some downhill luging
  • Day 2: Experience a Milford Sound cruise through stunning fjords and waterfalls
  • Day 3: Try bungy jumping at the Kawarau Bridge, the world's first commercial bungy site
  • Day 4: Go jet boating on the Shotover River for a thrilling water experience
  • Day 5: Relax with a day trip to nearby Arrowtown and explore its gold mining history

- Accommodation Recommendations:
  • Eichardt's Private Hotel - Historic luxury hotel on the lakefront with exceptional service (Luxury)
  • QT Queenstown - Stylish designer hotel with stunning lake views (Mid-range)
  • Sherwood - Eco-friendly hotel with mountain views and farm-to-table restaurant (Budget-friendly)

2. Kyoto, Japan
An enchanting city where ancient Japan meets modern life, filled with serene temples, traditional gardens, and exquisite cuisine.

- Why This Fits Your Preferences:
  Kyoto provides a deeply immersive cultural experience with its well-preserved historic sites, seasonal beauty, and authentic Japanese traditions that align with your interest in experiencing new cultures.

- Places to Visit:
  • Fushimi Inari Shrine - Famous for its thousands of vermilion torii gates along mountain trails
  • Kinkaku-ji (Golden Pavilion) - A zen temple covered in gold leaf, surrounded by reflective ponds
  • Arashiyama Bamboo Grove - Magical pathway through towering bamboo stalks
  • Gion District - Traditional geisha district with preserved wooden machiya houses
  • Nishiki Market - "Kyoto's Kitchen" offering local specialties and culinary treasures

- Restaurants You Should Try:
  • Hyotei - Three-Michelin-star traditional kaiseki restaurant in a 300-year-old building (High-end)
  • Pontocho Alley restaurants - Atmospheric dining along a narrow lane by the river (Various ranges)
  • Nishiki Warai - Excellent okonomiyaki (Japanese savory pancake) in a casual setting (Mid-range)
  • Musashi Sushi - Affordable conveyor belt sushi with fresh quality fish (Budget-friendly)

- Activities for Your Trip:
  • Day 1: Visit the iconic Fushimi Inari Shrine and Kiyomizu-dera Temple
  • Day 2: Explore the western area including the Arashiyama Bamboo Grove and Monkey Park
  • Day 3: Experience a traditional tea ceremony and stroll through the Gion district
  • Day 4: Take a day trip to nearby Nara to see the friendly deer and historic temples
  • Day 5: Participate in a Japanese cooking class and visit Nishiki Market

- Accommodation Recommendations:
  • The Ritz-Carlton Kyoto - Luxurious riverside property blending modern amenities with traditional design (Luxury)
  • Mitsui Garden Hotel Kyoto Shijo - Contemporary hotel in a convenient central location (Mid-range)
  • Len Kyoto - Stylish hostel with private rooms and a coffee shop in a renovated machiya (Budget-friendly)

3. Santorini, Greece
A stunning island paradise known for its whitewashed buildings with blue domes perched on volcanic cliffs overlooking the deep blue Aegean Sea.

- Why This Fits Your Preferences:
  Santorini combines breathtaking natural beauty with rich cultural experiences. The dramatic volcanic landscape, iconic architecture, and picturesque sunsets create the perfect setting for a relaxing yet visually spectacular vacation.

- Places to Visit:
  • Oia - Famous village known for its stunning sunsets and blue-domed churches
  • Fira - The island's capital with winding streets, shops, and caldera views
  • Red Beach - Unique beach with red volcanic cliffs and sand
  • Ancient Akrotiri - Well-preserved archaeological site often called the "Greek Pompeii"
  • Santo Wines Winery - Award-winning winery offering tastings with breathtaking views

- Restaurants You Should Try:
  • Lycabettus Restaurant - Cliffside fine dining with exceptional views and Mediterranean cuisine (High-end)
  • Metaxy Mas Tavern - Authentic Greek taverna loved by locals for traditional dishes (Mid-range)
  • Lucky's Souvlaki - Popular street food spot for gyros and souvlaki in Fira (Budget-friendly)
  • Amoudi Fish Tavern - Fresh seafood restaurant at the picturesque Amoudi Bay (Mid-range)

- Activities for Your Trip:
  • Day 1: Explore Oia's narrow streets and enjoy the famous sunset from the Byzantine Castle ruins
  • Day 2: Take a catamaran cruise around the caldera, including hot springs and volcanic islands
  • Day 3: Visit Ancient Akrotiri and then relax at Red Beach or Perivolos black sand beach
  • Day 4: Tour local wineries and learn about Santorini's unique winemaking traditions
  • Day 5: Hike the stunning trail from Fira to Oia along the caldera edge (about 3-4 hours)

- Accommodation Recommendations:
  • Canaves Oia Suites - Luxury cave-style accommodations with infinity pools and caldera views (Luxury)
  • Astra Suites - Beautiful mid-range hotel with stunning views and excellent service (Mid-range)
  • Caveland - Unique hostel in a converted 18th-century winery with shared pool (Budget-friendly)`;
} 