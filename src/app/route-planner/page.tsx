'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { usePreferences } from '@/context/PreferencesContext';

export default function RoutePlannerPage() {
  const router = useRouter();
  const { recommendation, setRoutePlan } = usePreferences();
  const [destinations, setDestinations] = useState<string[]>([]);
  const [newDestination, setNewDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const addDestination = () => {
    if (newDestination.trim()) {
      setDestinations([...destinations, newDestination.trim()]);
      setNewDestination('');
    }
  };
  
  const removeDestination = (index: number) => {
    setDestinations(destinations.filter((_, i) => i !== index));
  };
  
  const moveDestination = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === destinations.length - 1)
    ) {
      return;
    }
    
    const newDestinations = [...destinations];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    [newDestinations[index], newDestinations[targetIndex]] = 
      [newDestinations[targetIndex], newDestinations[index]];
    
    setDestinations(newDestinations);
  };

  // Parse recommendation data for better display
  const parsedRecommendation = () => {
    if (!recommendation) return null;
    
    // Parse out sections
    const placesMatch = recommendation.match(/Places to Visit[^]*?(?=Restaurants|$)/i);
    const restaurantsMatch = recommendation.match(/Restaurants You Should Try[^]*?(?=Activities|$)/i);
    const activitiesMatch = recommendation.match(/Activities for Your Trip[^]*?(?=Accommodation|$)/i);
    const accommodationsMatch = recommendation.match(/Accommodation Recommendations[^]*?(?=$)/i);
    
    return {
      places: placesMatch ? placesMatch[0] : '',
      restaurants: restaurantsMatch ? restaurantsMatch[0] : '',
      activities: activitiesMatch ? activitiesMatch[0] : '',
      accommodations: accommodationsMatch ? accommodationsMatch[0] : ''
    };
  };

  // Extract key information from the recommendation to use in the route planning
  const extractRecommendationData = () => {
    if (!recommendation) return '';
    
    // Parse out places, restaurants, activities, and accommodations
    const placesMatch = recommendation.match(/Places to Visit[^]*?(?=Restaurants|$)/i);
    const restaurantsMatch = recommendation.match(/Restaurants You Should Try[^]*?(?=Activities|$)/i);
    const activitiesMatch = recommendation.match(/Activities for Your Trip[^]*?(?=Accommodation|$)/i);
    const accommodationsMatch = recommendation.match(/Accommodation Recommendations[^]*?(?=$)/i);
    
    const places = placesMatch ? placesMatch[0] : '';
    const restaurants = restaurantsMatch ? restaurantsMatch[0] : '';
    const activities = activitiesMatch ? activitiesMatch[0] : '';
    const accommodations = accommodationsMatch ? accommodationsMatch[0] : '';
    
    return `
Places to Visit
${places}

Restaurants You Should Try
${restaurants}

Activities for Your Trip
${activities}

Accommodation Recommendations
${accommodations}
`;
  };
  
  const handleGenerateRoutePlan = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const recommendationData = extractRecommendationData();
      
      if (!recommendationData.trim()) {
        setError('Unable to extract recommendation data. Please go back and regenerate your recommendations.');
        setLoading(false);
        return;
      }
      
      const response = await fetch('/api/generateRoutePlan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recommendationData }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate route plan');
      }
      
      // Save the route plan and navigate to results
      setRoutePlan(data.routePlan);
      router.push('/route-planner/results');
    } catch (err: any) {
      console.error('Error generating route plan:', err);
      setError(err.message || 'Failed to generate route plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const recData = parsedRecommendation();
  
  return (
    <div className="flex flex-col min-h-screen bg-black">
      <Header />
      
      <main className="flex-grow py-8">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold text-center text-white mb-12">Plan Your Route</h1>
          
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              {recommendation && recData && (
                <div className="mb-8 bg-gray-900 shadow-lg rounded-lg p-8 text-white">
                  <h2 className="text-3xl font-bold mb-8 text-blue-300">Your Travel Recommendations</h2>
                  
                  {recData.places && (
                    <div className="mb-10 bg-gray-800/50 p-6 rounded-lg shadow-inner">
                      <h3 className="flex items-center text-2xl font-semibold text-blue-400 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        Places to Visit
                      </h3>
                      <div className="text-gray-200 whitespace-pre-line text-lg leading-relaxed">
                        {recData.places}
                      </div>
                    </div>
                  )}
                  
                  {recData.restaurants && (
                    <div className="mb-10 bg-gray-800/50 p-6 rounded-lg shadow-inner">
                      <h3 className="flex items-center text-2xl font-semibold text-blue-400 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                        </svg>
                        Restaurants You Should Try
                      </h3>
                      <div className="text-gray-200 whitespace-pre-line text-lg leading-relaxed">
                        {recData.restaurants}
                      </div>
                    </div>
                  )}
                  
                  {recData.activities && (
                    <div className="mb-10 bg-gray-800/50 p-6 rounded-lg shadow-inner">
                      <h3 className="flex items-center text-2xl font-semibold text-blue-400 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                        </svg>
                        Activities for Your Trip
                      </h3>
                      <div className="text-gray-200 whitespace-pre-line text-lg leading-relaxed">
                        {recData.activities}
                      </div>
                    </div>
                  )}
                  
                  {recData.accommodations && (
                    <div className="mb-4 bg-gray-800/50 p-6 rounded-lg shadow-inner">
                      <h3 className="flex items-center text-2xl font-semibold text-blue-400 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                        </svg>
                        Accommodation Recommendations
                      </h3>
                      <div className="text-gray-200 whitespace-pre-line text-lg leading-relaxed">
                        {recData.accommodations}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="lg:col-span-4">
              <div className="bg-gray-900 shadow-lg rounded-lg p-8 mb-8 text-white sticky top-4">
                <h2 className="text-2xl font-bold mb-6 text-blue-300">Customize Your Route</h2>
                
                <div className="flex gap-3 mb-8">
                  <input
                    type="text"
                    value={newDestination}
                    onChange={(e) => setNewDestination(e.target.value)}
                    placeholder="Enter destination"
                    className="flex-grow border border-gray-700 bg-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    onClick={addDestination}
                    className="bg-blue-800 text-white px-4 py-3 rounded-lg hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                
                <div className="destinations-list mb-8">
                  <h3 className="text-xl font-semibold mb-5 text-blue-300">Your Route Plan</h3>
                  
                  {destinations.length === 0 ? (
                    <p className="text-gray-400 italic">No destinations added yet. Add destinations to start planning your route.</p>
                  ) : (
                    <ul className="space-y-4">
                      {destinations.map((destination, index) => (
                        <li key={index} className="flex items-center justify-between bg-gray-800 p-4 rounded-lg">
                          <span className="font-medium text-lg text-white">
                            {index + 1}. {destination}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => moveDestination(index, 'up')}
                              disabled={index === 0}
                              className={`p-2 rounded ${
                                index === 0 ? 'text-gray-500 cursor-not-allowed' : 'text-blue-400 hover:bg-gray-700'
                              }`}
                            >
                              ↑
                            </button>
                            <button
                              onClick={() => moveDestination(index, 'down')}
                              disabled={index === destinations.length - 1}
                              className={`p-2 rounded ${
                                index === destinations.length - 1 ? 'text-gray-500 cursor-not-allowed' : 'text-blue-400 hover:bg-gray-700'
                              }`}
                            >
                              ↓
                            </button>
                            <button
                              onClick={() => removeDestination(index)}
                              className="text-red-400 p-2 rounded hover:bg-gray-700"
                            >
                              ✕
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                
                {error && (
                  <div className="w-full bg-red-900/50 border border-red-500 text-white p-4 rounded-lg mb-6">
                    <p className="font-medium">{error}</p>
                  </div>
                )}
                
                <button 
                  onClick={handleGenerateRoutePlan}
                  disabled={loading}
                  className={`w-full bg-green-700 text-white px-8 py-4 rounded-lg font-bold hover:bg-green-600 text-lg mb-4 flex items-center justify-center gap-2 ${
                    loading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                      Generating Plan...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      Plan Route
                    </>
                  )}
                </button>
                
                <p className="text-gray-400 text-sm text-center">
                  Click "Plan Route" to generate an optimized travel itinerary based on your recommendations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 