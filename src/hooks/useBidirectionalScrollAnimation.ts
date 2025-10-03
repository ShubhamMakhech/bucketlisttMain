import { useEffect, useRef, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface UseBidirectionalScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  delay?: number;
  fadeOutDelay?: number;
}

export const useBidirectionalScrollAnimation = (options: UseBidirectionalScrollAnimationOptions = {}) => {
  const {
    threshold = 0.1,
    rootMargin = '0px 0px -100px 0px',
    delay = 0,
    fadeOutDelay = 0
  } = options;

  const elementRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        
        if (entry.isIntersecting) {
          // Fade in when entering viewport
          setTimeout(() => {
            setIsVisible(true);
          }, delay);
        } else {
          // Fade out when leaving viewport
          setTimeout(() => {
            setIsVisible(false);
          }, fadeOutDelay);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, delay, fadeOutDelay]);

  return { elementRef, isVisible, isIntersecting };
};

export const useStaggeredBidirectionalAnimation = (
  itemCount: number, 
  staggerDelay: number = 100,
  options: UseBidirectionalScrollAnimationOptions = {}
) => {
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
  const containerRef = useRef<HTMLElement>(null);
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);
  const isMobile = useIsMobile();

  const {
    threshold = 0.1,
    rootMargin = '0px 0px -100px 0px',
    delay = 0,
    fadeOutDelay = 0
  } = options;

  // Make stagger animations much faster on mobile
  const mobileStaggerDelay = staggerDelay * 0.3; // 70% faster stagger
  const mobileDelay = delay * 0.3; // 70% faster initial delay
  const mobileFadeOutDelay = fadeOutDelay * 0.3; // 70% faster fade out

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Clear any existing timeouts
        timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
        timeoutRefs.current = [];

        if (entry.isIntersecting) {
          // Stagger fade in animation - use mobile-optimized timing
          const actualDelay = isMobile ? mobileDelay : delay;
          const actualStaggerDelay = isMobile ? mobileStaggerDelay : staggerDelay;
          
          for (let i = 0; i < itemCount; i++) {
            const timeout = setTimeout(() => {
              setVisibleItems(prev => new Set([...prev, i]));
            }, actualDelay + (i * actualStaggerDelay));
            timeoutRefs.current.push(timeout);
          }
        } else {
          // Stagger fade out animation (reverse order for smoother effect) - use mobile-optimized timing
          const actualFadeOutDelay = isMobile ? mobileFadeOutDelay : fadeOutDelay;
          const actualStaggerDelay = isMobile ? mobileStaggerDelay : staggerDelay;
          
          for (let i = itemCount - 1; i >= 0; i--) {
            const timeout = setTimeout(() => {
              setVisibleItems(prev => {
                const newSet = new Set(prev);
                newSet.delete(i);
                return newSet;
              });
            }, actualFadeOutDelay + ((itemCount - 1 - i) * actualStaggerDelay));
            timeoutRefs.current.push(timeout);
          }
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(container);

    return () => {
      observer.unobserve(container);
      // Clear timeouts on cleanup
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    };
  }, [itemCount, staggerDelay, threshold, rootMargin, delay, fadeOutDelay]);

  return { containerRef, visibleItems };
};