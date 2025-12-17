'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

interface PreloaderProps {
  /** Text to animate letter by letter */
  text?: string;
}

const Preloader: React.FC<PreloaderProps> = ({ text = 'bucketlistt' }) => {
  const preloaderRef = useRef<HTMLDivElement>(null);
  const [isComplete, setIsComplete] = useState(false);

  useGSAP(
    () => {
      const tl = gsap.timeline({ 
        defaults: { ease: 'power1.inOut' },
        onComplete: () => {
          // Completely remove the preloader from DOM after animation
          setIsComplete(true);
        }
      });
      
      // 1) Reveal each letter
      tl.to('.name-text span', { y: 0, stagger: 0.05, duration: 0.2 });
      // 2) Slide out the preloader items
      tl.to(
        '.preloader-item',
        {
          delay: 1,
          y: '100%',
          duration: 0.5,
          stagger: 0.1,
        }
      )
        // 3) Fade out letters
        .to('.name-text span', { autoAlpha: 0 }, '<0.5')
        // 4) Fade out the container and set pointer-events to none
        .to(preloaderRef.current, { 
          autoAlpha: 0, 
          pointerEvents: 'none',
          onComplete: () => {
            // Ensure the element is completely hidden and non-interactive
            if (preloaderRef.current) {
              preloaderRef.current.style.display = 'none';
            }
          }
        }, '<1');
    },
    { scope: preloaderRef }
  );

  // Don't render anything if animation is complete
  if (isComplete) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-[9999] flex pointer-events-auto" 
      ref={preloaderRef}
      style={{ 
        // Ensure it doesn't interfere with payment modals
        zIndex: 9999 
      }}
    >
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="preloader-item h-full w-[10%] bg-black" />
      ))}

      <p className="name-text flex text-[20vw] lg:text-[200px] font-['Anton'] text-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 leading-none overflow-hidden">
        {text.split('').map((char, i) => (
          <span key={i} className="inline-block translate-y-full">
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </p>
    </div>
  );
};

export default Preloader;
