import React from 'react';

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  return (
    <div className={`glassmorphic rounded-2xl p-6 ${className}`}>
      {children}
    </div>
  );
};

export default Card;
