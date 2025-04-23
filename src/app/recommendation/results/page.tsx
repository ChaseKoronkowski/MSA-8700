'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { usePreferences } from '@/context/PreferencesContext';
import { generatePrompt } from '@/utils/promptGenerator';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Box, Container, Typography, Button, CircularProgress, Card, CardContent, Chip, Alert, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import InfoIcon from '@mui/icons-material/Info';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import HomeIcon from '@mui/icons-material/Home';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DirectionsIcon from '@mui/icons-material/Directions';
import LocalActivityIcon from '@mui/icons-material/LocalActivity';
import MapIcon from '@mui/icons-material/Map';
import EditIcon from '@mui/icons-material/Edit';

// Define the DestinationDetails interface
interface DestinationDetails {
  description?: string;
  whyFits?: string;
  placesToVisit?: string;
  restaurants?: string;
  activities?: string;
  accommodations?: string;
}

export default function ResultsPage() {
  const router = useRouter();
  const { preferences, recommendation, setRecommendation } = usePreferences();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemoData, setIsDemoData] = useState(false);
  const [currentDestination, setCurrentDestination] = useState(0);
  const [parsedDestinations, setParsedDestinations] = useState<any[]>([]);
  const [destinationImages, setDestinationImages] = useState<Record<string, string>>({});
  const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const prompt = generatePrompt(preferences);
        
        const response = await fetch('/api/openai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to generate recommendation');
        }
        
        setRecommendation(data.recommendation);
        
        // Check if we're using demo data by looking for specific phrases
        if (data.recommendation.includes('Barcelona, Spain') && 
            data.recommendation.includes('Kyoto, Japan') && 
            data.recommendation.includes('Costa Rica')) {
          setIsDemoData(true);
        }
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setError('Sorry, we encountered an error while generating your recommendations. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if there's no existing recommendation
    if (!recommendation) {
      fetchRecommendations();
    } else {
      setLoading(false);
      // Check if we're using demo data for an existing recommendation
      if (recommendation.includes('Barcelona, Spain') && 
          recommendation.includes('Kyoto, Japan') && 
          recommendation.includes('Costa Rica')) {
        setIsDemoData(true);
      }
    }
  }, [preferences, recommendation, setRecommendation]);

  useEffect(() => {
    if (recommendation) {
      // Parse the recommendation text into destination cards
      const destinations = parseRecommendation(recommendation);
      setParsedDestinations(destinations);
      
      // Initialize image loading state
      const loadingState: Record<string, boolean> = {};
      destinations.forEach((dest, index) => {
        loadingState[index] = true;
      });
      setImageLoading(loadingState);
      
      // Fetch images for each destination
      destinations.forEach((destination, index) => {
        fetchDestinationImage(destination.name, index);
      });
    }
  }, [recommendation]);

  const fetchDestinationImage = async (destinationName: string, index: number) => {
    try {
      const response = await fetch(`/api/unsplash?query=${encodeURIComponent(destinationName)}`);
      const data = await response.json();
      
      if (response.ok && data.imageUrl) {
        setDestinationImages(prev => ({
          ...prev,
          [index]: data.imageUrl
        }));
      } else {
        console.error('Failed to fetch image for', destinationName);
      }
    } catch (err) {
      console.error('Error fetching image:', err);
    } finally {
      setImageLoading(prev => ({
        ...prev,
        [index]: false
      }));
    }
  };

  const handleBackToPreferences = () => {
    router.push('/recommendation');
  };

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

    // Additional validation - ensure each destination has all sections populated
    // If a destination is split across multiple entries, merge them
    const mergedDestinations = [];
    const nameMap = new Map();
    
    for (const dest of destinations) {
      const baseName = dest.name.split(',')[0].trim();
      
      if (nameMap.has(baseName)) {
        // Merge with existing destination
        const existingIndex = nameMap.get(baseName);
        const existing = mergedDestinations[existingIndex];
        
        // Merge sections that are empty in existing but populated in current
        for (const key of Object.keys(dest)) {
          if (key === 'name') continue; // Keep the original name
          
          if (!existing[key] && dest[key]) {
            existing[key] = dest[key];
          } else if (existing[key] && dest[key] && key !== 'description') {
            // Append non-duplicate content
            existing[key] += '\n' + dest[key];
          }
        }
      } else {
        // Add as new destination
        mergedDestinations.push({...dest});
        nameMap.set(baseName, mergedDestinations.length - 1);
      }
    }
    
    return mergedDestinations;
  };

  const formatDestinationCard = (
    destinationName: string,
    destinationDetails: DestinationDetails,
    image: string
  ) => {
    return (
      <Box>
        <Card 
          sx={{ 
            backgroundColor: '#333333',
            color: 'white',
            borderRadius: 2,
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.05)',
            mb: 4
          }}
        >
          <Box sx={{ position: 'relative', height: '260px', width: '100%' }}>
            {image ? (
              <Box 
                component="img"
                src={image}
                alt={destinationName}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <Box 
                sx={{ 
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#444444'
                }}
              >
                <CircularProgress sx={{ color: '#90caf9' }} />
              </Box>
            )}
            <Box 
              sx={{ 
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
                padding: 3,
                paddingTop: 6
              }}
            >
              <Typography variant="h4" component="h2" sx={{ fontWeight: 500, textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
                {destinationName}
              </Typography>
            </Box>
          </Box>

          <CardContent sx={{ p: 3 }}>
            {destinationDetails.description && (
              <Typography 
                variant="body1" 
                sx={{ 
                  mb: 3,
                  color: 'rgba(255, 255, 255, 0.9)',
                  lineHeight: 1.6
                }}
              >
                {destinationDetails.description}
              </Typography>
            )}

            {destinationDetails.whyFits && (
              <Box 
                sx={{ 
                  mb: 3,
                  p: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 2,
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
                <Typography 
                  variant="subtitle1"
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    color: '#90caf9',
                    fontWeight: 500,
                    mb: 1
                  }}
                >
                  <InfoIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                  Why This Fits
                </Typography>
                <Typography 
                  variant="body2"
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.8)',
                    whiteSpace: 'pre-line'
                  }}
                >
                  {destinationDetails.whyFits}
                </Typography>
              </Box>
            )}

            {destinationDetails.placesToVisit && (
              <Box 
                sx={{ 
                  mb: 3,
                  p: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 2,
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
                <Typography 
                  variant="subtitle1"
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    color: '#90caf9',
                    fontWeight: 500,
                    mb: 1
                  }}
                >
                  <LocationOnIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                  Places to Visit
                </Typography>
                <Typography 
                  variant="body2"
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.8)',
                    whiteSpace: 'pre-line'
                  }}
                >
                  {destinationDetails.placesToVisit}
                </Typography>
              </Box>
            )}

            {destinationDetails.restaurants && (
              <Box 
                sx={{ 
                  mb: 3,
                  p: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 2,
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
                <Typography 
                  variant="subtitle1"
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    color: '#90caf9',
                    fontWeight: 500,
                    mb: 1
                  }}
                >
                  <RestaurantIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                  Restaurants You Should Try
                </Typography>
                <Typography 
                  variant="body2"
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.8)',
                    whiteSpace: 'pre-line'
                  }}
                >
                  {destinationDetails.restaurants}
                </Typography>
              </Box>
            )}

            {destinationDetails.activities && (
              <Box 
                sx={{ 
                  mb: 3,
                  p: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 2,
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
                <Typography 
                  variant="subtitle1"
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    color: '#90caf9',
                    fontWeight: 500,
                    mb: 1
                  }}
                >
                  <LocalActivityIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                  Activities for Your Trip
                </Typography>
                <Typography 
                  variant="body2"
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.8)',
                    whiteSpace: 'pre-line'
                  }}
                >
                  {destinationDetails.activities}
                </Typography>
              </Box>
            )}

            {destinationDetails.accommodations && (
              <Box 
                sx={{ 
                  mb: 3,
                  p: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 2,
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
                <Typography 
                  variant="subtitle1"
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    color: '#90caf9',
                    fontWeight: 500,
                    mb: 1
                  }}
                >
                  <HomeIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                  Accommodation Recommendations
                </Typography>
                <Typography 
                  variant="body2"
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.8)',
                    whiteSpace: 'pre-line'
                  }}
                >
                  {destinationDetails.accommodations}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    );
  };

  const nextDestination = () => {
    if (currentDestination < parsedDestinations.length - 1) {
      setCurrentDestination(currentDestination + 1);
    }
  };

  const prevDestination = () => {
    if (currentDestination > 0) {
      setCurrentDestination(currentDestination - 1);
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
      
      <Box sx={{ flexGrow: 1, display: 'flex', py: 4 }}>
        <Container maxWidth="xl">
          <Typography 
            variant="h4" 
            component="h1"
            align="center" 
            fontWeight="700"
            sx={{ 
              mb: 3,
              color: '#f5f5f5'
            }}
          >
            Your Travel Recommendations
          </Typography>
          
          {isDemoData && (
            <Alert 
              severity="info" 
              sx={{ 
                maxWidth: '900px', 
                mx: 'auto', 
                mb: 3,
                backgroundColor: 'rgba(144, 202, 249, 0.15)',
                color: '#f5f5f5',
                '& .MuiAlert-icon': {
                  color: '#90caf9'
                }
              }}
            >
              <Typography variant="body2">
                <strong>Demo Mode:</strong> You're viewing example recommendations. To see personalized results, set up an OpenAI API key in your .env.local file.
              </Typography>
            </Alert>
          )}
          
          <Box 
            sx={{ 
              maxWidth: '900px', 
              mx: 'auto',
              backgroundColor: '#333333',
              borderRadius: 2,
              boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
              p: 4,
              border: '1px solid rgba(255,255,255,0.05)'
            }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8 }}>
                <CircularProgress size={60} sx={{ color: '#90caf9', mb: 3 }} />
                <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                  Generating your personalized travel recommendations...
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  This may take a moment
                </Typography>
              </Box>
            ) : error ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="h6" sx={{ color: '#f44336', mb: 3 }}>
                  {error}
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleBackToPreferences}
                  sx={{
                    backgroundColor: '#90caf9',
                    color: '#000',
                    '&:hover': {
                      backgroundColor: '#6ba8de',
                    },
                    textTransform: 'none',
                    fontWeight: 500,
                    py: 1,
                    px: 3,
                    borderRadius: 2
                  }}
                >
                  Back to Preferences
                </Button>
              </Box>
            ) : (
              <Box>
                {parsedDestinations.length > 0 ? (
                  <>
                    <Box sx={{ minHeight: '400px', mb: 4 }}>
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={currentDestination}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3 }}
                        >
                          {formatDestinationCard(parsedDestinations[currentDestination].name, parsedDestinations[currentDestination], destinationImages[currentDestination])}
                        </motion.div>
                      </AnimatePresence>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 5 }}>
                      <Button
                        variant="outlined"
                        startIcon={<ArrowBackIcon />}
                        onClick={prevDestination}
                        disabled={currentDestination === 0}
                        sx={{
                          borderColor: currentDestination === 0 ? 'rgba(255, 255, 255, 0.1)' : '#90caf9',
                          color: currentDestination === 0 ? 'rgba(255, 255, 255, 0.3)' : '#90caf9',
                          '&:hover': {
                            backgroundColor: 'rgba(144, 202, 249, 0.08)',
                            borderColor: '#90caf9'
                          },
                          textTransform: 'none'
                        }}
                      >
                        Previous
                      </Button>
                      
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                        {currentDestination + 1} / {parsedDestinations.length}
                      </Typography>
                      
                      <Button
                        variant="outlined"
                        endIcon={<ArrowForwardIcon />}
                        onClick={nextDestination}
                        disabled={currentDestination === parsedDestinations.length - 1}
                        sx={{
                          borderColor: currentDestination === parsedDestinations.length - 1 ? 'rgba(255, 255, 255, 0.1)' : '#90caf9',
                          color: currentDestination === parsedDestinations.length - 1 ? 'rgba(255, 255, 255, 0.3)' : '#90caf9',
                          '&:hover': {
                            backgroundColor: 'rgba(144, 202, 249, 0.08)',
                            borderColor: '#90caf9'
                          },
                          textTransform: 'none'
                        }}
                      >
                        Next
                      </Button>
                    </Box>
                    
                    <Box sx={{ mt: 5, display: 'flex', justifyContent: 'center' }}>
                      <Button
                        variant="contained"
                        startIcon={<MapIcon />}
                        onClick={() => router.push('/route-planner')}
                        sx={{
                          backgroundColor: '#90caf9',
                          color: '#000',
                          '&:hover': {
                            backgroundColor: '#6ba8de',
                          },
                          textTransform: 'none',
                          fontWeight: 500,
                          py: 1.5,
                          px: 4,
                          borderRadius: 2,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                          width: '100%',
                          maxWidth: '400px'
                        }}
                      >
                        Plan Route
                      </Button>
                    </Box>
                    
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                      <Button
                        variant="text"
                        startIcon={<EditIcon />}
                        onClick={handleBackToPreferences}
                        sx={{
                          color: 'rgba(255, 255, 255, 0.5)',
                          '&:hover': {
                            color: 'rgba(255, 255, 255, 0.8)',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)'
                          },
                          textTransform: 'none'
                        }}
                      >
                        Edit Preferences
                      </Button>
                    </Box>
                  </>
                ) : (
                  <Box sx={{ py: 4 }}>
                    <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
                      No destination recommendations found. Please try again.
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={handleBackToPreferences}
                      sx={{
                        backgroundColor: '#90caf9',
                        color: '#000',
                        '&:hover': {
                          backgroundColor: '#6ba8de',
                        },
                        textTransform: 'none',
                        fontWeight: 500,
                        py: 1,
                        px: 3,
                        borderRadius: 2
                      }}
                    >
                      Back to Preferences
                    </Button>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Container>
      </Box>
    </Box>
  );
} 