import React, { useState, useEffect } from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  animation?: 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'scale-up' | 'slide-up' | 'slide-down';
  delay?: number;
  duration?: number;
  threshold?: number;
}

const animationClasses = {
  'fade-up': 'translate-y-4 opacity-90',
  'fade-down': '-translate-y-4 opacity-90',
  'fade-left': 'translate-x-4 opacity-90',
  'fade-right': '-translate-x-4 opacity-90',
  'scale-up': 'scale-98 opacity-90',
  'slide-up': 'translate-y-6 opacity-90',
  'slide-down': '-translate-y-6 opacity-90',
};

const visibleClasses = {
  'fade-up': 'translate-y-0 opacity-100',
  'fade-down': 'translate-y-0 opacity-100',
  'fade-left': 'translate-x-0 opacity-100',
  'fade-right': 'translate-x-0 opacity-100',
  'scale-up': 'scale-100 opacity-100',
  'slide-up': 'translate-y-0 opacity-100',
  'slide-down': 'translate-y-0 opacity-100',
};

export const AnimatedSection: React.FC<AnimatedSectionProps> = ({
  children,
  className,
  animation = 'fade-up',
  delay = 0,
  duration = 600,
  threshold = 0.1,
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const isMobile = useIsMobile();
  
  // Make animations much faster on mobile devices
  const mobileDelay = Math.max(0, delay * 0.3); // 70% faster delay
  const mobileDuration = duration * 0.4; // 60% faster duration
  
  const { elementRef, isVisible } = useScrollAnimation({
    threshold,
    delay: isMobile ? mobileDelay : delay,
  });

  // Ensure content is visible after a short delay to prevent flash
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      ref={elementRef}
      className={cn(
        'transition-all ease-out',
        // Only apply animation classes after initialization to prevent invisible content
        isInitialized ? (isVisible ? visibleClasses[animation] : animationClasses[animation]) : 'opacity-100',
        className
      )}
      style={{
        transitionDuration: `${isMobile ? mobileDuration : duration}ms`,
      }}
    >
      {children}
    </div>
  );
};