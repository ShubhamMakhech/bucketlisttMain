import React, { useState, useEffect } from 'react';
import { useBidirectionalScrollAnimation } from '@/hooks/useBidirectionalScrollAnimation';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface BidirectionalAnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  animation?: 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'scale-up' | 'slide-up' | 'slide-down';
  delay?: number;
  fadeOutDelay?: number;
  duration?: number;
  threshold?: number;
  rootMargin?: string;
}

const animationClasses = {
  'fade-up': 'translate-y-8 opacity-0',
  'fade-down': '-translate-y-8 opacity-0',
  'fade-left': 'translate-x-8 opacity-0',
  'fade-right': '-translate-x-8 opacity-0',
  'scale-up': 'scale-95 opacity-0',
  'slide-up': 'translate-y-12 opacity-0',
  'slide-down': '-translate-y-12 opacity-0',
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

export const BidirectionalAnimatedSection: React.FC<BidirectionalAnimatedSectionProps> = ({
  children,
  className,
  animation = 'fade-up',
  delay = 0,
  fadeOutDelay = 0,
  duration = 600,
  threshold = 0.1,
  rootMargin = '0px 0px -100px 0px',
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const isMobile = useIsMobile();

  // Adjust timing for mobile devices - make animations much faster
  const mobileDelay = Math.max(0, delay * 0.3); // 70% faster delay
  const mobileDuration = duration * 0.4; // 60% faster duration

  const { elementRef, isVisible } = useBidirectionalScrollAnimation({
    threshold,
    rootMargin,
    delay: isMobile ? mobileDelay : delay,
    fadeOutDelay: isMobile ? fadeOutDelay * 0.3 : fadeOutDelay,
  });

  // Ensure content is visible initially to prevent flash
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      ref={elementRef}
      className={cn(
        'transition-all ease-out',
        // Apply animation classes after initialization
        isInitialized
          ? (isVisible ? visibleClasses[animation] : animationClasses[animation])
          : animationClasses[animation], // Start hidden
        className
      )}
      style={{
        transitionDuration: `${isMobile ? mobileDuration : duration}ms`,
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {children}
    </div>
  );
};