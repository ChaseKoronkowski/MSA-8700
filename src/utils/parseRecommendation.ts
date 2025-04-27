/**
 * Destination interface representing the structured data parsed from LLM output
 */
export interface Destination {
  name: string;
  description: string;
  whyItFits: string;
  placesToVisit: {
    name: string;
    description: string;
  }[];
  restaurants: {
    name: string;
    type: string;
    priceRange: string;
    description: string;
  }[];
  activities: {
    name: string;
    description: string;
  }[];
  accommodations: {
    name: string;
    type: string;
    priceRange: string;
    description: string;
  }[];
  highlights?: string[];
}

/**
 * Parse recommendation content from LLM output into structured data
 */
export function parseRecommendation(content: string): Destination[] {
  const destinations: Destination[] = [];
  
  // Split content by numbered destinations (e.g., "1. Barcelona, Spain")
  const destinationRegex = /(\d+)\.\s+\*\*([^*]+)\*\*\s*([^\n]+)\n([\s\S]*?)(?=\d+\.\s+\*\*|$)/g;
  
  let match;
  while ((match = destinationRegex.exec(content)) !== null) {
    const name = match[2].trim();
    const description = match[3].trim();
    const detailBlock = match[4].trim();
    
    let whyItFits = '';
    const placesToVisit: { name: string; description: string; }[] = [];
    const restaurants: { name: string; type: string; priceRange: string; description: string; }[] = [];
    const activities: { name: string; description: string; }[] = [];
    const accommodations: { name: string; type: string; priceRange: string; description: string; }[] = [];
    
    // Extract "Why This Fits Your Preferences" section
    const whyFitsMatch = detailBlock.match(/-\s*Why This Fits[^:]*:([\s\S]*?)(?=-\s*Places to Visit|$)/i);
    if (whyFitsMatch) {
      whyItFits = whyFitsMatch[1].trim();
    }
    
    // Extract "Places to Visit" section
    const placesMatch = detailBlock.match(/-\s*Places to Visit[^:]*:([\s\S]*?)(?=-\s*Restaurants|$)/i);
    if (placesMatch) {
      const places = placesMatch[1]
        .split(/•|\*/)
        .map(item => item.trim())
        .filter(item => item && !item.match(/^[\s•\*]*$/));
        
      places.forEach(place => {
        // Try to split name and description
        const parts = place.split(/\s+-\s+|:\s+/);
        if (parts.length > 1) {
          placesToVisit.push({
            name: parts[0].trim(),
            description: parts.slice(1).join(' - ').trim()
          });
        } else {
          placesToVisit.push({
            name: place,
            description: ''
          });
        }
      });
    }
    
    // Extract "Restaurants You Should Try" section
    const restaurantsMatch = detailBlock.match(/-\s*Restaurants[^:]*:([\s\S]*?)(?=-\s*Activities|$)/i);
    if (restaurantsMatch) {
      const restaurantItems = restaurantsMatch[1]
        .split(/•|\*/)
        .map(item => item.trim())
        .filter(item => item && !item.match(/^[\s•\*]*$/));
        
      restaurantItems.forEach(restaurant => {
        // Extract name, type, price range from description
        const nameMatch = restaurant.match(/^([^-\(]+?)(?:\s+-\s+|\s+\(|$)/);
        const typeMatch = restaurant.match(/(?:-\s+|^)([^(]+?)(?:\s+\([^\)]+\)|$)/);
        const priceRangeMatch = restaurant.match(/\(([^)]*(?:budget|affordable|mid-range|moderate|high-end|luxury|expensive)[^)]*)\)/i);
        
        // Get description (everything after the name and type)
        let description = restaurant;
        if (nameMatch) {
          description = description.replace(nameMatch[1], '').trim();
        }
        if (priceRangeMatch) {
          description = description.replace(priceRangeMatch[0], '').trim();
        }
        description = description.replace(/^[-\s]+|[-\s]+$/g, '');
        
        restaurants.push({
          name: nameMatch ? nameMatch[1].trim() : restaurant,
          type: typeMatch && typeMatch[1] !== nameMatch?.[1] ? typeMatch[1].trim() : '',
          priceRange: priceRangeMatch ? priceRangeMatch[1].trim() : '',
          description: description || ''
        });
      });
    }
    
    // Extract "Activities for Your Trip" section
    const activitiesMatch = detailBlock.match(/-\s*Activities[^:]*:([\s\S]*?)(?=-\s*Accommodation|$)/i);
    if (activitiesMatch) {
      const activityItems = activitiesMatch[1]
        .split(/•|\*/)
        .map(item => item.trim())
        .filter(item => item && !item.match(/^[\s•\*]*$/));
        
      activityItems.forEach(activity => {
        // Check if this is a day-based activity
        const dayActivityMatch = activity.match(/^Day\s+(\d+(?:-\d+)?):\s*(.*)/i);
        
        if (dayActivityMatch && dayActivityMatch[2]) {
          // This is a day-based activity, extract ONLY the content after "Day X:"
          const activityContent = dayActivityMatch[2].trim();
          
          // Skip empty activity content
          if (!activityContent) {
            console.warn(`Empty activity content, skipping`);
            return;
          }
          
          // Split the activity content into individual activities
          const individualActivities = activityContent
            .split(/,\s*(?:and\s+)?|\s+and\s+|;\s*/)
            .map(act => act.trim())
            .filter(act => act.length > 0);
          
          console.log(`Parsing activities:`, individualActivities);
          
          // If no individual activities were extracted (rare case), use the whole content
          if (individualActivities.length === 0) {
            individualActivities.push(activityContent);
          }
          
          // Add each activity separately WITHOUT day references
          individualActivities.forEach(individualActivity => {
            // Remove trailing periods if they exist
            const cleanActivity = individualActivity.replace(/\.$/, '').trim();
            
            // Skip activities that are just "Day X" with no real content
            if (/^Day\s+\d+$/i.test(cleanActivity)) {
              console.warn(`Skipping empty day activity: ${cleanActivity}`);
              return;
            }
            
            // Skip departure/check-out activities
            if (/depart|check.?out|leave|return home/i.test(cleanActivity)) {
              console.warn(`Skipping departure activity: ${cleanActivity}`);
              return;
            }
            
            activities.push({
              name: cleanActivity,
              description: '' // No day references in the description either
            });
          });
        } else if (activity.match(/^Day\s+\d+$/i)) {
          // This is just a day number with no activities, skip it
          console.warn(`Skipping empty day entry: ${activity}`);
          return;
        } else {
          // Not a day-based activity, process normally
          const parts = activity.split(/\s+-\s+|:\s+/);
          if (parts.length > 1) {
            activities.push({
              name: parts[0].trim(),
              description: parts.slice(1).join(' - ').trim()
            });
          } else {
            activities.push({
              name: activity,
              description: ''
            });
          }
        }
      });
    }
    
    // Extract "Accommodation Recommendations" section
    const accommodationsMatch = detailBlock.match(/-\s*Accommodation[^:]*:([\s\S]*?)$/i);
    if (accommodationsMatch) {
      const accommodationItems = accommodationsMatch[1]
        .split(/•|\*/)
        .map(item => item.trim())
        .filter(item => item && !item.match(/^[\s•\*]*$/));
        
      accommodationItems.forEach(accommodation => {
        // Similar extraction as restaurants
        const nameMatch = accommodation.match(/^([^-\(]+?)(?:\s+-\s+|\s+\(|$)/);
        const typeMatch = accommodation.match(/(?:-\s+|^)([^(]+?)(?:\s+\([^\)]+\)|$)/);
        const priceRangeMatch = accommodation.match(/\(([^)]*(?:budget|affordable|mid-range|moderate|high-end|luxury|expensive)[^)]*)\)/i);
        
        // Get description
        let description = accommodation;
        if (nameMatch) {
          description = description.replace(nameMatch[1], '').trim();
        }
        if (priceRangeMatch) {
          description = description.replace(priceRangeMatch[0], '').trim();
        }
        description = description.replace(/^[-\s]+|[-\s]+$/g, '');
        
        accommodations.push({
          name: nameMatch ? nameMatch[1].trim() : accommodation,
          type: typeMatch && typeMatch[1] !== nameMatch?.[1] ? typeMatch[1].trim() : '',
          priceRange: priceRangeMatch ? priceRangeMatch[1].trim() : '',
          description: description || ''
        });
      });
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