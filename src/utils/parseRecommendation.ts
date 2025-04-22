/**
 * Destination interface representing the structured data parsed from LLM output
 */
export interface Destination {
  name: string;
  description: string;
  whyItFits: string;
  placesToVisit: string[];
  restaurants: string[];
  activities: string[];
  accommodations: string[];
}

/**
 * Parse recommendation content from LLM output into structured data
 */
export function parseRecommendation(content: string): Destination[] {
  const destinations: Destination[] = [];
  
  // Split content by numbered destination headers (1., 2., 3.)
  const destinationBlocks = content.split(/\d+\.\s+[\w\s,\/]+\n/);
  
  // Skip the first block if it's empty (typically happens due to split behavior)
  const startIdx = destinationBlocks[0].trim() === '' ? 1 : 0;
  
  // Extract destination names
  const destinationNameRegex = /(\d+)\.\s+([\w\s,\/]+)/g;
  const destinationNames: string[] = [];
  let match;
  
  while ((match = destinationNameRegex.exec(content)) !== null) {
    destinationNames.push(match[2].trim());
  }
  
  // Process each destination block
  for (let i = startIdx; i < destinationBlocks.length; i++) {
    const block = destinationBlocks[i];
    const nameIndex = i - startIdx;
    
    if (!block || nameIndex >= destinationNames.length) continue;
    
    const name = destinationNames[nameIndex];
    let description = '';
    let whyItFits = '';
    const placesToVisit: string[] = [];
    const restaurants: string[] = [];
    const activities: string[] = [];
    const accommodations: string[] = [];
    
    // Extract description (first paragraph)
    const descriptionMatch = block.match(/^([\s\S]*?)(?=-\s*Why This Fits|$)/);
    if (descriptionMatch) {
      description = descriptionMatch[1].trim();
    }
    
    // Extract "Why This Fits Your Preferences" section
    const whyFitsMatch = block.match(/-\s*Why This Fits[\s\S]*?:([\s\S]*?)(?=-\s*Places to Visit|$)/i);
    if (whyFitsMatch) {
      whyItFits = whyFitsMatch[1].trim();
    }
    
    // Extract "Places to Visit" section
    const placesMatch = block.match(/-\s*Places to Visit[\s\S]*?:([\s\S]*?)(?=-\s*Restaurants|$)/i);
    if (placesMatch) {
      placesToVisit.push(
        ...placesMatch[1]
          .split(/•|\*/)
          .map(item => item.trim())
          .filter(item => item)
      );
    }
    
    // Extract "Restaurants You Should Try" section
    const restaurantsMatch = block.match(/-\s*Restaurants[\s\S]*?:([\s\S]*?)(?=-\s*Activities|$)/i);
    if (restaurantsMatch) {
      restaurants.push(
        ...restaurantsMatch[1]
          .split(/•|\*/)
          .map(item => item.trim())
          .filter(item => item)
      );
    }
    
    // Extract "Activities for Your Trip" section
    const activitiesMatch = block.match(/-\s*Activities[\s\S]*?:([\s\S]*?)(?=-\s*Accommodation|$)/i);
    if (activitiesMatch) {
      activities.push(
        ...activitiesMatch[1]
          .split(/•|\*/)
          .map(item => item.trim())
          .filter(item => item)
      );
    }
    
    // Extract "Accommodation Recommendations" section
    const accommodationsMatch = block.match(/-\s*Accommodation[\s\S]*?:([\s\S]*?)$/i);
    if (accommodationsMatch) {
      accommodations.push(
        ...accommodationsMatch[1]
          .split(/•|\*/)
          .map(item => item.trim())
          .filter(item => item)
      );
    }
    
    destinations.push({
      name,
      description,
      whyItFits,
      placesToVisit,
      restaurants,
      activities,
      accommodations
    });
  }
  
  return destinations;
} 