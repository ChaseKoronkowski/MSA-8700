export type BudgetOption = 'budget' | 'mid-range' | 'luxury';
export type TravelStyleOption = 'adventure' | 'relaxation' | 'cultural' | 'romantic' | 'solo' | 'family' | 'eco-friendly';
export type ActivityOption = 'sightseeing' | 'museums' | 'outdoors' | 'shopping' | 'nightlife' | 'culinary' | 'sports' | 'wellness';
export type AccommodationOption = 'hotel' | 'hostel' | 'resort' | 'apartment' | 'bed-and-breakfast' | 'camping' | 'villa';
export type SeasonOption = 'spring' | 'summer' | 'fall' | 'winter';
export type AccessibilityOption = 'wheelchair-accessible' | 'limited-mobility' | 'visual-impairment' | 'hearing-impairment' | 'none';
export type FoodOption = 'vegetarian' | 'vegan' | 'gluten-free' | 'halal' | 'kosher' | 'no-restrictions';

export interface TravelPreferences {
  budget: BudgetOption;
  travelStyle: TravelStyleOption[];
  activities: ActivityOption[];
  accommodation: AccommodationOption[];
  season: SeasonOption[];
  durationDays: number;
  accessibility: AccessibilityOption[];
  foodPreferences: FoodOption[];
  withChildren: boolean;
  withPets: boolean;
}

export interface ApiResponse {
  recommendation?: string;
  error?: string;
} 