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
        [field]: [...preferences[field], value],
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
      
      // Redirect to dashboard instead of results page
      router.push('/dashboard/view-all-recommendations');
    } catch (error) {
      console.error('Error generating recommendations:', error);
      router.push('/dashboard/view-all-recommendations');
    } finally {
      setLoading(false);
    }
  };

  // Render different steps
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-white">What's your budget?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-white">What's your travel style?</h2>
            <p className="text-gray-300">Select all that apply</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-white">What activities do you enjoy?</h2>
            <p className="text-gray-300">Select all that apply</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-white">Preferred accommodation types</h2>
            <p className="text-gray-300">Select all that apply</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-white">When do you prefer to travel?</h2>
            <p className="text-gray-300">Select all that apply</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
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
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-white">How many days do you plan to travel?</h2>
            <div className="flex flex-col items-center">
              <div className="w-full max-w-md">
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={preferences.durationDays}
                  onChange={handleDurationChange}
                  className="w-full h-3 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
                <div className="text-center mt-4">
                  <span className="text-4xl font-bold text-white">{preferences.durationDays}</span>
                  <span className="text-2xl ml-2 text-white">days</span>
                </div>
              </div>
            </div>
          </div>
        );
      case 7:
        return (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-white">Accessibility requirements</h2>
            <p className="text-gray-300">Select all that apply</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
            </div>
          </div>
        );
      case 8:
        return (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-white">Food preferences</h2>
            <p className="text-gray-300">Select all that apply</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
            </div>
          </div>
        );
      case 9:
        return (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-white">Additional preferences</h2>
            <div className="space-y-6">
              <div className="flex items-center">
                <input
                  id="with-children"
                  type="checkbox"
                  checked={preferences.withChildren}
                  onChange={(e) => handleCheckboxChange('withChildren', e.target.checked)}
                  className="w-6 h-6 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="with-children" className="ml-3 text-xl text-white">
                  Traveling with children
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="with-pets"
                  type="checkbox"
                  checked={preferences.withPets}
                  onChange={(e) => handleCheckboxChange('withPets', e.target.checked)}
                  className="w-6 h-6 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="with-pets" className="ml-3 text-xl text-white">
                  Traveling with pets
                </label>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black">
      <Header />
      
      <main className="flex-grow flex flex-col">
        <div className="container mx-auto px-6 py-8 flex-grow flex flex-col justify-center">
          <h1 className="text-4xl md:text-5xl font-bold text-center text-white mb-2">Tell Us Your Travel Preferences</h1>
          <p className="text-center text-gray-300 mb-6">Step {step} of 9</p>

          {/* Progress Bar */}
          <div className="w-full bg-gray-700 rounded-full h-3 mb-12">
            <div
              className="bg-blue-700 h-3 rounded-full transition-all duration-300"
              style={{ width: `${(step / 9) * 100}%` }}
            ></div>
          </div>

          {/* Preference Content */}
          <div className="max-w-5xl mx-auto w-full">
            {renderStep()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-16">
              <button
                onClick={handlePrevStep}
                disabled={step === 1}
                className={`px-8 py-3 rounded-lg text-lg ${
                  step === 1
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                Previous
              </button>

              {step < 9 ? (
                <button
                  onClick={handleNextStep}
                  className="px-8 py-3 bg-blue-800 text-white rounded-lg hover:bg-blue-700 text-lg"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleGetRecommendations}
                  disabled={loading}
                  className="px-8 py-3 bg-blue-800 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 text-lg"
                >
                  {loading ? 'Loading...' : 'Get Recommendations'}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 