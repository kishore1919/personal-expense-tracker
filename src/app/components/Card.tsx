'use client';

import React from 'react';

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  return (
    <div className={`bg-white p-6 rounded-3xl shadow-sm border border-gray-100 ${className}`}>
      {children}
    </div>
  );
};

export default Card;
