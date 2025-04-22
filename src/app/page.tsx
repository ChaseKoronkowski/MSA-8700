'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import Header from "@/components/Header";

export default function Home() {
  const videoSources = [
    "https://videos.pexels.com/video-files/1739010/1739010-hd_1920_1080_30fps.mp4", // Blue ocean drone footage
    "https://videos.pexels.com/video-files/1826896/1826896-hd_1920_1080_24fps.mp4", // Aerial city shot
    "https://videos.pexels.com/video-files/1739010/1739010-hd_1920_1080_30fps.mp4", // Beautiful beach with turquoise water
    "https://videos.pexels.com/video-files/1436812/1436812-uhd_2732_1440_24fps.mp4", // Rowena Crest viewpoint
  ];

  return (
    <div className="relative flex flex-col min-h-screen bg-black text-white overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video 
          autoPlay 
          muted 
          loop 
          playsInline
          className="object-cover w-full h-full brightness-[0.3]"
        >
          <source src={videoSources[0]} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        {/* Overlay gradient for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30"></div>
      </div>
      
      <Header />
      
      <main className="flex-grow flex items-center relative z-10 px-4 sm:px-6">
        <div className="container mx-auto max-w-7xl py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Left column with main heading */}
            <div>
              <h1 className="text-5xl sm:text-6xl font-bold tracking-tighter leading-none text-shadow">
                <span className="block">Next Generation</span>
                <span className="block mt-2">Travel Planner</span>
              </h1>
              
              <div className="w-24 h-[2px] bg-blue-400 my-8"></div>
              
              <p className="text-xl text-gray-300 tracking-wide text-shadow mb-8">
                Simple — Intelligent — Personalized —
              </p>
            </div>
            
            {/* Right column with title, description and buttons */}
            <div className="flex flex-col justify-center">
              <h2 className="text-3xl font-bold mb-4 text-shadow">AI-Powered Travel Assistant</h2>
              
              <p className="text-xl text-gray-300 leading-relaxed text-shadow mb-10">
                Tell us your preferences and let our AI craft the perfect travel itinerary just for you. From budget-friendly adventures to luxury escapes, we've got you covered.
              </p>
              
              <div className="flex flex-col space-y-4">
                <Link
                  href="/recommendation"
                  className="inline-flex items-center justify-center border-2 border-white hover:border-blue-400 text-white hover:text-blue-400 px-8 py-4 text-xl tracking-wide transition-all duration-300 hover:tracking-wider hover:bg-black/20"
                >
                  Start Planning
                </Link>
                
                <Link
                  href="/recommendation/results"
                  className="inline-flex items-center justify-center bg-blue-800 hover:bg-blue-700 text-white px-8 py-4 text-xl tracking-wide transition-all duration-300 hover:tracking-wider"
                >
                  See My Recommendations
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Decorative elements */}
      <div className="absolute bottom-10 right-10 w-24 h-24 border-2 border-white/20 rounded-full animate-rotate hidden md:block"></div>
      <div className="absolute top-40 right-20 w-4 h-4 bg-blue-400 rounded-full animate-pulse hidden md:block"></div>
      <div className="absolute bottom-40 left-20 w-2 h-12 bg-white/30 hidden md:block"></div>
    </div>
  );
}
