import React from 'react';
import { BidirectionalAnimatedSection } from './BidirectionalAnimatedSection';

interface ScrollAnimationWrapperProps {
  children: React.ReactNode;
  animation?: 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'scale-up' | 'slide-up' | 'slide-down';
  delay?: number;
  fadeOutDelay?: number;
  duration?: number;
  threshold?: number;
  rootMargin?: string;
  className?: string;
  enabled?: boolean;
}

/**
 * A simple wrapper component that adds bidirectional scroll animations to any content.
 * When enabled=false, it renders children without any animation wrapper.
 */
export const ScrollAnimationWrapper: React.FC<ScrollAnimationWrapperProps> = ({
  children,
  animation = 'fade-up',
  delay = 0,
  fadeOutDelay = 0,
  duration = 600,
  threshold = 0.1,
  rootMargin = '0px 0px -100px 0px',
  className,
  enabled = true,
}) => {
  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <BidirectionalAnimatedSection
      animation={animation}
      delay={delay}
      fadeOutDelay={fadeOutDelay}
      duration={duration}
      threshold={threshold}
      rootMargin={rootMargin}
      className={className}
    >
      {children}
    </BidirectionalAnimatedSection>
  );
};