'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { TravelPreferences } from '@/types';

// Initial preferences state
const initialPreferences: TravelPreferences = {
  budget: 'mid-range',
  travelStyle: [],
  activities: [],
  accommodation: [],
  season: [],
  durationDays: 7,
  accessibility: [],
  foodPreferences: [],
  withChildren: false,
  withPets: false,
};

// Context type
interface PreferencesContextType {
  preferences: TravelPreferences;
  recommendation: string;
  routePlan: string;
  updatePreferences: (updates: Partial<TravelPreferences>) => void;
  setRecommendation: (text: string) => void;
  setRoutePlan: (text: string) => void;
  resetPreferences: () => void;
}

// Create context
const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

// Provider component
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<TravelPreferences>(initialPreferences);
  const [recommendation, setRecommendation] = useState<string>('');
  const [routePlan, setRoutePlan] = useState<string>('');

  const updatePreferences = (updates: Partial<TravelPreferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }));
  };

  const resetPreferences = () => {
    setPreferences(initialPreferences);
    setRecommendation('');
    setRoutePlan('');
  };

  return (
    <PreferencesContext.Provider 
      value={{ 
        preferences, 
        recommendation,
        routePlan, 
        updatePreferences, 
        setRecommendation,
        setRoutePlan, 
        resetPreferences 
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

// Custom hook for using the preferences context
export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
} 