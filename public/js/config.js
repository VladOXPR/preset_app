// Configuration for API endpoints
// For local development, use relative URLs
// For production, change this to your actual Vercel deployment URL
const API_BASE_URL = window.location.origin;

// Helper function to get the full API URL
function getApiUrl(endpoint) {
  // For local development, use relative URLs
  // For production, use absolute URLs
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return endpoint; // Relative URL for local development
  }
  return `${API_BASE_URL}${endpoint}`; // Absolute URL for production
}

// Export for use in other files
window.API_CONFIG = {
  baseUrl: API_BASE_URL,
  getApiUrl: getApiUrl
}; 