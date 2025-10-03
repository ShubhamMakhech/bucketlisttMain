import React from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';

interface AnimatedWrapperProps {
  children: React.ReactNode;
  className?: string;
  animation?: 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'scale-up' | 'slide-up' | 'slide-down';
  delay?: number;
  duration?: number;
  threshold?: number;
  stagger?: boolean;
  staggerDelay?: number;
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

export const AnimatedWrapper: React.FC<AnimatedWrapperProps> = ({
  children,
  className,
  animation = 'fade-up',
  delay = 0,
  duration = 600,
  threshold = 0.1,
  stagger = false,
  staggerDelay = 100,
}) => {
  const { elementRef, isVisible } = useScrollAnimation({
    threshold,
    delay: stagger ? 0 : delay,
  });

  // If stagger is enabled, apply stagger delay to children
  const childrenWithStagger = stagger
    ? React.Children.map(children, (child, index) => (
        <div
          key={index}
          className={cn(
            'transition-all ease-out',
            animationClasses[animation],
            isVisible && visibleClasses[animation]
          )}
          style={{
            transitionDuration: `${duration}ms`,
            transitionDelay: isVisible ? `${index * staggerDelay}ms` : '0ms',
          }}
        >
          {child}
        </div>
      ))
    : children;

  return (
    <div
      ref={elementRef}
      className={cn(
        stagger ? '' : 'transition-all ease-out',
        stagger ? '' : animationClasses[animation],
        stagger ? '' : (isVisible && visibleClasses[animation]),
        className
      )}
      style={
        stagger
          ? {}
          : {
              transitionDuration: `${duration}ms`,
            }
      }
    >
      {stagger ? childrenWithStagger : children}
    </div>
  );
};