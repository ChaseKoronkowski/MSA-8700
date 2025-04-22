import { TravelPreferences } from "@/types";

export function generatePrompt(preferences: TravelPreferences): string {
  const { 
    budget, 
    travelStyle, 
    activities, 
    accommodation, 
    season, 
    durationDays, 
    accessibility, 
    foodPreferences,
    withChildren,
    withPets
  } = preferences;

  return `I need a travel recommendation with the following preferences:
  
Budget: ${budget}
Travel Style: ${travelStyle.join(', ')}
Activities I enjoy: ${activities.join(', ')}
Preferred accommodation: ${accommodation.join(', ')}
Preferred travel season: ${season.join(', ')}
Trip duration: ${durationDays} days
Accessibility requirements: ${accessibility.join(', ')}
Food preferences: ${foodPreferences.join(', ')}
${withChildren ? 'I will be traveling with children.' : ''}
${withPets ? 'I will be traveling with pets.' : ''}

For my recommendation, please include:
1. 3-5 destination suggestions that match my preferences
2. Brief description of why each destination is suitable
3. Key attractions or activities at each destination
4. Best time to visit considering my season preferences
5. Approximate budget estimate for each destination
6. Any special considerations for my specific needs (accessibility, children, pets, food requirements)
`;
} 