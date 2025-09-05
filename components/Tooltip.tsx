import React, { useState, useRef, useCallback } from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  const [position, setPosition] = useState<'top' | 'bottom'>('top');
  const parentRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = useCallback(() => {
    if (parentRef.current) {
      const rect = parentRef.current.getBoundingClientRect();
      // A safe estimate for tooltip height + margin to avoid clipping
      const tooltipHeightThreshold = 50; 

      if (rect.top < tooltipHeightThreshold) {
        setPosition('bottom');
      } else {
        // Reset to top if there's enough space, e.g. after scrolling
        setPosition('top');
      }
    }
  }, []);
  
  const tooltipClasses = `absolute left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-900 bg-opacity-90 border border-yellow-500/50 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}`;

  return (
    <div
      ref={parentRef}
      className="relative group flex items-center group-hover:z-50"
      onMouseEnter={handleMouseEnter}
    >
      {children}
      <div className={tooltipClasses}>
        {text}
      </div>
    </div>
  );
};