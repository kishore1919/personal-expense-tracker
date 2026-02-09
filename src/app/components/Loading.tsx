'use client';

import React from 'react';

const Loading = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="glassmorphic p-12 rounded-3xl flex flex-col items-center gap-6">
        {/* Material Expressive Circular Spinner */}
        <div className="relative w-16 h-16">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-4 border-white/20"></div>
          {/* Animated arc */}
          <div 
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-white animate-spin"
            style={{ animationDuration: '1s' }}
          ></div>
          {/* Inner accent */}
          <div className="absolute inset-2 rounded-full border-3 border-transparent border-b-white/60 animate-spin"
               style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}>
          </div>
        </div>
        
        {/* Expressive text with dot animation */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-lg font-medium text-white/90">Loading</span>
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" style={{ animationDelay: '200ms' }}></div>
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" style={{ animationDelay: '400ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Loading;
