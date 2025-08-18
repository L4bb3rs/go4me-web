/**
 * Test Configuration for go4me-web
 * 
 * This file contains all configuration settings for the test suite,
 * including device viewports, test URLs, and browser settings.
 */

module.exports = {
  // Base configuration
  baseUrl: process.env.TEST_URL || 'http://localhost:3001',
  screenshotApiUrl: process.env.BROWSERLESS_URL || 'http://localhost:3002/screenshot',
  screenshotApiToken: process.env.BROWSERLESS_TOKEN || 'go4me-testing-token',

  // Internal Docker URL for Browserless to access the website
  dockerBaseUrl: 'http://go4me-web:3000',
  
  // Output directories
  outputDir: './test-results',
  reportDir: './reports',
  screenshotDir: './screenshots',
  
  // Test timeouts
  timeouts: {
    pageLoad: 30000,
    screenshot: 15000,
    navigation: 10000
  },
  
  // Device configurations for responsive testing
  devices: {
    mobile: [
      { name: 'iPhone_SE', width: 375, height: 667, description: 'iPhone SE (Small mobile)' },
      { name: 'iPhone_15_Pro', width: 393, height: 852, description: 'iPhone 15 Pro (Modern mobile)' },
      { name: 'Small_Mobile', width: 320, height: 568, description: 'Small mobile viewport' },
      { name: 'Android_Medium', width: 412, height: 915, description: 'Android medium viewport' }
    ],
    tablet: [
      { name: 'iPad', width: 768, height: 1024, description: 'iPad (Portrait)' },
      { name: 'iPad_Landscape', width: 1024, height: 768, description: 'iPad (Landscape)' }
    ],
    desktop: [
      { name: 'Desktop_1200', width: 1200, height: 800, description: 'Desktop 1200px' },
      { name: 'Desktop_1920', width: 1920, height: 1080, description: 'Desktop 1920px' }
    ]
  },
  
  // Test scenarios for mobile optimization validation
  testScenarios: [
    {
      name: 'Home_Page_Mobile_Optimizations',
      url: '/',
      description: 'Validate home page mobile bottom bar, responsive tab menu, and text sizing',
      devices: ['mobile', 'tablet', 'desktop'],
      validations: [
        'mobile_bottom_bar_visible',
        'responsive_tab_menu',
        'claim_text_sizing',
        'logo_spacing_optimized'
      ]
    },
    {
      name: 'Domain_Page_Mobile_Optimizations',
      url: '/domain?pfp=hoffmang',
      description: 'Validate domain page mobile layout, profile optimizations, and bottom bar',
      devices: ['mobile', 'tablet', 'desktop'],
      validations: [
        'profile_text_sizing',
        'mobile_bottom_bar_with_address',
        'centered_avatar_layout',
        'desktop_offer_section_redesign'
      ]
    }
  ],
  
  // Screenshot options
  screenshotOptions: {
    fullPage: true,
    type: 'png'
  },
  
  // Browser navigation options
  gotoOptions: {
    waitUntil: 'networkidle2',
    timeout: 30000
  },
  
  // Test result thresholds
  thresholds: {
    minSuccessRate: 90, // Minimum success rate to pass tests
    maxFailures: 2      // Maximum allowed failures
  }
};
