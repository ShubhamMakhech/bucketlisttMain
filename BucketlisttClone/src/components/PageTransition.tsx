import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useScrollToTop } from '@/hooks/useScrollToTop';

interface PageTransitionProps {
  children: React.ReactNode;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState<'entering' | 'entered' | 'exiting'>('entering');

  // Reset scroll position when route changes
  useScrollToTop();

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage('exiting');
      setIsLoading(true);
    }
  }, [location, displayLocation]);

  useEffect(() => {
    if (transitionStage === 'exiting') {
      const timer = setTimeout(() => {
        setDisplayLocation(location);
        setTransitionStage('entering');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [transitionStage, location]);

  useEffect(() => {
    if (transitionStage === 'entering') {
      const timer = setTimeout(() => {
        setIsLoading(false);
        setTransitionStage('entered');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [transitionStage]);

  return (
    <div className="relative min-h-screen">
      {/* Loading overlay */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-background transition-all duration-300 ease-in-out',
          isLoading ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      >
        <div className="flex items-center justify-center h-full">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce"></div>
          </div>
        </div>
      </div>

      {/* Page content */}
      <div
        className={cn(
          'transition-all duration-500 ease-out',
          transitionStage === 'entering' && 'opacity-0 translate-y-4',
          transitionStage === 'entered' && 'opacity-100 translate-y-0',
          transitionStage === 'exiting' && 'opacity-0 -translate-y-4'
        )}
      >
        {children}
      </div>
    </div>
  );
};