'use client';

import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type AccessCodeContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  verifyAccessCode: (code: string) => Promise<boolean>;
  logout: () => void;
};

const AccessCodeContext = createContext<AccessCodeContextType>({
  isAuthenticated: false,
  isLoading: true,
  error: null,
  verifyAccessCode: async () => false,
  logout: () => {},
});

export const useAccessCode = () => useContext(AccessCodeContext);

export const AccessCodeProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for stored authentication on initial load
    const checkStoredAuth = () => {
      try {
        const storedAuth = localStorage.getItem('access_token');
        setIsAuthenticated(!!storedAuth);
      } catch (err) {
        console.error('Error accessing localStorage:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkStoredAuth();
  }, []);

  const verifyAccessCode = async (code: string): Promise<boolean> => {
    try {
      setError(null);
      setIsLoading(true);
      
      if (!code || typeof code !== 'string' || code.trim() === '') {
        setError('Please enter a valid access code.');
        setIsLoading(false);
        return false;
      }
      
      // For development/debugging - replace with your actual access code
      // Comment out for production use with database
      if (code === 'strawberryshortcake2025') {
        localStorage.setItem('access_token', code);
        setIsAuthenticated(true);
        setIsLoading(false);
        return true;
      }
      
      // Query the database for the access code
      const { data, error } = await supabase
        .from('access_codes')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .limit(1);
      
      console.log('Supabase response:', { data, error });
      
      if (error) {
        console.error('Supabase error:', error);
        setError(`Error verifying code: ${error.message || 'Unknown error'}`);
        setIsLoading(false);
        return false;
      }
      
      if (!data || data.length === 0) {
        setError('Invalid access code. Please try again.');
        setIsLoading(false);
        return false;
      }
      
      // Store authentication token in localStorage
      localStorage.setItem('access_token', code);
      setIsAuthenticated(true);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error('Error verifying access code:', err);
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem('access_token');
    } catch (err) {
      console.error('Error removing from localStorage:', err);
    }
    setIsAuthenticated(false);
  };

  return (
    <AccessCodeContext.Provider value={{
      isAuthenticated,
      isLoading,
      error,
      verifyAccessCode,
      logout
    }}>
      {children}
    </AccessCodeContext.Provider>
  );
}; 