'use client';

import React, { useState, useEffect, use } from 'react';
import { 
  Box, 
  Typography, 
  Tabs, 
  Tab, 
  CircularProgress, 
  Alert, 
  Paper,
  Container,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  styled,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  AppBar,
  Toolbar,
  Snackbar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card
} from '@mui/material';
import { parseRecommendation } from '@/utils/parseRecommendation';
import { useRecommendation } from '@/hooks/useRecommendation';
import { useDestinations, Destination as DBDestination } from '@/hooks/useDestinations';
import PlaceIcon from '@mui/icons-material/Place';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import HotelIcon from '@mui/icons-material/Hotel';
import InfoIcon from '@mui/icons-material/Info';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RouteIcon from '@mui/icons-material/Route';
import EditIcon from '@mui/icons-material/Edit';
import { useRouter } from 'next/navigation';

const StyledSection = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: theme.spacing(1),
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: theme.shadows[4],
  },
}));

const ContentItem = styled(ListItem)(({ theme }) => ({
  padding: theme.spacing(1.5),
  marginBottom: theme.spacing(1),
  borderRadius: theme.spacing(1),
  backgroundColor: '#f9f9f9',
  '&:hover': {
    backgroundColor: '#f0f0f0',
  },
}));

const AddButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  backgroundColor: '#f5f5f5',
  color: theme.palette.primary.main,
  textTransform: 'uppercase',
  width: '100%',
  padding: theme.spacing(1.5),
  fontWeight: 500,
  justifyContent: 'center',
  '&:hover': {
    backgroundColor: '#e0e0e0',
  },
}));

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`destination-tabpanel-${index}`}
      aria-labelledby={`destination-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `destination-tab-${index}`,
    'aria-controls': `destination-tabpanel-${index}`,
  };
}

// Define interfaces for the data structure
interface DestinationData {
  city?: string;
  country?: string;
  places_to_visit?: { name: string }[];
  restaurants?: { name: string }[];
  activities?: { name: string }[];
  accommodations?: { name: string }[];
  placesToVisit?: { name: string }[];
}

// Define a properly typed Recommendation interface with metadata
interface Recommendation {
  id: string;
  user_identifier: string;
  destination: string;
  interests: string[];
  budget: string;
  duration: string;
  travelers: string;
  metadata?: {
    parsed_by_ai: boolean;
    original_prompt?: string;
  };
  content?: string;
  created_at: string;
}

// Fix the destination types to be consistent
interface Place {
  name: string;
  description?: string;
}

interface DestinationItem {
  id?: string;
  name: string;
  description?: string;
  type?: string;
  priceRange?: string;
}

interface Destination {
  id?: string;
  recommendation_id?: string;
  name: string;
  whyItFits: string;
  why_it_fits?: string;
  placesToVisit: Place[];
  places_to_visit?: Place[];
  restaurants: DestinationItem[];
  activities: DestinationItem[];
  accommodations: DestinationItem[];
}

// Define ParsedDestination interface for parsing results
interface ParsedDestination {
  id?: string;
  recommendation_id?: string;
  name: string;
  whyItFits: string;
  why_it_fits?: string;
  placesToVisit: Place[];
  places_to_visit?: Place[];
  restaurants: DestinationItem[];
  activities: DestinationItem[];
  accommodations: DestinationItem[];
}

// Update the EnhancedDestination interface to extend Destination
interface EnhancedDestination {
  id: string;
  recommendation_id: string;
  name: string;
  why_it_fits: string;
  places_to_visit: Place[];
  restaurants: DestinationItem[];
  activities: DestinationItem[];
  accommodations: DestinationItem[];
}

// Fix the RoutePlan interface to match the data structure
interface Day {
  dayNumber: number;
  morning: string | Array<{name: string; description?: string}>;
  afternoon: string | Array<{name: string; description?: string}>;
  evening: string | Array<{name: string; description?: string}>;
}

interface RoutePlan {
  id?: string;
  recommendation_id: string;
  destination_name: string;
  days: Day[];
  created_at?: string;
}

// Make sure getDestinationProperty properly handles arrays with safety checks
const getDestinationProperty = (
  destination: any,
  propertyName: string,
  fallbackProperty?: string
): any[] => {
  // First try the primary property name
  const primaryValue = destination[propertyName];
  if (Array.isArray(primaryValue)) {
    return primaryValue;
  }
  
  // Then try the fallback property if provided
  if (fallbackProperty && fallbackProperty in destination) {
    const fallbackValue = destination[fallbackProperty];
    if (Array.isArray(fallbackValue)) {
      return fallbackValue;
    }
  }
  
  // Return empty array if nothing found
  return [];
};

export default function RecommendationDetailsPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const router = useRouter();
  
  // Handle both promise and non-promise cases
  const resolvedParams = typeof params === 'object' && !('then' in params) 
    ? params 
    : use(params as Promise<{ id: string }>);
    
  const id = resolvedParams.id;
  
  const { recommendation, loading: loadingRecommendation, error: recommendationError } = useRecommendation(id);
  const { destinations: dbDestinations, loading: loadingDestinations, error: destinationsError } = useDestinations(id);
  const [value, setValue] = useState(0);
  const [parsedDestinations, setParsedDestinations] = useState<ParsedDestination[]>([]);
  const [parsingError, setParsingError] = useState<string | null>(null);
  
  // Add dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'place' | 'restaurant' | 'activity' | 'accommodation'>('place');
  const [newItemText, setNewItemText] = useState('');
  
  // State for custom added items
  const [customPlaces, setCustomPlaces] = useState<{ [key: number]: string[] }>({});
  const [customRestaurants, setCustomRestaurants] = useState<{ [key: number]: string[] }>({});
  const [customActivities, setCustomActivities] = useState<{ [key: number]: string[] }>({});
  const [customAccommodations, setCustomAccommodations] = useState<{ [key: number]: string[] }>({});
  
  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Add state for route plans and route generation inside the component
  const [routePlans, setRoutePlans] = useState<RoutePlan[]>([]);
  const [isGeneratingRoute, setIsGeneratingRoute] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [routeSuccess, setRouteSuccess] = useState(false);

  // Add state for the last prompt and customization functionality
  const [lastPrompt, setLastPrompt] = useState<string>('');
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customizationInput, setCustomizationInput] = useState('');
  
  // Add state for tab-specific customization inputs
  const [tabCustomizationInputs, setTabCustomizationInputs] = useState<{[tabIndex: number]: string}>({});

  // Effect to parse recommendation content if dbDestinations is empty
  useEffect(() => {
    if (dbDestinations.length > 0) {
      // Data already exists in the database, no need to parse
      return;
    }
    
    if (recommendation?.content) {
      try {
        const parsed = parseRecommendation(recommendation.content);
        setParsedDestinations(parsed);
      } catch (err) {
        console.error('Error parsing recommendation:', err);
        setParsingError('Failed to parse recommendation details');
      }
    }
  }, [recommendation, dbDestinations]);

  // Add effect to fetch route plans when component mounts
  useEffect(() => {
    fetchRoutePlans();
  }, []);

  // Add the fetchRoutePlans function
  const fetchRoutePlans = async () => {
    try {
      console.log("Fetching route plans for recommendation:", id);
      const response = await fetch(`/api/route-plans/${id}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error response (${response.status}):`, errorText);
        return;
      }
      
      const data = await response.json();
      console.log("Fetched route plans:", data);
      
      // Process the data to ensure days is an array
      const processedData = data.map((plan: any) => {
        // If days is a string, parse it; otherwise use it as is
        let processedDays = plan.days;
        
        // Check if days is a string and try to parse it
        if (typeof plan.days === 'string') {
          try {
            processedDays = JSON.parse(plan.days);
          } catch (e) {
            console.error('Error parsing days JSON:', e);
            processedDays = []; // Default to empty array if parsing fails
          }
        } 
        // If days is neither an array nor a string that can be parsed into an array
        else if (!Array.isArray(plan.days)) {
          console.error('Days is not an array or parseable string:', plan.days);
          processedDays = []; // Default to empty array
        }
        
        return {
          ...plan,
          days: processedDays
        };
      });
      
      setRoutePlans(processedData);
    } catch (error) {
      console.error('Error fetching route plans:', error);
    }
  };

  // Event handlers
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    // Reset customization input when changing tabs
    setCustomizationInput('');
  };
  
  const handleOpenDialog = (type: 'place' | 'restaurant' | 'activity' | 'accommodation') => {
    setDialogType(type);
    setNewItemText('');
    setDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };
  
  const handleAddItem = () => {
    if (!newItemText.trim()) return;
    
    const currentDestinationIndex = value;
    
    switch (dialogType) {
      case 'place':
        setCustomPlaces(prev => ({
          ...prev,
          [currentDestinationIndex]: [
            ...(prev[currentDestinationIndex] || []),
            newItemText
          ]
        }));
        break;
      case 'restaurant':
        setCustomRestaurants(prev => ({
          ...prev,
          [currentDestinationIndex]: [
            ...(prev[currentDestinationIndex] || []),
            newItemText
          ]
        }));
        break;
      case 'activity':
        setCustomActivities(prev => ({
          ...prev,
          [currentDestinationIndex]: [
            ...(prev[currentDestinationIndex] || []),
            newItemText
          ]
        }));
        break;
      case 'accommodation':
        setCustomAccommodations(prev => ({
          ...prev,
          [currentDestinationIndex]: [
            ...(prev[currentDestinationIndex] || []),
            newItemText
          ]
        }));
        break;
    }
    
    setNewItemText('');
    setDialogOpen(false);
  };
  
  const handleSaveToDatabase = async () => {
    if ((dbDestinations.length === 0 && parsedDestinations.length === 0) || !parsedDestinations) return;
    
    setIsSaving(true);
    setSaveError(null);
    
    try {
      // Get the current destination and safely cast it
      const destination = parsedDestinations[value] as unknown as ParsedDestination;
      const currentDestination = {
        id: destination.id || crypto.randomUUID(),
        recommendation_id: destination.recommendation_id || id,
        name: destination.name,
        why_it_fits: destination.whyItFits || destination.why_it_fits || "",
        places_to_visit: destination.placesToVisit || destination.places_to_visit || [],
        restaurants: destination.restaurants || [],
        activities: destination.activities || [],
        accommodations: destination.accommodations || []
      } as EnhancedDestination;
      
      // Combine AI-generated and custom items
      const placesToSave = [
        ...currentDestination.places_to_visit,
        ...(customPlaces[value] || [])
      ];
      
      const restaurantsToSave = [
        ...(currentDestination.restaurants || []),
        ...(customRestaurants[value] || [])
      ];
      
      const activitiesToSave = [
        ...(currentDestination.activities || []),
        ...(customActivities[value] || [])
      ];
      
      const accommodationsToSave = [
        ...(currentDestination.accommodations || []),
        ...(customAccommodations[value] || [])
      ];
      
      // Create a destination record
      const destinationResponse = await fetch('/api/destinations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: currentDestination.name,
          description: currentDestination.why_it_fits,
          recommendation_id: id,
          why_it_fits: currentDestination.why_it_fits
        }),
      });
      
      if (!destinationResponse.ok) {
        throw new Error('Failed to save destination');
      }
      
      const destinationData = await destinationResponse.json();
      const destinationId = destinationData.id;
      
      // Save places to visit
      if (placesToSave.length > 0) {
        const placesResponse = await fetch('/api/places-to-visit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            destination_id: destinationId,
            places: placesToSave.map(place => ({ name: place }))
          }),
        });
        
        if (!placesResponse.ok) {
          throw new Error('Failed to save places to visit');
        }
      }
      
      // Save restaurants
      if (restaurantsToSave.length > 0) {
        const restaurantsResponse = await fetch('/api/restaurants', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            destination_id: destinationId,
            restaurants: restaurantsToSave.map(restaurant => ({ name: restaurant }))
          }),
        });
        
        if (!restaurantsResponse.ok) {
          throw new Error('Failed to save restaurants');
        }
      }
      
      // Save activities
      if (activitiesToSave.length > 0) {
        const activitiesResponse = await fetch('/api/activities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            destination_id: destinationId,
            activities: activitiesToSave.map(activity => ({ name: activity }))
          }),
        });
        
        if (!activitiesResponse.ok) {
          throw new Error('Failed to save activities');
        }
      }
      
      // Save accommodations
      if (accommodationsToSave.length > 0) {
        const accommodationsResponse = await fetch('/api/accommodations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            destination_id: destinationId,
            accommodations: accommodationsToSave.map(accommodation => ({ name: accommodation }))
          }),
        });
        
        if (!accommodationsResponse.ok) {
          throw new Error('Failed to save accommodations');
        }
      }
      
      setSaveSuccess(true);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
        // Refresh destinations data
        window.location.reload();
      }, 3000);
      
    } catch (err: any) {
      console.error('Error saving data:', err);
      setSaveError(err.message || 'Failed to save data to database');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleGoBack = () => {
    router.push('/dashboard/view-all-recommendations');
  };

  const handleGenerateRoutePlans = async () => {
    setIsGeneratingRoute(true);
    setRouteSuccess(false);
    setRouteError(null);

    try {
      if (!displayDestinations[value]) {
        setRouteError('Destination information is missing');
        setIsGeneratingRoute(false);
        return;
      }

      // Create a safe version of the destination that satisfies EnhancedDestination
      const destination = displayDestinations[value] as unknown as ParsedDestination;
      
      const enhancedDestination = {
        id: destination.id || crypto.randomUUID(),
        recommendation_id: destination.recommendation_id || id,
        name: destination.name,
        why_it_fits: destination.whyItFits || destination.why_it_fits || "",
        places_to_visit: destination.placesToVisit || destination.places_to_visit || [],
        restaurants: destination.restaurants || [],
        activities: destination.activities || [],
        accommodations: destination.accommodations || []
      } as EnhancedDestination;

      // Create the prompt for OpenAI
      const recDetails = recommendation as unknown as {
        duration?: string;
        travelers?: string;
        budget?: string;
        interests?: string[];
      };

      let prompt = "Create a ";
      prompt += recDetails?.duration || 'multi-day';
      prompt += " travel itinerary for ";
      prompt += recDetails?.travelers || 'travelers';
      prompt += " visiting " + destination.name + ".\n";
      prompt += "Budget: " + (recDetails?.budget || 'moderate') + "\n";
      prompt += "Interests: " + (recDetails?.interests?.join(', ') || 'general tourism') + "\n\n";
      
      prompt += "Places to visit: " + enhancedDestination.places_to_visit.map(p => p.name).join(', ') + "\n";
      prompt += "Restaurants: " + enhancedDestination.restaurants.map(r => r.name).join(', ') + "\n";
      prompt += "Activities: " + enhancedDestination.activities.map(a => a.name).join(', ') + "\n";
      prompt += "Accommodations: " + enhancedDestination.accommodations.map(a => a.name).join(', ') + "\n\n";
      
      prompt += "Create a daily plan with morning, afternoon, and evening activities. Organize it by day number.";

      // Get the current tab's customization input
      const currentTabInput = tabCustomizationInputs[value] || customizationInput;

      // Add customization if provided
      if (currentTabInput.trim()) {
        prompt += "\n\nAdditional instructions: " + currentTabInput;
      }

      // Save the prompt for display
      setLastPrompt(prompt);

      console.log("Generating itinerary with prompt:", prompt);

      // Call the OpenAI API
      const response = await fetch('/api/generate-itinerary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error generating itinerary (${response.status}):`, errorText);
        throw new Error('Failed to generate itinerary');
      }

      const data = await response.json();
      console.log("Generated itinerary data:", data);
      
      // Parse the response into daily plans
      const planText = data.content;
      
      // Split by days and create structured data
      const dayRegex = /Day (\d+):([\s\S]*?)(?=Day \d+:|$)/g;
      const days: Array<{day: string; content: string}> = [];
      
      let match;
      while ((match = dayRegex.exec(planText)) !== null) {
        const day = `Day ${match[1]}`;
        const content = match[2].trim();
        days.push({ day, content });
      }

      console.log("Parsed days:", days);

      // Save to the database
      console.log("Saving route plan to database...");
      const saveResponse = await fetch('/api/save-route-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recommendation_id: id,
          destination_name: destination.name,
          days: days
        }),
      });

      if (!saveResponse.ok) {
        const errorText = await saveResponse.text();
        console.error(`Error saving route plan (${saveResponse.status}):`, errorText);
        throw new Error('Failed to save route plan');
      }

      const saveData = await saveResponse.json();
      console.log("Save route plan response:", saveData);

      // Fetch the updated route plans
      await fetchRoutePlans();
      setRouteSuccess(true);
    } catch (error) {
      console.error('Error generating route plan:', error);
      setRouteError('Failed to generate route plan. Please try again.');
    } finally {
      setIsGeneratingRoute(false);
    }
  };

  const handleStartCustomizing = () => {
    setIsCustomizing(true);
    // Initialize with the current tab's saved input, if any
    setCustomizationInput(tabCustomizationInputs[value] || '');
  };

  const handleCancelCustomizing = () => {
    setIsCustomizing(false);
    setCustomizationInput('');
  };

  // Add delete handlers for each item type
  const handleDeletePlace = async (placeId: string) => {
    try {
      const response = await fetch(`/api/places-to-visit/${placeId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        alert('Failed to delete place. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting place:', error);
      alert('Error deleting place. Please try again.');
    }
  };
  
  const handleDeleteRestaurant = async (restaurantId: string) => {
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        window.location.reload();
      } else {
        alert('Failed to delete restaurant. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting restaurant:', error);
      alert('Error deleting restaurant. Please try again.');
    }
  };
  
  const handleDeleteActivity = async (activityId: string) => {
    try {
      const response = await fetch(`/api/activities/${activityId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        window.location.reload();
      } else {
        alert('Failed to delete activity. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting activity:', error);
      alert('Error deleting activity. Please try again.');
    }
  };
  
  const handleDeleteAccommodation = async (accommodationId: string) => {
    try {
      const response = await fetch(`/api/accommodations/${accommodationId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        window.location.reload();
      } else {
        alert('Failed to delete accommodation. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting accommodation:', error);
      alert('Error deleting accommodation. Please try again.');
    }
  };

  if (loadingRecommendation || loadingDestinations) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4, height: '100vh', alignItems: 'center', bgcolor: '#f8f8f8' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (recommendationError || destinationsError || parsingError) {
    return (
      <Box sx={{ p: 4, bgcolor: '#f8f8f8', minHeight: '100vh' }}>
        <Alert severity="error">{recommendationError || destinationsError || parsingError}</Alert>
      </Box>
    );
  }

  // Use database destinations if available, otherwise use parsed destinations
  const displayDestinations = dbDestinations.length > 0 
    ? dbDestinations 
    : parsedDestinations;

  if (!displayDestinations || displayDestinations.length === 0) {
    return (
      <Box sx={{ p: 4, bgcolor: '#f8f8f8', minHeight: '100vh' }}>
        <Alert severity="info">No destination details found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', bgcolor: '#f8f8f8', minHeight: '100vh', color: '#000' }}>
      {/* Header with back button */}
      <AppBar position="sticky" color="default" elevation={1} sx={{ bgcolor: 'white' }}>
        <Toolbar>
          <IconButton 
            edge="start" 
            color="inherit" 
            aria-label="back"
            onClick={handleGoBack}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {recommendation?.title || 'Travel Recommendation'}
          </Typography>
          {dbDestinations.length === 0 && (
            <Button 
              variant="contained" 
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSaveToDatabase}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save to Database'}
            </Button>
          )}
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Display original prompt if available */}
        {recommendation && (recommendation as any).metadata && (recommendation as any).metadata.original_prompt && (
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              p: 3,
              mb: 4,
              bgcolor: 'rgba(144, 202, 249, 0.08)',
              border: '1px solid rgba(144, 202, 249, 0.2)'
            }}
          >
            <Typography variant="subtitle1" fontWeight="600" color="primary" gutterBottom>
              Original Prompt
            </Typography>
            <Typography variant="body1">
              {(recommendation as any).metadata.original_prompt}
            </Typography>
          </Paper>
        )}
      
        <Paper 
          elevation={0} 
          sx={{ 
            borderRadius: 2, 
            overflow: 'hidden', 
            mb: 4,
            borderBottom: '1px solid #e0e0e0'
          }}
        >
          <Tabs
            value={value}
            onChange={handleChange}
            aria-label="destination tabs"
            variant="scrollable"
            scrollButtons="auto"
            sx={{ 
              bgcolor: 'white',
              '.MuiTab-root': {
                color: 'rgba(0, 0, 0, 0.7)',
                fontWeight: 500,
                '&.Mui-selected': {
                  color: 'black',
                  fontWeight: 600,
                }
              },
              '.MuiTabs-indicator': {
                height: 3
              }
            }}
          >
            {displayDestinations.map((destination, index) => (
              <Tab
                key={`tab-${index}`}
                label={destination.name}
                {...a11yProps(index)}
              />
            ))}
          </Tabs>
        </Paper>

        {/* Destination details */}
        <Box sx={{ width: '100%', maxWidth: '950px', mx: 'auto' }}>
          {displayDestinations.map((destination, index) => (
            <TabPanel key={`panel-${index}`} value={value} index={index}>
              <StyledSection>
                <Typography variant="h5" gutterBottom fontWeight="bold">
                  {destination.name}
                </Typography>
                <Typography variant="subtitle1" color="primary" fontWeight="medium" gutterBottom>
                  Why it fits your preference
                </Typography>
                <Typography variant="body1" paragraph align="justify">
                  {destination.why_it_fits || ""}
                </Typography>
              </StyledSection>
              
              {/* First Row */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
                <Box>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ p: 2 }}>
                      <Typography variant="h6" component="h3" gutterBottom>
                        Places to Visit
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                    </Box>
                    
                    {/* Places to Visit List - Fixed height */}
                    <List 
                      sx={{ 
                        overflow: 'auto', 
                        maxHeight: '280px',
                        minHeight: '280px',
                        width: '100%',
                        p: 0, 
                        flex: 1 
                      }}
                    >
                      {getDestinationProperty(destination, 'places_to_visit', 'placesToVisit').map((place: any, placeIndex: number) => (
                        <ContentItem key={`place-${placeIndex}`}>
                          <ListItemIcon>
                            <PlaceIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText primary={place.name} />
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => {
                              if (place.id) {
                                handleDeletePlace(place.id);
                              } else {
                                alert('Cannot delete this place as it has no ID');
                              }
                            }}
                          >
                            <CloseIcon />
                          </IconButton>
                        </ContentItem>
                      ))}
                      {customPlaces[index]?.map((place, idx) => (
                        <ContentItem key={`custom-place-${idx}`}>
                          <ListItemIcon>
                            <PlaceIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText primary={place} />
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => {
                              // Logic to delete custom place
                              const updatedPlaces = {...customPlaces};
                              updatedPlaces[index] = customPlaces[index].filter((_, i) => i !== idx);
                              setCustomPlaces(updatedPlaces);
                            }}
                          >
                            <CloseIcon />
                          </IconButton>
                        </ContentItem>
                      ))}
                    </List>
                    
                    <Box sx={{ p: 2 }}>
                      <AddButton
                        fullWidth
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog('place')}
                      >
                        ADD PLACE
                      </AddButton>
                    </Box>
                  </Card>
                </Box>
                
                <Box>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ p: 2 }}>
                      <Typography variant="h6" component="h3" gutterBottom>
                        Restaurants
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                    </Box>
                    
                    {/* Restaurants List - Fixed height */}
                    <List 
                      sx={{ 
                        overflow: 'auto', 
                        maxHeight: '280px',
                        minHeight: '280px',
                        width: '100%',
                        p: 0, 
                        flex: 1 
                      }}
                    >
                      {destination.restaurants && destination.restaurants.length > 0 && 
                        destination.restaurants.map((restaurant, restaurantIndex) => (
                          <ContentItem key={`restaurant-${restaurantIndex}`}>
                            <ListItemIcon>
                              <RestaurantIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText primary={restaurant.name} />
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => {
                                if (restaurant.id) {
                                  handleDeleteRestaurant(restaurant.id);
                                } else {
                                  alert('Cannot delete this restaurant as it has no ID');
                                }
                              }}
                            >
                              <CloseIcon />
                            </IconButton>
                          </ContentItem>
                        ))
                      }
                      {customRestaurants[index]?.map((restaurant, idx) => (
                        <ContentItem key={`custom-restaurant-${idx}`}>
                          <ListItemIcon>
                            <RestaurantIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText primary={restaurant} />
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => {
                              // Logic to delete custom restaurant
                              const updatedRestaurants = {...customRestaurants};
                              updatedRestaurants[index] = customRestaurants[index].filter((_, i) => i !== idx);
                              setCustomRestaurants(updatedRestaurants);
                            }}
                          >
                            <CloseIcon />
                          </IconButton>
                        </ContentItem>
                      ))}
                    </List>
                    
                    <Box sx={{ p: 2 }}>
                      <AddButton
                        fullWidth
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog('restaurant')}
                      >
                        ADD RESTAURANT
                      </AddButton>
                    </Box>
                  </Card>
                </Box>
              </Box>

              {/* Second Row */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2, mt: 2 }}>
                <Box>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ p: 2 }}>
                      <Typography variant="h6" component="h3" gutterBottom>
                        Activities
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                    </Box>
                    
                    {/* Activities List - Fixed height */}
                    <List 
                      sx={{ 
                        overflow: 'auto', 
                        maxHeight: '280px',
                        minHeight: '280px',
                        width: '100%',
                        p: 0, 
                        flex: 1 
                      }}
                    >
                      {destination.activities && destination.activities.length > 0 && 
                        destination.activities.map((activity, activityIndex) => (
                          <ContentItem key={`activity-${activityIndex}`}>
                            <ListItemIcon>
                              <DirectionsRunIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText primary={activity.name} />
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => {
                                if (activity.id) {
                                  handleDeleteActivity(activity.id);
                                } else {
                                  alert('Cannot delete this activity as it has no ID');
                                }
                              }}
                            >
                              <CloseIcon />
                            </IconButton>
                          </ContentItem>
                        ))
                      }
                      {customActivities[index]?.map((activity, idx) => (
                        <ContentItem key={`custom-activity-${idx}`}>
                          <ListItemIcon>
                            <DirectionsRunIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText primary={activity} />
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => {
                              // Logic to delete custom activity
                              const updatedActivities = {...customActivities};
                              updatedActivities[index] = customActivities[index].filter((_, i) => i !== idx);
                              setCustomActivities(updatedActivities);
                            }}
                          >
                            <CloseIcon />
                          </IconButton>
                        </ContentItem>
                      ))}
                    </List>
                    
                    <Box sx={{ p: 2 }}>
                      <AddButton
                        fullWidth
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog('activity')}
                      >
                        ADD ACTIVITY
                      </AddButton>
                    </Box>
                  </Card>
                </Box>
                
                <Box>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ p: 2 }}>
                      <Typography variant="h6" component="h3" gutterBottom>
                        Accommodations
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                    </Box>
                    
                    {/* Accommodations List - Fixed height */}
                    <List 
                      sx={{ 
                        overflow: 'auto', 
                        maxHeight: '280px',
                        minHeight: '280px',
                        width: '100%',
                        p: 0, 
                        flex: 1 
                      }}
                    >
                      {destination.accommodations && destination.accommodations.length > 0 && 
                        destination.accommodations.map((accommodation, accommodationIndex) => (
                          <ContentItem key={`accommodation-${accommodationIndex}`}>
                            <ListItemIcon>
                              <HotelIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText primary={accommodation.name} />
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => {
                                if (accommodation.id) {
                                  handleDeleteAccommodation(accommodation.id);
                                } else {
                                  alert('Cannot delete this accommodation as it has no ID');
                                }
                              }}
                            >
                              <CloseIcon />
                            </IconButton>
                          </ContentItem>
                        ))
                      }
                      {customAccommodations[index]?.map((accommodation, idx) => (
                        <ContentItem key={`custom-accommodation-${idx}`}>
                          <ListItemIcon>
                            <HotelIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText primary={accommodation} />
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => {
                              // Logic to delete custom accommodation
                              const updatedAccommodations = {...customAccommodations};
                              updatedAccommodations[index] = customAccommodations[index].filter((_, i) => i !== idx);
                              setCustomAccommodations(updatedAccommodations);
                            }}
                          >
                            <CloseIcon />
                          </IconButton>
                        </ContentItem>
                      ))}
                    </List>
                    
                    <Box sx={{ p: 2 }}>
                      <AddButton
                        fullWidth
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog('accommodation')}
                      >
                        ADD ACCOMMODATION
                      </AddButton>
                    </Box>
                  </Card>
                </Box>
              </Box>
              
              {/* Route Plans Section */}
              <Box sx={{ mt: 4 }}>
                <Typography variant="h5" component="h2" gutterBottom>
                  Route Plans
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, gap: 2 }}>
                  {isCustomizing ? (
                    <>
                      <Button
                        variant="outlined"
                        color="secondary"
                        onClick={handleCancelCustomizing}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleGenerateRoutePlans}
                        disabled={isGeneratingRoute}
                        startIcon={isGeneratingRoute ? <CircularProgress size={20} /> : <RouteIcon />}
                      >
                        {isGeneratingRoute ? 'Generating...' : 'Generate Custom Plan'}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={handleStartCustomizing}
                        startIcon={<EditIcon />}
                      >
                        Customize
                      </Button>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleGenerateRoutePlans}
                        disabled={isGeneratingRoute}
                        startIcon={isGeneratingRoute ? <CircularProgress size={20} /> : <RouteIcon />}
                      >
                        {isGeneratingRoute ? 'Generating...' : 'Generate Route Plans'}
                      </Button>
                    </>
                  )}
                </Box>

                {/* Get the current destination name */}
                {(() => {
                  // Get the current destination name
                  const currentDestinationName = displayDestinations[value]?.name;
                  
                  return (
                    <>
                      {/* Only show customization UI for the current tab */}
                      {isCustomizing && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle1" gutterBottom>
                            Customize Your Route Plan
                          </Typography>
                          <TextField
                            fullWidth
                            multiline
                            rows={4}
                            variant="outlined"
                            placeholder="Add specific instructions, e.g., 'Focus on outdoor activities', 'Include more family-friendly options', 'Plan for rainy weather', etc."
                            value={customizationInput}
                            onChange={(e) => {
                              setCustomizationInput(e.target.value);
                              // Save the input for this specific tab
                              setTabCustomizationInputs(prev => ({
                                ...prev,
                                [value]: e.target.value
                              }));
                            }}
                            sx={{ mb: 2 }}
                          />
                        </Box>
                      )}

                      {/* Filter route plans for the current destination */}
                      {(() => {
                        // Filter route plans for the current destination
                        const filteredRoutePlans = routePlans.filter(plan => 
                          plan.destination_name === currentDestinationName
                        );
                        
                        return (
                          <>
                            {/* Only show prompt for the current destination's plans */}
                            {filteredRoutePlans.length > 0 && lastPrompt && (
                              <Paper sx={{ p: 2, mb: 3, backgroundColor: '#f5f5f5' }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                  Prompt Used For Generation:
                                </Typography>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    whiteSpace: 'pre-wrap', 
                                    fontSize: '0.8rem',
                                    color: 'text.secondary',
                                    maxHeight: '150px',
                                    overflow: 'auto'
                                  }}
                                >
                                  {lastPrompt}
                                </Typography>
                              </Paper>
                            )}
                            
                            {/* Display destination-specific route plans */}
                            {filteredRoutePlans.length > 0 ? (
                              filteredRoutePlans.map((plan, planIndex) => (
                                <Accordion key={plan.id || planIndex} sx={{ mb: 1 }}>
                                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Typography>Route Plan {planIndex + 1}</Typography>
                                  </AccordionSummary>
                                  <AccordionDetails>
                                    {Array.isArray(plan.days) ? plan.days.map((day) => (
                                      <Box key={day.dayNumber} sx={{ mb: 2 }}>
                                        <Typography variant="h6">Day {day.dayNumber}</Typography>
                                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                                          <Box>
                                            <Typography variant="subtitle1">Morning</Typography>
                                            <List>
                                              {typeof day.morning === 'string' ? (
                                                <ListItem>
                                                  <ListItemText primary={day.morning} />
                                                </ListItem>
                                              ) : Array.isArray(day.morning) && day.morning.map((activity, actIndex) => (
                                                <ListItem key={actIndex}>
                                                  <ListItemText
                                                    primary={activity.name}
                                                    secondary={activity.description}
                                                  />
                                                </ListItem>
                                              ))}
                                            </List>
                                          </Box>
                                          <Box>
                                            <Typography variant="subtitle1">Afternoon</Typography>
                                            <List>
                                              {typeof day.afternoon === 'string' ? (
                                                <ListItem>
                                                  <ListItemText primary={day.afternoon} />
                                                </ListItem>
                                              ) : Array.isArray(day.afternoon) && day.afternoon.map((activity, actIndex) => (
                                                <ListItem key={actIndex}>
                                                  <ListItemText
                                                    primary={activity.name}
                                                    secondary={activity.description}
                                                  />
                                                </ListItem>
                                              ))}
                                            </List>
                                          </Box>
                                          <Box>
                                            <Typography variant="subtitle1">Evening</Typography>
                                            <List>
                                              {typeof day.evening === 'string' ? (
                                                <ListItem>
                                                  <ListItemText primary={day.evening} />
                                                </ListItem>
                                              ) : Array.isArray(day.evening) && day.evening.map((activity, actIndex) => (
                                                <ListItem key={actIndex}>
                                                  <ListItemText
                                                    primary={activity.name}
                                                    secondary={activity.description}
                                                  />
                                                </ListItem>
                                              ))}
                                            </List>
                                          </Box>
                                        </Box>
                                      </Box>
                                    )) : (
                                      <Typography color="error">
                                        Error: Days data is not in the expected format
                                      </Typography>
                                    )}
                                  </AccordionDetails>
                                </Accordion>
                              ))
                            ) : (
                              <Paper sx={{ p: 2, textAlign: 'center' }}>
                                <Typography variant="body1" color="textSecondary">
                                  No route plans available for {currentDestinationName}. Generate a plan to see optimized itineraries.
                                </Typography>
                              </Paper>
                            )}
                          </>
                        );
                      })()}
                    </>
                  );
                })()}
              </Box>
            </TabPanel>
          ))}
        </Box>
      </Container>
      
      {/* Add Item Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Add {dialogType === 'place' ? 'Place to Visit' : 
               dialogType === 'restaurant' ? 'Restaurant' : 
               dialogType === 'activity' ? 'Activity' : 'Accommodation'}
          <IconButton
            aria-label="close"
            onClick={handleCloseDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={`Enter ${dialogType} name`}
            type="text"
            fullWidth
            variant="outlined"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleAddItem} color="primary" variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Success notification */}
      <Snackbar
        open={saveSuccess}
        autoHideDuration={3000}
        onClose={() => setSaveSuccess(false)}
        message="Data saved successfully to database"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
      
      {/* Error notification */}
      <Snackbar
        open={!!saveError}
        autoHideDuration={5000}
        onClose={() => setSaveError(null)}
        message={saveError || 'Error saving data'}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />

      {/* Route plan generation success/error notification */}
      <Snackbar
        open={routeSuccess}
        autoHideDuration={3000}
        onClose={() => setRouteSuccess(false)}
        message="Route plans generated and saved successfully"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />

      <Snackbar
        open={!!routeError}
        autoHideDuration={5000}
        onClose={() => setRouteError(null)}
        message={routeError || 'Error generating route plans'}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
} 