'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  
  return (
    <header className={`text-white z-20 relative ${isHomePage ? 'bg-transparent' : 'bg-gray-900 shadow-lg'}`}>
      <div className="container mx-auto px-6 py-5">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <Link href="/" className={`text-2xl font-bold text-white ${isHomePage ? 'hover:text-blue-300' : 'hover:text-blue-300'} transition-colors`}>
              AI Travel Planner
            </Link>
          </div>
          
          
        </div>
      </div>
    </header>
  );
} 