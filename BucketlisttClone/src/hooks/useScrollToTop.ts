import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Custom hook that scrolls to top when the route changes
 */
export const useScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top when pathname changes
    window.scrollTo(0, 0);
  }, [pathname]);
};