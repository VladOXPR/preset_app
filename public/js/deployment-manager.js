// ========================================
// CUUB DASHBOARD - DEPLOYMENT MANAGER
// ========================================
// This file handles automatic URL routing between different deployment environments
// 
// PURPOSE:
// - Automatically detects whether the app is running locally or on production (Vercel)
// - Generates appropriate API URLs for each environment
// - Ensures API calls work correctly in both development and production
// - Eliminates the need to manually change URLs when deploying
//
// HOW IT WORKS:
// 1. Detects the current hostname (localhost = local, anything else = production)
// 2. For local development: uses relative URLs (e.g., "/api/stations")
// 3. For production: uses absolute URLs (e.g., "https://app.vercel.app/api/stations")
// 4. Provides a consistent interface for other files to get the correct API URL
//
// USAGE:
// - Import this file in your HTML before other JavaScript files
// - Use window.API_CONFIG.getApiUrl('/endpoint') to get the correct URL
// - Works automatically without any code changes between environments

// ========================================
// ENVIRONMENT DETECTION
// ========================================

// Get the current origin (protocol + hostname + port)
// This automatically detects whether we're on localhost or production
const API_BASE_URL = window.location.origin;

// ========================================
// URL GENERATION LOGIC
// ========================================

/**
 * Generates the correct API URL based on the current environment
 * 
 * This function is the core of the deployment manager. It automatically
 * determines whether to use relative URLs (for local development) or
 * absolute URLs (for production deployment).
 * 
 * @param {string} endpoint - The API endpoint path (e.g., "/api/stations")
 * @returns {string} - The complete URL that will work in the current environment
 * 
 * EXAMPLES:
 * - Local: getApiUrl("/api/stations") → "/api/stations"
 * - Production: getApiUrl("/api/stations") → "https://app.vercel.app/api/stations"
 */
function getApiUrl(endpoint) {
  // Check if we're running locally or on production
  const isLocalDevelopment = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1';
  
  if (isLocalDevelopment) {
    // LOCAL DEVELOPMENT: Use relative URLs
    // This works because the frontend and backend are on the same origin
    // Example: "/api/stations" will resolve to "http://localhost:3000/api/stations"
    return endpoint;
  } else {
    // PRODUCTION: Use absolute URLs
    // This is necessary because the frontend and backend might be on different domains
    // Example: "/api/stations" becomes "https://your-app.vercel.app/api/stations"
    return `${API_BASE_URL}${endpoint}`;
  }
}

// ========================================
// GLOBAL EXPORT
// ========================================

// Export the configuration object globally so other files can access it
// This creates a single source of truth for API URL generation across the entire app
window.API_CONFIG = {
  // The base URL of the current environment
  baseUrl: API_BASE_URL,
  
  // The main function for generating environment-appropriate API URLs
  getApiUrl: getApiUrl
};

// ========================================
// DEBUGGING INFORMATION (Development Only)
// ========================================

// Log environment information to help with debugging
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  console.log('🌍 Environment: Local Development');
  console.log('📍 Base URL:', API_BASE_URL);
  console.log('🔗 URL Strategy: Relative URLs (e.g., "/api/stations")');
} else {
  console.log('🌍 Environment: Production');
  console.log('📍 Base URL:', API_BASE_URL);
  console.log('🔗 URL Strategy: Absolute URLs (e.g., "https://app.vercel.app/api/stations")');
} 