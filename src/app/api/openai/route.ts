import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/lib/supabase';
import { parseRecommendation, Destination } from '@/utils/parseRecommendation';

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
        
        // Parse the recommendation immediately and save structured data
        if (savedId) {
          await saveStructuredRecommendationData(recommendation, savedId);
        }
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

// Helper function to extract preferences from the prompt
function extractPreferencesFromPrompt(prompt: string) {
  // Simple extraction logic - can be enhanced
  const preferences: Record<string, any> = {};
  
  if (prompt.includes('budget')) {
    if (prompt.includes('luxury') || prompt.includes('high-end')) {
      preferences.budget = 'luxury';
    } else if (prompt.includes('mid-range') || prompt.includes('moderate')) {
      preferences.budget = 'mid-range';
    } else if (prompt.includes('budget') || prompt.includes('affordable')) {
      preferences.budget = 'budget';
    }
  }
  
  if (prompt.includes('family') || prompt.includes('kids') || prompt.includes('children')) {
    preferences.travelingWith = 'family';
  } else if (prompt.includes('couple') || prompt.includes('romantic')) {
    preferences.travelingWith = 'partner';
  } else if (prompt.includes('friends') || prompt.includes('group')) {
    preferences.travelingWith = 'friends';
  } else if (prompt.includes('solo') || prompt.includes('alone')) {
    preferences.travelingWith = 'solo';
  }
  
  return preferences;
}

// Function to generate a demo response when API key is not available
function generateDemoResponse(prompt: string) {
  // Complex demo response generation logic...
  return `1. **Barcelona, Spain**
A vibrant coastal city combining stunning architecture, delicious cuisine, and beautiful beaches.

- Why This Fits Your Preferences:
  Barcelona offers a perfect blend of cultural experiences, outdoor activities, and culinary delights. The city's walkable design and efficient public transportation make it ideal for your exploration style, and its Mediterranean climate ensures pleasant weather for your visit.

- Places to Visit:
  • Sagrada Familia - Gaudí's unfinished masterpiece and Barcelona's most iconic landmark. The intricate details and beautiful stained glass are mesmerizing.
  • Park Güell - A whimsical park showcasing more of Gaudí's unique architecture with stunning views of the city.
  • Gothic Quarter - The historic heart of Barcelona with narrow medieval streets, charming squares, and the impressive Barcelona Cathedral.
  • La Boqueria Market - A colorful and bustling food market offering fresh local produce, seafood, and specialty items.
  • Barceloneta Beach - A popular urban beach with a lively atmosphere and plenty of seafood restaurants.

- Restaurants You Should Try:
  • Can Solé - A historic establishment serving authentic Catalan cuisine and exceptional seafood paella (mid-range).
  • Bar Cañete - Popular tapas bar with high-quality local ingredients and lively atmosphere (mid-range to high-end).
  • Tickets - Award-winning tapas restaurant by Ferran Adrià with creative, avant-garde dishes (high-end).
  • La Cova Fumada - No-frills local spot famous for bombas (potato croquettes) and fresh seafood (budget-friendly).

- Activities for Your Trip:
  • Take a guided walking tour of Gaudí's architectural masterpieces, including Casa Batlló and Casa Milà.
  • Enjoy a sunset sailing trip along the Barcelona coastline.
  • Visit the Picasso Museum to explore an extensive collection of the artist's works.
  • Take a day trip to Montserrat, a stunning mountain monastery just outside the city.
  • Participate in a paella cooking class to learn the secrets of this iconic Spanish dish.

- Accommodation Recommendations:
  • Hotel 1898 - Elegant hotel on La Rambla with a rooftop pool and views of the city (luxury).
  • H10 Casa Mimosa - Boutique hotel in an elegant modernist building near Casa Milà with a garden and terrace (mid-range).
  • Hostel One Paralelo - Social hostel with organized activities and friendly staff (budget).

2. **Kyoto, Japan**
A city of ancient temples, traditional gardens, and refined cultural experiences that captures Japan's essence.

- Why This Fits Your Preferences:
  Kyoto offers an immersive cultural experience with its 1,600 Buddhist temples, 400 Shinto shrines, and impeccably preserved historic districts. The city's efficient public transportation system makes it easy to explore, and the food scene ranges from affordable street food to high-end kaiseki dining.

- Places to Visit:
  • Fushimi Inari Shrine - Famous for its thousands of vermilion torii gates winding up the mountainside.
  • Arashiyama Bamboo Grove - A magical path lined with towering bamboo stalks that create an otherworldly atmosphere.
  • Kinkaku-ji (Golden Pavilion) - A stunning Zen temple covered in gold leaf, surrounded by a reflective pond and beautiful gardens.
  • Gion District - Kyoto's famous geisha district with preserved machiya houses, exclusive tea houses, and traditional shops.
  • Philosopher's Path - A scenic stone path along a canal lined with cherry trees, connecting several temples and shrines.

- Restaurants You Should Try:
  • Nishiki Market - Called "Kyoto's Kitchen," this covered market has over 100 stalls selling local specialties and street food (budget-friendly).
  • Pontocho Alley - A narrow lane along the Kamogawa River lined with restaurants ranging from affordable yakitori to high-end kaiseki.
  • Kichi Kichi - Famous for their omurice prepared with showmanship by Chef Motokichi Yukimura (mid-range).
  • Hyotei - A 400-year-old restaurant serving traditional kaiseki cuisine (high-end).

- Activities for Your Trip:
  • Participate in a traditional Japanese tea ceremony at one of the city's many tea houses.
  • Rent a kimono and stroll through the historic Higashiyama district.
  • Take a cooking class to learn how to make authentic Japanese dishes.
  • Visit during cherry blossom season (late March to early April) for hanami (flower viewing) parties.
  • Experience zazen meditation at a Buddhist temple for a glimpse into Japanese spiritual practices.

- Accommodation Recommendations:
  • Hoshinoya Kyoto - Luxurious ryokan (traditional inn) accessible only by boat along the Oi River (luxury).
  • Hotel Kanra Kyoto - Modern hotel with rooms inspired by traditional machiya townhouses (mid-range).
  • The Lower East Nine Hostel - Stylish, affordable hostel in a converted machiya with a communal kitchen (budget).

3. **Porto, Portugal**
A charming riverside city with colorful buildings, rich history, and world-famous wine culture.

- Why This Fits Your Preferences:
  Porto offers a perfect mix of cultural exploration, culinary delights, and scenic beauty at affordable prices compared to other European destinations. The compact city center is easily walkable, and the relaxed atmosphere matches your preference for an immersive yet laid-back experience.

- Places to Visit:
  • Livraria Lello - One of the world's most beautiful bookstores with neo-Gothic interiors and a stunning red staircase that inspired J.K. Rowling.
  • Ribeira District - UNESCO-listed historic center with colorful buildings cascading down to the Douro River.
  • Luís I Bridge - Iconic double-deck metal arch bridge connecting Porto to Vila Nova de Gaia with panoramic views.
  • Clérigos Tower - Baroque tower offering sweeping views of Porto from its 76-meter height.
  • Serralves Museum - Contemporary art museum with beautiful surrounding gardens and Art Deco villa.

- Restaurants You Should Try:
  • Café Santiago - Famous for its francesinha, Porto's signature sandwich with meat, cheese, and spicy sauce (budget-friendly).
  • Cantinho do Avillez - Contemporary Portuguese cuisine by celebrity chef José Avillez (mid-range).
  • Majestic Café - Historic Belle Époque café serving traditional pastries and coffee in elegant surroundings (mid-range).
  • DOP - Fine dining restaurant by acclaimed chef Rui Paula focusing on modern interpretations of Portuguese classics (high-end).

- Activities for Your Trip:
  • Take a river cruise along the Douro to admire Porto's six bridges and riverfront architecture.
  • Visit Vila Nova de Gaia for port wine cellar tours and tastings.
  • Ride the historic tram line 1 along the riverside to Foz do Douro where the river meets the Atlantic.
  • Explore the Crystal Palace Gardens for beautiful landscaping and river views.
  • Take a day trip to the Douro Valley wine region for vineyard tours and wine tasting.

- Accommodation Recommendations:
  • The Yeatman - Luxury wine hotel in Vila Nova de Gaia with panoramic views and a Michelin-starred restaurant (luxury).
  • Porto A.S. 1829 Hotel - Boutique hotel in a historic building that once housed a stationery shop (mid-range).
  • Gallery Hostel - Stylish hostel in a renovated 19th-century building with art exhibitions and cultural events (budget).`;
}

