'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { usePreferences } from '@/context/PreferencesContext';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';

export default function RoutePlanResultsPage() {
  const router = useRouter();
  const { routePlan } = usePreferences();
  const [loading, setLoading] = useState(false);
  
  // Redirect to route-planner if no routePlan is available
  useEffect(() => {
    if (!routePlan) {
      router.push('/route-planner');
    }
  }, [routePlan, router]);

  if (!routePlan) {
    return null; // Return null when redirecting
  }

  return (
    <div className="flex flex-col min-h-screen bg-black">
      <Header />
      
      <main className="flex-grow py-8">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold text-center text-white mb-12">Your Optimized Travel Plan</h1>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-gray-900 rounded-lg shadow-xl p-8 text-white mb-10">
              <div className="prose prose-invert max-w-none prose-headings:text-blue-400 prose-strong:text-blue-300 prose-li:text-gray-200">
                <ReactMarkdown>
                  {routePlan}
                </ReactMarkdown>
              </div>
            </div>
            
            <div className="flex justify-center gap-6">
              <button 
                onClick={() => router.push('/route-planner')}
                className="px-8 py-4 bg-blue-900 text-white rounded-lg hover:bg-blue-800 font-semibold transition-all"
              >
                Edit Route Plan
              </button>
              
              <button 
                onClick={() => window.print()}
                className="px-8 py-4 bg-green-700 text-white rounded-lg hover:bg-green-600 font-semibold transition-all flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Itinerary
              </button>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
} 