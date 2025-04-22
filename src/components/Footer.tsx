import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">AI Travel Planner</h3>
            <p className="text-gray-300">
              Your AI-powered travel planning assistant helping you create the perfect trip based on your preferences.
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-300 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/recommendation" className="text-gray-300 hover:text-white transition-colors">
                  Recommendations
                </Link>
              </li>
              <li>
                <Link href="/route-planner" className="text-gray-300 hover:text-white transition-colors">
                  Route Planner
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-4">Powered By</h3>
            <ul className="space-y-2">
              <li className="text-gray-300">Next.js</li>
              <li className="text-gray-300">Tailwind CSS</li>
              <li className="text-gray-300">OpenAI</li>
              <li className="text-gray-300">Unsplash Images</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-700 text-center text-gray-400">
          <p>© {new Date().getFullYear()} AI Travel Planner. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
} 