// Function to save structured recommendation data to database
async function saveStructuredRecommendationData(recommendationContent: string, recommendationId: string) {
  try {
    // Parse the recommendation text into structured data
    const destinations = parseRecommendation(recommendationContent);
    console.log(`Parsed ${destinations.length} destinations from recommendation ${recommendationId}`);
    
    // Store the structured data in the metadata of the llm_results table
    try {
      const { data: llmData, error: llmError } = await supabase
        .from('llm_results')
        .select('metadata')
        .eq('id', recommendationId)
        .single();
      
      if (llmError) {
        console.error('Error fetching llm_results for metadata update:', llmError);
        return false;
      }
      
      // Prepare metadata object
      const existingMetadata = llmData?.metadata || {};
      const updatedMetadata = {
        ...existingMetadata,
        structured_data: destinations.map(destination => {
          // Extract country from destination name if present
          const nameParts = destination.name.split(',');
          const cityName = nameParts[0].trim();
          const countryName = nameParts.length > 1 ? nameParts[1].trim() : null;
          
          return {
            name: cityName,
            country: countryName,
            description: destination.description,
            why_it_fits: destination.whyItFits,
            places_to_visit: destination.placesToVisit,
            restaurants: destination.restaurants.map(r => ({
              name: r.name,
              cuisine: r.type,
              price_range: r.priceRange,
              description: r.description
            })),
            activities: destination.activities,
            accommodations: destination.accommodations.map(a => ({
              name: a.name,
              type: a.type,
              price_range: a.priceRange,
              description: a.description
            }))
          };
        })
      };
      
      // Update the llm_results record with the structured data
      const { error: updateError } = await supabase
        .from('llm_results')
        .update({ metadata: updatedMetadata })
        .eq('id', recommendationId);
      
      if (updateError) {
        console.error('Error updating llm_results with structured data:', updateError);
        return false;
      }
      
      console.log(`Successfully stored structured data in llm_results metadata for recommendation ${recommendationId}`);
      return true;
    } catch (error) {
      console.error('Error in metadata update process:', error);
      return false;
    }
  } catch (error) {
    console.error('Error in saveStructuredRecommendationData:', error);
    return false;
  }
} 