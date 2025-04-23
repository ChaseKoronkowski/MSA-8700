'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import PreferenceOption from '@/components/ui/PreferenceOption';
import { usePreferences } from '@/context/PreferencesContext';
import { generatePrompt } from '@/utils/promptGenerator';
import {
  BudgetOption,
  TravelStyleOption,
  ActivityOption,
  AccommodationOption,
  SeasonOption,
  AccessibilityOption,
  FoodOption,
} from '@/types';
import { Box, Container, Typography, Button, LinearProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckIcon from '@mui/icons-material/Check';

export default function RecommendationPage() {
  const router = useRouter();
  const { preferences, updatePreferences, setRecommendation } = usePreferences();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Budget options with images
  const budgetOptions = [
    { value: 'budget', label: 'Budget', imageUrl: 'https://images.unsplash.com/photo-1537430802614-118bf14be50c?q=80&w=1770&auto=format&fit=crop' },
    { value: 'mid-range', label: 'Mid-range', imageUrl: 'https://images.unsplash.com/photo-1553342385-111fd6bc6ab3?q=80&w=1935&auto=format&fit=crop' },
    { value: 'luxury', label: 'Luxury', imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1170&auto=format&fit=crop' },
  ];

  // Travel style options with images
  const travelStyleOptions = [
    { value: 'adventure', label: 'Adventure', imageUrl: 'https://images.unsplash.com/photo-1530789253388-582c481c54b0?q=80&w=1170&auto=format&fit=crop' },
    { value: 'relaxation', label: 'Relaxation', imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1170&auto=format&fit=crop' },
    { value: 'cultural', label: 'Cultural', imageUrl: 'https://images.unsplash.com/photo-1726326477267-f36f1740ad8e?q=80&w=1769&auto=format&fit=crop' },
    { value: 'romantic', label: 'Romantic', imageUrl: 'https://images.unsplash.com/photo-1542557497-4c7b03d0d245?q=80&w=1919&auto=format&fit=crop' },
    { value: 'solo', label: 'Solo', imageUrl: 'https://images.unsplash.com/photo-1522506209496-4536d9020ec4?q=80&w=1974&auto=format&fit=crop' },
    { value: 'family', label: 'Family', imageUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=1170&auto=format&fit=crop' },
    { value: 'eco-friendly', label: 'Eco-friendly', imageUrl: 'https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=1170&auto=format&fit=crop' },
  ];

  // Activity options with images
  const activityOptions = [
    { value: 'sightseeing', label: 'Sightseeing', imageUrl: 'https://images.unsplash.com/photo-1502228362178-086346ac6862?q=80&w=1770&auto=format&fit=crop' },
    { value: 'museums', label: 'Museums', imageUrl: 'https://images.unsplash.com/photo-1503152394-c571994fd383?q=80&w=1170&auto=format&fit=crop' },
    { value: 'outdoors', label: 'Outdoors', imageUrl: 'https://images.unsplash.com/photo-1513311068348-19c8fbdc0bb6?q=80&w=1974&auto=format&fit=crop' },
    { value: 'shopping', label: 'Shopping', imageUrl: 'https://images.unsplash.com/photo-1481437156560-3205f6a55735?q=80&w=1795&auto=format&fit=crop' },
    { value: 'nightlife', label: 'Nightlife', imageUrl: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?q=80&w=1770&auto=format&fit=crop' },
    { value: 'culinary', label: 'Culinary', imageUrl: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?q=80&w=1170&auto=format&fit=crop' },
    { value: 'sports', label: 'Sports', imageUrl: 'https://images.unsplash.com/photo-1607627000458-210e8d2bdb1d?q=80&w=1749&auto=format&fit=crop' },
    { value: 'wellness', label: 'Wellness', imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=1170&auto=format&fit=crop' },
  ];

  // Accommodation options with images
  const accommodationOptions = [
    { value: 'hotel', label: 'Hotel', imageUrl: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=1170&auto=format&fit=crop' },
    { value: 'hostel', label: 'Hostel', imageUrl: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=1169&auto=format&fit=crop' },
    { value: 'resort', label: 'Resort', imageUrl: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1025&auto=format&fit=crop' },
    { value: 'apartment', label: 'Apartment', imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1080&auto=format&fit=crop' },
    { value: 'bed-and-breakfast', label: 'Bed & Breakfast', imageUrl: 'https://images.unsplash.com/photo-1493770348161-369560ae357d?q=80&w=1770&auto=format&fit=crop' },
    { value: 'camping', label: 'Camping', imageUrl: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=1170&auto=format&fit=crop' },
    { value: 'villa', label: 'Villa', imageUrl: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=1170&auto=format&fit=crop' },
  ];

  // Season options with images
  const seasonOptions = [
    { value: 'spring', label: 'Spring', imageUrl: 'https://images.unsplash.com/photo-1462275646964-a0e3386b89fa?q=80&w=1856&auto=format&fit=crop' },
    { value: 'summer', label: 'Summer', imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1173&auto=format&fit=crop' },
    { value: 'fall', label: 'Fall', imageUrl: 'https://images.unsplash.com/photo-1507371341162-763b5e419408?q=80&w=1939&auto=format&fit=crop' },
    { value: 'winter', label: 'Winter', imageUrl: 'https://images.unsplash.com/photo-1418985991508-e47386d96a71?q=80&w=1170&auto=format&fit=crop' },
  ];

  // Accessibility options with images
  const accessibilityOptions = [
    { value: 'wheelchair-accessible', label: 'Wheelchair Accessible', imageUrl: 'https://images.unsplash.com/photo-1565615833231-e8c91a38a012?q=80&w=1770&auto=format&fit=crop' },
    { value: 'limited-mobility', label: 'Limited Mobility', imageUrl: 'https://images.unsplash.com/photo-1595687973201-0095ff7a302e?q=80&w=1974&auto=format&fit=crop' },
    { value: 'visual-impairment', label: 'Visual Impairment', imageUrl: 'https://images.unsplash.com/photo-1508847154043-be5407fcaa5a?q=80&w=1974&auto=format&fit=crop' },
    { value: 'hearing-impairment', label: 'Hearing Impairment', imageUrl: 'https://images.unsplash.com/photo-1596088869451-491e167efabb?q=80&w=1858&auto=format&fit=crop' },
    { value: 'none', label: 'None', imageUrl: 'https://images.unsplash.com/photo-1528543606781-2f6e6857f318?q=80&w=1965&auto=format&fit=crop' },
  ];

  // Food options with images
  const foodOptions = [
    { value: 'vegetarian', label: 'Vegetarian', imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1170&auto=format&fit=crop' },
    { value: 'vegan', label: 'Vegan', imageUrl: 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?q=80&w=1064&auto=format&fit=crop' },
    { value: 'gluten-free', label: 'Gluten-Free', imageUrl: 'https://images.unsplash.com/photo-1613563732537-0229d46c97eb?q=80&w=1770&auto=format&fit=crop' },
    { value: 'halal', label: 'Halal', imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1887&auto=format&fit=crop' },
    { value: 'no-restrictions', label: 'No Restrictions', imageUrl: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?q=80&w=1170&auto=format&fit=crop' },
  ];

  const handleBudgetChange = (value: string, checked: boolean) => {
    if (checked) {
      updatePreferences({ budget: value as BudgetOption });
    }
  };

  const handleMultiSelectChange = (field: keyof typeof preferences, value: string, checked: boolean) => {
    if (checked) {
      updatePreferences({
        [field]: [...(preferences[field] as any[]), value],
      } as any);
    } else {
      updatePreferences({
        [field]: (preferences[field] as string[]).filter(item => item !== value),
      } as any);
    }
  };

  const handleCheckboxChange = (field: 'withChildren' | 'withPets', checked: boolean) => {
    updatePreferences({ [field]: checked });
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updatePreferences({ durationDays: parseInt(e.target.value, 10) });
  };

  const handleNextStep = () => {
    setStep(step + 1);
    window.scrollTo(0, 0);
  };

  const handlePrevStep = () => {
    setStep(step - 1);
    window.scrollTo(0, 0);
  };

  const handleGetRecommendations = async () => {
    setLoading(true);
    try {
      const prompt = generatePrompt(preferences);
      
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate recommendations');
      }
      
      const data = await response.json();
      setRecommendation(data.recommendation);
      
      // Parse the recommendation text into structured data
      const parsedData = parseRecommendation(data.recommendation);
      
      // Save to database
      await saveRecommendationToDatabase(data.recommendation, parsedData, prompt);
      
      // Redirect to dashboard instead of results page
      router.push('/dashboard/view-all-recommendations');
    } catch (error) {
      console.error('Error generating recommendations:', error);
      router.push('/dashboard/view-all-recommendations');
    } finally {
      setLoading(false);
    }
  };

  // Parse recommendation into structured data
  const parseRecommendation = (text: string): any[] => {
    const destinations: any[] = [];
    const lines = text.split('\n');

    let currentDestination: any = null;
    let currentSection = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (!line) continue;

      // Check if this is a destination header (format: 1. City Name, Country)
      // But make sure it's not a numbered point within an existing section
      const destinationMatch = line.match(/^(\d+)\.\s+(.+)$/);
      const isNumberedPoint = currentDestination && 
                               currentSection !== 'description' && 
                               destinationMatch && 
                               !line.includes(',') && // Most main destinations include a comma (City, Country)
                               i > 0 && lines[i-1].trim().length > 0; // Check if previous line isn't empty
      
      if (destinationMatch && !isNumberedPoint) {
        // Save the previous destination if exists
        if (currentDestination) {
          destinations.push(currentDestination);
        }
        
        // Get the next line as the description
        let description = '';
        if (i + 1 < lines.length) {
          description = lines[i + 1].trim();
        }
        
        // Create a new destination object
        currentDestination = {
          name: destinationMatch[2].trim(),
          description: description,
          whyFits: '',
          placesToVisit: '',
          restaurants: '',
          activities: '',
          accommodations: ''
        };
        currentSection = 'description'; // Default section after destination name
        continue;
      }

      // Skip if we haven't found a destination yet
      if (!currentDestination) continue;

      // Check for section headers
      if (line.match(/^-\s*Why This Fits/i)) {
        currentSection = 'whyFits';
        continue;
      } else if (line.match(/^-\s*Places to Visit/i)) {
        currentSection = 'placesToVisit';
        continue;
      } else if (line.match(/^-\s*Restaurants You Should Try/i)) {
        currentSection = 'restaurants';
        continue;
      } else if (line.match(/^-\s*Activities for Your Trip/i)) {
        currentSection = 'activities';
        continue;
      } else if (line.match(/^-\s*Accommodation Recommendations/i)) {
        currentSection = 'accommodations';
        continue;
      }

      // Add content to the current section
      if (currentSection === 'description' && line === currentDestination.description) {
        // Skip the description since we already added it
        continue;
      }

      if (currentDestination[currentSection] !== undefined) {
        // Add bullet points or format as needed
        currentDestination[currentSection] += (currentDestination[currentSection] ? '\n' : '') + line;
      }
    }

    // Add the last destination
    if (currentDestination) {
      destinations.push(currentDestination);
    }
    
    return destinations;
  };

  // Save recommendation to database
  const saveRecommendationToDatabase = async (rawContent: string, parsedDestinations: any[], originalPrompt: string) => {
    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          content: rawContent,
          type: 'travel', 
          metadata: {
            destinations: parsedDestinations,
            preferences: preferences,
            original_prompt: originalPrompt
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to save recommendation:', errorData);
      }
    } catch (error) {
      console.error('Error saving recommendation to database:', error);
    }
  };

  // Render different steps
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Box sx={{ mb: 5 }}>
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, color: '#f5f5f5' }}>
              What's your budget?
            </Typography>
            <Box 
              sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, 
                gap: 4
              }}
            >
              {budgetOptions.map((option) => (
                <PreferenceOption
                  key={option.value}
                  id={`budget-${option.value}`}
                  value={option.value}
                  label={option.label}
                  imageUrl={option.imageUrl}
                  selected={preferences.budget === option.value}
                  onChange={handleBudgetChange}
                />
              ))}
            </Box>
          </Box>
        );
      case 2:
        return (
          <Box sx={{ mb: 5 }}>
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, color: '#f5f5f5' }}>
              What's your travel style?
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, color: 'rgba(255, 255, 255, 0.7)' }}>
              Select all that apply
            </Typography>
            <Box 
              sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, 
                gap: 4
              }}
            >
              {travelStyleOptions.map((option) => (
                <PreferenceOption
                  key={option.value}
                  id={`style-${option.value}`}
                  value={option.value}
                  label={option.label}
                  imageUrl={option.imageUrl}
                  selected={preferences.travelStyle.includes(option.value as TravelStyleOption)}
                  onChange={(value, checked) => handleMultiSelectChange('travelStyle', value, checked)}
                  multiSelect
                />
              ))}
            </Box>
          </Box>
        );
      case 3:
        return (
          <Box sx={{ mb: 5 }}>
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, color: '#f5f5f5' }}>
              What activities do you enjoy?
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, color: 'rgba(255, 255, 255, 0.7)' }}>
              Select all that apply
            </Typography>
            <Box 
              sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, 
                gap: 4
              }}
            >
              {activityOptions.map((option) => (
                <PreferenceOption
                  key={option.value}
                  id={`activity-${option.value}`}
                  value={option.value}
                  label={option.label}
                  imageUrl={option.imageUrl}
                  selected={preferences.activities.includes(option.value as ActivityOption)}
                  onChange={(value, checked) => handleMultiSelectChange('activities', value, checked)}
                  multiSelect
                />
              ))}
            </Box>
          </Box>
        );
      case 4:
        return (
          <Box sx={{ mb: 5 }}>
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, color: '#f5f5f5' }}>
              Preferred accommodation types
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, color: 'rgba(255, 255, 255, 0.7)' }}>
              Select all that apply
            </Typography>
            <Box 
              sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, 
                gap: 4
              }}
            >
              {accommodationOptions.map((option) => (
                <PreferenceOption
                  key={option.value}
                  id={`accommodation-${option.value}`}
                  value={option.value}
                  label={option.label}
                  imageUrl={option.imageUrl}
                  selected={preferences.accommodation.includes(option.value as AccommodationOption)}
                  onChange={(value, checked) => handleMultiSelectChange('accommodation', value, checked)}
                  multiSelect
                />
              ))}
            </Box>
          </Box>
        );
      case 5:
        return (
          <Box sx={{ mb: 5 }}>
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, color: '#f5f5f5' }}>
              When do you prefer to travel?
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, color: 'rgba(255, 255, 255, 0.7)' }}>
              Select all that apply
            </Typography>
            <Box 
              sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, 
                gap: 4
              }}
            >
              {seasonOptions.map((option) => (
                <PreferenceOption
                  key={option.value}
                  id={`season-${option.value}`}
                  value={option.value}
                  label={option.label}
                  imageUrl={option.imageUrl}
                  selected={preferences.season.includes(option.value as SeasonOption)}
                  onChange={(value, checked) => handleMultiSelectChange('season', value, checked)}
                  multiSelect
                />
              ))}
            </Box>
          </Box>
        );
      case 6:
        return (
          <Box sx={{ mb: 5 }}>
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, color: '#f5f5f5' }}>
              How many days do you plan to travel?
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box sx={{ width: '100%', maxWidth: '500px' }}>
                <Box
                  component="input"
                  type="range"
                  min="1"
                  max="30"
                  value={preferences.durationDays}
                  onChange={handleDurationChange}
                  sx={{
                    width: '100%',
                    height: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    appearance: 'none',
                    cursor: 'pointer',
                    '&::-webkit-slider-thumb': {
                      appearance: 'none',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: '#90caf9',
                      cursor: 'pointer'
                    }
                  }}
                />
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Typography 
                    variant="h3" 
                    component="span" 
                    sx={{ fontWeight: 700, color: '#f5f5f5', mr: 1 }}
                  >
                    {preferences.durationDays}
                  </Typography>
                  <Typography 
                    variant="h5" 
                    component="span" 
                    sx={{ color: '#f5f5f5' }}
                  >
                    days
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        );
      case 7:
        return (
          <Box sx={{ mb: 5 }}>
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, color: '#f5f5f5' }}>
              Accessibility requirements
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, color: 'rgba(255, 255, 255, 0.7)' }}>
              Select all that apply
            </Typography>
            <Box 
              sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, 
                gap: 4
              }}
            >
              {accessibilityOptions.map((option) => (
                <PreferenceOption
                  key={option.value}
                  id={`accessibility-${option.value}`}
                  value={option.value}
                  label={option.label}
                  imageUrl={option.imageUrl}
                  selected={preferences.accessibility.includes(option.value as AccessibilityOption)}
                  onChange={(value, checked) => handleMultiSelectChange('accessibility', value, checked)}
                  multiSelect
                />
              ))}
            </Box>
          </Box>
        );
      case 8:
        return (
          <Box sx={{ mb: 5 }}>
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, color: '#f5f5f5' }}>
              Food preferences
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, color: 'rgba(255, 255, 255, 0.7)' }}>
              Select all that apply
            </Typography>
            <Box 
              sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, 
                gap: 4
              }}
            >
              {foodOptions.map((option) => (
                <PreferenceOption
                  key={option.value}
                  id={`food-${option.value}`}
                  value={option.value}
                  label={option.label}
                  imageUrl={option.imageUrl}
                  selected={preferences.foodPreferences.includes(option.value as FoodOption)}
                  onChange={(value, checked) => handleMultiSelectChange('foodPreferences', value, checked)}
                  multiSelect
                />
              ))}
            </Box>
          </Box>
        );
      case 9:
        return (
          <Box sx={{ mb: 5 }}>
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, color: '#f5f5f5' }}>
              Additional preferences
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box
                  component="input"
                  id="with-children"
                  type="checkbox"
                  checked={preferences.withChildren}
                  onChange={(e) => handleCheckboxChange('withChildren', e.target.checked)}
                  sx={{
                    width: '24px',
                    height: '24px',
                    mr: 2,
                    accentColor: '#90caf9'
                  }}
                />
                <Typography 
                  component="label"
                  htmlFor="with-children"
                  variant="h6" 
                  sx={{ color: '#f5f5f5' }}
                >
                  Traveling with children
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box
                  component="input"
                  id="with-pets"
                  type="checkbox"
                  checked={preferences.withPets}
                  onChange={(e) => handleCheckboxChange('withPets', e.target.checked)}
                  sx={{
                    width: '24px',
                    height: '24px',
                    mr: 2,
                    accentColor: '#90caf9'
                  }}
                />
                <Typography 
                  component="label"
                  htmlFor="with-pets"
                  variant="h6" 
                  sx={{ color: '#f5f5f5' }}
                >
                  Traveling with pets
                </Typography>
              </Box>
            </Box>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: '#2c2c2c', 
      color: 'white',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Header />
      
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', py: 4 }}>
        <Container maxWidth="xl" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography 
            variant="h3" 
            component="h1"
            align="center" 
            fontWeight="700"
            sx={{ 
              mb: 2,
              color: '#f5f5f5'
            }}
          >
            Tell Us Your Travel Preferences
          </Typography>
          
          <Typography 
            variant="subtitle1"
            align="center"
            sx={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              mb: 3
            }}
          >
            Step {step} of 9
          </Typography>

          {/* Progress Bar */}
          <Box sx={{ 
            width: '100%', 
            bgcolor: 'rgba(255, 255, 255, 0.1)', 
            borderRadius: 5,
            mb: 6,
            height: 8
          }}>
            <LinearProgress
              variant="determinate"
              value={(step / 9) * 100}
              sx={{
                height: 8,
                borderRadius: 5,
                backgroundColor: 'transparent',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#90caf9',
                  borderRadius: 5
                }
              }}
            />
          </Box>

          {/* Preference Content */}
          <Box sx={{ maxWidth: '1000px', width: '100%', mx: 'auto' }}>
            {renderStep()}

            {/* Navigation Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 8 }}>
              <Button
                onClick={handlePrevStep}
                disabled={step === 1}
                startIcon={<ArrowBackIcon />}
                sx={{
                  px: 3,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1rem',
                  color: 'white',
                  backgroundColor: step === 1 ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.15)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  },
                  '&.Mui-disabled': {
                    color: 'rgba(255, 255, 255, 0.3)',
                  }
                }}
              >
                Previous
              </Button>

              {step < 9 ? (
                <Button
                  onClick={handleNextStep}
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    px: 3,
                    py: 1.5,
                    backgroundColor: '#90caf9',
                    color: '#000',
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 500,
                    '&:hover': {
                      backgroundColor: '#6ba8de',
                    }
                  }}
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleGetRecommendations}
                  disabled={loading}
                  endIcon={loading ? null : <CheckIcon />}
                  sx={{
                    px: 3,
                    py: 1.5,
                    backgroundColor: '#90caf9',
                    color: '#000',
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 500,
                    '&:hover': {
                      backgroundColor: '#6ba8de',
                    },
                    '&.Mui-disabled': {
                      backgroundColor: 'rgba(144, 202, 249, 0.5)',
                      color: 'rgba(0, 0, 0, 0.4)'
                    }
                  }}
                >
                  {loading ? 'Processing...' : 'Get Recommendations'}
                </Button>
              )}
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
} 