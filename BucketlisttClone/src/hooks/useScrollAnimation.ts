import { useEffect, useRef, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface UseScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  delay?: number;
}

export const useScrollAnimation = (options: UseScrollAnimationOptions = {}) => {
  const {
    threshold = 0.1,
    rootMargin = '0px 0px -50px 0px',
    triggerOnce = true,
    delay = 0
  } = options;

  const elementRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && (!triggerOnce || !hasTriggered)) {
          setTimeout(() => {
            setIsVisible(true);
            setHasTriggered(true);
          }, delay);
        } else if (!triggerOnce && !entry.isIntersecting) {
          setIsVisible(false);
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
  }, [threshold, rootMargin, triggerOnce, delay, hasTriggered]);

  return { elementRef, isVisible };
};

export const useStaggeredAnimation = (itemCount: number, staggerDelay: number = 100) => {
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
  const containerRef = useRef<HTMLElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Make stagger animations much faster on mobile
    const actualStaggerDelay = isMobile ? staggerDelay * 0.3 : staggerDelay;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Stagger the animation of child items - use mobile-optimized timing
          for (let i = 0; i < itemCount; i++) {
            setTimeout(() => {
              setVisibleItems(prev => new Set([...prev, i]));
            }, i * actualStaggerDelay);
          }
        }
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    observer.observe(container);

    return () => {
      observer.unobserve(container);
    };
  }, [itemCount, staggerDelay, isMobile]);

  return { containerRef, visibleItems };
};