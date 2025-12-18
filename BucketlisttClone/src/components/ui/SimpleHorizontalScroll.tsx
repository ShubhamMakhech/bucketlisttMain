import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';

interface SimpleHorizontalScrollProps {
  children: React.ReactNode[];
  className?: string;
  itemClassName?: string;
  showNavigation?: boolean;
  gap?: string;
  disableScrollAnimations?: boolean;
}

export const SimpleHorizontalScroll: React.FC<SimpleHorizontalScrollProps> = ({
  children,
  className = '',
  itemClassName = '',
  showNavigation = true,
  gap = 'gap-4 md:gap-6',
  disableScrollAnimations = true
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -280,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 280,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Navigation Arrows */}
      {showNavigation && (
        <div className="absolute -top-12 right-0 gap-2 z-10 hidden md:flex">
          <Button
            variant="outline"
            size="sm"
            onClick={scrollLeft}
            className="h-10 w-10 p-0 rounded-full hover:bg-orange-50 hover:border-orange-200 dark:hover:bg-orange-950 transition-all duration-200"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={scrollRight}
            className="h-10 w-10 p-0 rounded-full hover:bg-orange-50 hover:border-orange-200 dark:hover:bg-orange-950 transition-all duration-200"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        className={`flex ${gap} overflow-x-auto pb-8 pt-2 scrollbar-hide`}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {children.map((child, index) => (
          <div
            key={index}
            className={`flex-shrink-0 ${itemClassName}`}
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  );
};