/**
 * Standardised Breakpoints for go4me-web
 *
 * This file provides consistent breakpoint values and utility functions
 * for responsive design across the entire application.
 */

import { useState, useEffect } from 'react';

// Standardised breakpoint values (in pixels)
export const BREAKPOINTS = {
  // Primary breakpoints
  MOBILE_MAX: 767,
  TABLET_MIN: 768,
  TABLET_MAX: 1023,
  DESKTOP_MIN: 1024,
  
  // Secondary breakpoints
  SMALL_MOBILE_MAX: 479,
  LARGE_DESKTOP_MIN: 1200,
  
  // Legacy support (for gradual migration)
  VERY_SMALL_MOBILE_MAX: 360
};

// Media query strings for JavaScript usage
export const MEDIA_QUERIES = {
  MOBILE: `(max-width: ${BREAKPOINTS.MOBILE_MAX}px)`,
  TABLET: `(min-width: ${BREAKPOINTS.TABLET_MIN}px) and (max-width: ${BREAKPOINTS.TABLET_MAX}px)`,
  DESKTOP: `(min-width: ${BREAKPOINTS.DESKTOP_MIN}px)`,
  SMALL_MOBILE: `(max-width: ${BREAKPOINTS.SMALL_MOBILE_MAX}px)`,
  LARGE_DESKTOP: `(min-width: ${BREAKPOINTS.LARGE_DESKTOP_MIN}px)`,
  
  // Tablet and above
  TABLET_UP: `(min-width: ${BREAKPOINTS.TABLET_MIN}px)`,
  // Mobile and tablet
  MOBILE_TABLET: `(max-width: ${BREAKPOINTS.TABLET_MAX}px)`
};

// Utility functions for breakpoint detection
export const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= BREAKPOINTS.MOBILE_MAX;
};

export const isTablet = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= BREAKPOINTS.TABLET_MIN && window.innerWidth <= BREAKPOINTS.TABLET_MAX;
};

export const isDesktop = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= BREAKPOINTS.DESKTOP_MIN;
};

export const isSmallMobile = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= BREAKPOINTS.SMALL_MOBILE_MAX;
};

export const isLargeDesktop = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= BREAKPOINTS.LARGE_DESKTOP_MIN;
};

// Hook for responsive breakpoint detection with event listeners
export const useBreakpoint = () => {
  if (typeof window === 'undefined') {
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: false,
      isSmallMobile: false,
      isLargeDesktop: false
    };
  }

  const [breakpoint, setBreakpoint] = useState({
    isMobile: isMobile(),
    isTablet: isTablet(),
    isDesktop: isDesktop(),
    isSmallMobile: isSmallMobile(),
    isLargeDesktop: isLargeDesktop()
  });

  useEffect(() => {
    const updateBreakpoint = () => {
      setBreakpoint({
        isMobile: isMobile(),
        isTablet: isTablet(),
        isDesktop: isDesktop(),
        isSmallMobile: isSmallMobile(),
        isLargeDesktop: isLargeDesktop()
      });
    };

    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return breakpoint;
};

// Media query listeners for more efficient breakpoint detection
export const createMediaQueryListener = (query, callback) => {
  if (typeof window === 'undefined') return null;
  
  const mediaQuery = window.matchMedia(query);
  mediaQuery.addEventListener('change', callback);
  
  // Call immediately with current state
  callback(mediaQuery);
  
  // Return cleanup function
  return () => mediaQuery.removeEventListener('change', callback);
};

// Convenience functions for common media query listeners
export const onMobileChange = (callback) => 
  createMediaQueryListener(MEDIA_QUERIES.MOBILE, callback);

export const onTabletChange = (callback) => 
  createMediaQueryListener(MEDIA_QUERIES.TABLET, callback);

export const onDesktopChange = (callback) => 
  createMediaQueryListener(MEDIA_QUERIES.DESKTOP, callback);

// Image sizing helper for Next.js Image component
export const getImageSizes = (mobileSize = '150px', desktopSize = '200px') => 
  `(max-width: ${BREAKPOINTS.MOBILE_MAX}px) ${mobileSize}, ${desktopSize}`;

// Container max-width helper
export const getContainerMaxWidth = (breakpoint = 'desktop') => {
  const widths = {
    mobile: '100%',
    tablet: '768px',
    desktop: '1024px',
    large: '1200px'
  };
  return widths[breakpoint] || widths.desktop;
};

// CSS custom property values (for use in CSS-in-JS)
export const CSS_BREAKPOINTS = {
  '--bp-mobile-max': `${BREAKPOINTS.MOBILE_MAX}px`,
  '--bp-tablet-min': `${BREAKPOINTS.TABLET_MIN}px`,
  '--bp-tablet-max': `${BREAKPOINTS.TABLET_MAX}px`,
  '--bp-desktop-min': `${BREAKPOINTS.DESKTOP_MIN}px`,
  '--bp-small-mobile-max': `${BREAKPOINTS.SMALL_MOBILE_MAX}px`,
  '--bp-large-desktop-min': `${BREAKPOINTS.LARGE_DESKTOP_MIN}px`
};

// Export default for convenience
export default {
  BREAKPOINTS,
  MEDIA_QUERIES,
  isMobile,
  isTablet,
  isDesktop,
  isSmallMobile,
  isLargeDesktop,
  useBreakpoint,
  createMediaQueryListener,
  onMobileChange,
  onTabletChange,
  onDesktopChange,
  getImageSizes,
  getContainerMaxWidth,
  CSS_BREAKPOINTS
};
