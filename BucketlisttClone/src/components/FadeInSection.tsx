import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface FadeInSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}

export const FadeInSection: React.FC<FadeInSectionProps> = ({
  children,
  className,
  delay = 0,
  duration = 600,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Fallback: Make visible after a short delay regardless of intersection
    const fallbackTimer = setTimeout(() => {
      setIsVisible(true);
    }, 500);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          clearTimeout(fallbackTimer);
          setTimeout(() => {
            setIsVisible(true);
          }, delay);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
      clearTimeout(fallbackTimer);
    };
  }, [delay]);

  return (
    <div
      ref={elementRef}
      className={cn(
        'transition-all ease-out',
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-90 translate-y-2',
        className
      )}
      style={{
        transitionDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  );
};