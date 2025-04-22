'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { usePreferences } from '@/context/PreferencesContext';
import { generatePrompt } from '@/utils/promptGenerator';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

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
      <div className="rounded-lg shadow-xl bg-gray-900 overflow-hidden mb-8 border border-gray-800">
        <div className="relative h-64 mb-6">
          <Image
            src={image || '/placeholder-image.jpg'}
            alt={destinationName}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
          <div className="absolute bottom-4 left-4 right-4">
            <h2 className="text-4xl font-bold text-white drop-shadow-lg">{destinationName}</h2>
          </div>
        </div>

        <div className="px-6 mb-6">
          <p className="text-gray-200 text-lg italic">{destinationDetails.description}</p>
        </div>

        <div className="px-6 pb-6 overflow-y-auto max-h-[calc(100vh-500px)] custom-scrollbar">
          {destinationDetails.whyFits && (
            <div className="mb-6 bg-gray-800/50 p-4 rounded-lg shadow-inner">
              <h3 className="flex items-center text-xl font-semibold text-blue-400 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Why This Fits Your Preferences
              </h3>
              <div className="text-gray-200 whitespace-pre-line">
                {destinationDetails.whyFits}
              </div>
            </div>
          )}

          {destinationDetails.placesToVisit && (
            <div className="mb-6 bg-gray-800/50 p-4 rounded-lg shadow-inner">
              <h3 className="flex items-center text-xl font-semibold text-blue-400 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Places to Visit
              </h3>
              <div className="text-gray-200 whitespace-pre-line">
                {destinationDetails.placesToVisit}
              </div>
            </div>
          )}

          {destinationDetails.restaurants && (
            <div className="mb-6 bg-gray-800/50 p-4 rounded-lg shadow-inner">
              <h3 className="flex items-center text-xl font-semibold text-blue-400 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                </svg>
                Restaurants You Should Try
              </h3>
              <div className="text-gray-200 whitespace-pre-line">
                {destinationDetails.restaurants}
              </div>
            </div>
          )}

          {destinationDetails.activities && (
            <div className="mb-6 bg-gray-800/50 p-4 rounded-lg shadow-inner">
              <h3 className="flex items-center text-xl font-semibold text-blue-400 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
                Activities for Your Trip
              </h3>
              <div className="text-gray-200 whitespace-pre-line">
                {destinationDetails.activities}
              </div>
            </div>
          )}

          {destinationDetails.accommodations && (
            <div className="mb-6 bg-gray-800/50 p-4 rounded-lg shadow-inner">
              <h3 className="flex items-center text-xl font-semibold text-blue-400 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                Accommodation Recommendations
              </h3>
              <div className="text-gray-200 whitespace-pre-line">
                {destinationDetails.accommodations}
              </div>
            </div>
          )}
        </div>
      </div>
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
    <div className="flex flex-col min-h-screen bg-black">
      <Header />
      
      <main className="flex-grow flex items-center justify-center py-8">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold text-center text-white mb-12">Your Travel Recommendations</h1>
          
          {isDemoData && (
            <div className="max-w-4xl mx-auto mb-6 bg-blue-900/50 border border-blue-400 rounded-lg p-4 text-white">
              <p className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                </svg>
                <span>
                  <strong>Demo Mode:</strong> You're viewing example recommendations. To see personalized results, set up an OpenAI API key in your .env.local file.
                </span>
              </p>
            </div>
          )}
          
          <div className="max-w-4xl mx-auto bg-gray-900 rounded-lg shadow-lg p-8 md:p-10 text-white">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-blue-400 mb-6"></div>
                <p className="text-xl text-gray-300 mb-2">Generating your personalized travel recommendations...</p>
                <p className="text-gray-400 text-sm">This may take a moment</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-400 text-xl mb-6">{error}</p>
                <button 
                  onClick={handleBackToPreferences}
                  className="px-8 py-3 bg-blue-800 text-white rounded-lg hover:bg-blue-700 text-lg"
                >
                  Back to Preferences
                </button>
              </div>
            ) : (
              <div className="recommendation-content">
                {parsedDestinations.length > 0 ? (
                  <>
                    <div className="min-h-[400px] mb-8">
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
                    </div>
                    
                    <div className="flex justify-between items-center mb-10">
                      <button 
                        onClick={prevDestination}
                        disabled={currentDestination === 0}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                          currentDestination === 0 
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                            : 'bg-blue-900 text-white hover:bg-blue-800'
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Previous
                      </button>
                      
                      <div className="text-center text-gray-400">
                        {currentDestination + 1} / {parsedDestinations.length}
                      </div>
                      
                      <button 
                        onClick={nextDestination}
                        disabled={currentDestination === parsedDestinations.length - 1}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                          currentDestination === parsedDestinations.length - 1 
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                            : 'bg-blue-900 text-white hover:bg-blue-800'
                        }`}
                      >
                        Next
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="mt-12 flex justify-center">
                      <button 
                        onClick={() => router.push('/route-planner')}
                        className="px-8 py-4 bg-blue-700 text-white rounded-lg hover:bg-blue-600 text-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl w-full max-w-md flex items-center justify-center gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                        Plan Route
                      </button>
                    </div>
                    
                    <div className="mt-6 flex justify-center">
                      <button 
                        onClick={handleBackToPreferences}
                        className="text-gray-400 hover:text-white transition-colors duration-300 text-sm"
                      >
                        Edit Preferences
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="prose max-w-none prose-invert">
                    <p className="text-gray-300">No destination recommendations found. Please try again.</p>
                    <button 
                      onClick={handleBackToPreferences}
                      className="mt-6 px-8 py-3 bg-blue-800 text-white rounded-lg hover:bg-blue-700 text-lg"
                    >
                      Back to Preferences
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 