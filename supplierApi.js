// ========================================
// SUPPLIER API MODULE
// ========================================
// This module handles all API interactions with different suppliers
// Currently supports:
// - ChargeNow API
// - Energo API
// ========================================

// Add fetch for Node.js (if not using Node 18+)
let fetch;
if (typeof globalThis.fetch === 'undefined') {
  fetch = require('node-fetch');
} else {
  fetch = globalThis.fetch;
}

// File system for reading config
const fs = require('fs').promises;
const path = require('path');

// Import energoLogin for token refresh
const { loginToEnergo, closeBrowser } = require('./public/js/energoLogin');

// ========================================
// CONFIGURATION
// ========================================

const CHARGENOW_CONFIG = {
  baseUrl: 'https://developer.chargenow.top/cdb-open-api/v1',
  credentials: 'Basic VmxhZFZhbGNoa292OlZWMTIxMg==', // Base64 encoded credentials
};

// Energo config path
const energoConfigPath = path.join(__dirname, 'data/energo-config.json');

// Default Energo config (fallback if file doesn't exist)
const DEFAULT_ENERGO_CONFIG = {
  baseUrl: 'https://backend.energo.vip/api',
  token: 'eyJhbGciOiJIUzUxMiJ9.eyJqdGkiOiIyNGUyMWYxYjBmN2Q0MWU3ODU5NmZiYmVkOGM5NGMzMiIsInVzZXIiOiJjdWJVU0EyMDI1IiwiaXNBcGlUb2tlbiI6ZmFsc2UsInN1YiI6ImN1YlVTQTIwMjUiLCJBUElLRVkiOiJidXpOTEQyMDI0IiwiZXhwIjoxNzY5NDQ1NzA5fQ.A_YhhSjlMUbiEZ6l0RvX3eHdAqPsW36HTGukF8yBwVa1t_3rHQUHcwEmMUXDTkS3koQnhcYU20aNZ0Txvxk0ww',
  oid: '3526',
};

// In-memory cache for token (used in production where filesystem is read-only)
let energoTokenCache = null;

// Check if we're running in a read-only environment (Vercel serverless)
const isReadOnlyEnvironment = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

/**
 * Update Energo token in config file or cache
 * @param {string} token - The new token to save
 * @returns {Promise<void>}
 */
async function updateEnergoTokenStorage(token) {
  // In production/read-only environment, use in-memory cache only
  if (isReadOnlyEnvironment) {
    energoTokenCache = token;
    console.log('✅ Energo token updated in memory cache (read-only environment)');
    return;
  }
  
  // In local development, try to write to file
  try {
    let config;
    try {
      const configData = await fs.readFile(energoConfigPath, 'utf8');
      config = JSON.parse(configData);
    } catch (error) {
      // If file doesn't exist, create default config
      config = { oid: DEFAULT_ENERGO_CONFIG.oid };
    }
    
    // Update token
    config.token = token;
    
    // Write back to file
    try {
      await fs.writeFile(energoConfigPath, JSON.stringify(config, null, 2), 'utf8');
      energoTokenCache = token; // Also update cache
      console.log('✅ Energo token updated in config file');
    } catch (writeError) {
      // If file write fails, fall back to cache
      energoTokenCache = token;
      console.warn('⚠️  Could not write to file, using cache:', writeError.message);
    }
  } catch (error) {
    // Fallback to cache if file operations fail
    energoTokenCache = token;
    console.warn('⚠️  Could not update Energo token in config file, using cache:', error.message);
  }
}

/**
 * Refresh Energo authorization token by logging in
 * @returns {Promise<string>} The new authorization token
 */
async function refreshEnergoToken() {
  console.log('🔄 Refreshing Energo authorization token...');
  
  try {
    // Get credentials from environment variables or use defaults
    const username = process.env.ENERGO_USERNAME || 'cubUSA2025';
    const password = process.env.ENERGO_PASSWORD || 'cubUSA2025i^5Ft';
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    // Call loginToEnergo to get a new token
    const result = await loginToEnergo({
      username: username,
      password: password,
      captcha: undefined, // Let it solve with OpenAI
      openaiApiKey: openaiApiKey,
      headless: true, // Always run headless for automatic refresh
      timeout: 30000
    });
    
    // Close the browser to free resources
    if (result && result.browser) {
      await closeBrowser(result);
    }
    
    // Check if we got a token
    if (!result || !result.token) {
      throw new Error('Failed to extract token from login result');
    }
    
    const newToken = result.token;
    console.log('✅ Successfully refreshed Energo token');
    
    // Update token in config file
    await updateEnergoTokenStorage(newToken);
    
    return newToken;
  } catch (error) {
    console.error('❌ Error refreshing Energo token:', error.message);
    throw error;
  }
}

/**
 * Get Energo configuration (reads from cache, file, or falls back to default)
 * @returns {Promise<Object>} Energo config object
 */
async function getEnergoConfig() {
  // In production, check cache first
  if (isReadOnlyEnvironment && energoTokenCache) {
    return {
      baseUrl: 'https://backend.energo.vip/api',
      token: energoTokenCache,
      oid: DEFAULT_ENERGO_CONFIG.oid,
    };
  }
  
  // Try to read from file
  try {
    const configData = await fs.readFile(energoConfigPath, 'utf8');
    const config = JSON.parse(configData);
    // Update cache if we successfully read from file
    if (config.token) {
      energoTokenCache = config.token;
    }
    return {
      baseUrl: 'https://backend.energo.vip/api',
      token: config.token || DEFAULT_ENERGO_CONFIG.token,
      oid: config.oid || DEFAULT_ENERGO_CONFIG.oid,
    };
  } catch (error) {
    // If file read fails and we have cache, use cache
    if (energoTokenCache) {
      return {
        baseUrl: 'https://backend.energo.vip/api',
        token: energoTokenCache,
        oid: DEFAULT_ENERGO_CONFIG.oid,
      };
    }
    console.warn('⚠️  Could not read Energo config file, using default:', error.message);
    return DEFAULT_ENERGO_CONFIG;
  }
}

// ========================================
// API DETECTION HELPERS
// ========================================

const stationsFilePath = path.join(__dirname, 'data/stations.json');

/**
 * Determines which API to use based on username, station ID, or stations.json
 * @param {string} username - The username
 * @param {string} stationId - The station ID (optional)
 * @returns {Promise<string>} - 'energo' or 'chargenow'
 */
async function determineSupplier(username, stationId = null) {
  // Check if username is Relink (case-insensitive)
  if (username && username.toLowerCase() === 'relink') {
    return 'energo';
  }
  
  // Check if station ID starts with RL3T (Energo format)
  if (stationId && stationId.startsWith('RL3T')) {
    return 'energo';
  }
  
  // Check stations.json for supplier information
  if (stationId) {
    try {
      const stationsData = await fs.readFile(stationsFilePath, 'utf8');
      const stations = JSON.parse(stationsData);
      const station = stations.find(s => s.id === stationId);
      if (station && station.supplier === 'energo') {
        return 'energo';
      }
    } catch (error) {
      console.warn('Could not read stations.json for supplier detection:', error.message);
    }
  }
  
  // Default to ChargeNow
  return 'chargenow';
}

/**
 * Synchronous version for backward compatibility (uses only username/ID prefix)
 * @param {string} username - The username
 * @param {string} stationId - The station ID (optional)
 * @returns {string} - 'energo' or 'chargenow'
 */
function determineSupplierSync(username, stationId = null) {
  // Check if username is Relink (case-insensitive)
  if (username && username.toLowerCase() === 'relink') {
    return 'energo';
  }
  
  // Check if station ID starts with RL3T (Energo format)
  if (stationId && stationId.startsWith('RL3T')) {
    return 'energo';
  }
  
  // Default to ChargeNow
  return 'chargenow';
}

// ========================================
// CHARGENOW API FUNCTIONS
// ========================================

/**
 * Fetches all devices/stations from ChargeNow API
 * @returns {Promise<string>} - JSON string of station data
 */
async function fetchChargeNowStations() {
  const myHeaders = new Headers();
  myHeaders.append("Authorization", CHARGENOW_CONFIG.credentials);
  
  const requestOptions = {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow'
  };
  
  console.log('Making API call to ChargeNow: /cabinet/getAllDevice');
  const response = await fetch(`${CHARGENOW_CONFIG.baseUrl}/cabinet/getAllDevice`, requestOptions);
  const result = await response.text();
  
  console.log('ChargeNow API response status:', response.status);
  return result;
}

/**
 * Fetches battery rental information from ChargeNow API
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Items per page (default: 100)
 * @returns {Promise<Object>} - Object containing response and result
 */
async function fetchBatteryRentalInfo(page = 1, limit = 100) {
  const myHeaders = new Headers();
  myHeaders.append("Authorization", CHARGENOW_CONFIG.credentials);
  myHeaders.append("Content-Type", "application/json");
  
  const requestOptions = {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow'
  };
  
  const url = `${CHARGENOW_CONFIG.baseUrl}/order/list?page=${page}&limit=${limit}`;
  console.log('Making API call to ChargeNow: /order/list');
  
  const response = await fetch(url, requestOptions);
  const result = await response.json();
  
  console.log('Battery rental API response status:', response.status);
  return { response, result };
}

/**
 * Fetches station availability data from ChargeNow API
 * @param {string} stationId - The station/device ID
 * @returns {Promise<Object>} - Object containing response and result
 */
async function fetchStationAvailability(stationId) {
  const myHeaders = new Headers();
  myHeaders.append("Authorization", CHARGENOW_CONFIG.credentials);
  myHeaders.append("Content-Type", "application/json");
  
  const requestOptions = {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow'
  };
  
  const url = `${CHARGENOW_CONFIG.baseUrl}/rent/cabinet/query?deviceId=${stationId}`;
  console.log('Making API call to ChargeNow: /rent/cabinet/query for station:', stationId);
  
  const response = await fetch(url, requestOptions);
  const result = await response.json();
  
  console.log('ChargeNow station availability response status:', response.status);
  return { response, result };
}

/**
 * Fetches rental history for a specific station within a date range (ChargeNow)
 * @param {string} stationId - The station/device ID (pCabinetid parameter)
 * @param {string} sTime - Start time (format: "YYYY-MM-DD HH:mm:ss")
 * @param {string} eTime - End time (format: "YYYY-MM-DD HH:mm:ss")
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Items per page (default: 1000)
 * @returns {Promise<Object>} - Object containing response and result
 */
async function fetchChargeNowStationRentalHistory(stationId, sTime, eTime, page = 1, limit = 1000, username = null) {
  const myHeaders = new Headers();
  myHeaders.append("Authorization", CHARGENOW_CONFIG.credentials);
  myHeaders.append("Content-Type", "application/json");
  
  const requestOptions = {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow'
  };
  
  // Use pCabinetid parameter for station-specific queries
  const url = `${CHARGENOW_CONFIG.baseUrl}/order/list?page=${page}&limit=${limit}&sTime=${encodeURIComponent(sTime)}&eTime=${encodeURIComponent(eTime)}&pCabinetid=${stationId}`;
  console.log('Making API call to ChargeNow: /order/list for station:', stationId);
  
  try {
    const response = await fetch(url, requestOptions);
    const result = await response.text();
    
    console.log('ChargeNow rental history response status:', response.status);
    
    // Parse the result
    let parsedResult;
    try {
      parsedResult = JSON.parse(result);
    } catch (e) {
      parsedResult = { code: -1, msg: 'Failed to parse order data' };
    }
    
    return { response, result: parsedResult };
  } catch (error) {
    console.error(`❌ Error fetching ChargeNow rental history for ${stationId}:`, error.message);
    throw error;
  }
}

/**
 * Dispenses a battery from a specific station using popAll endpoint (ChargeNow)
 * @param {string} stationId - The station/device ID
 * @returns {Promise<Object>} - Object containing response and result
 */
async function dispenseBattery(stationId) {
  const myHeaders = new Headers();
  myHeaders.append("Authorization", CHARGENOW_CONFIG.credentials);
  myHeaders.append("Content-Type", "application/json");
  
  const raw = JSON.stringify({
    "deviceId": stationId
  });
  
  const requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
  };
  
  const url = `${CHARGENOW_CONFIG.baseUrl}/rent/popAll`;
  console.log('Making API call to ChargeNow: /rent/popAll for station:', stationId);
  
  const response = await fetch(url, requestOptions);
  const result = await response.json();
  
  console.log('ChargeNow dispense battery response status:', response.status);
  console.log('ChargeNow dispense battery response:', result);
  
  return { response, result };
}

/**
 * Ejects a battery from a specific slot using repair mode (ChargeNow)
 * @param {string} stationId - The station/cabinet ID
 * @param {number} slotNum - Slot number (0 for all)
 * @returns {Promise<Object>} - Object containing response and result
 */
async function ejectBatteryByRepair(stationId, slotNum = 0) {
  const myHeaders = new Headers();
  myHeaders.append("Authorization", CHARGENOW_CONFIG.credentials);
  myHeaders.append("Content-Type", "application/json");
  
  const requestOptions = {
    method: 'POST',
    headers: myHeaders,
    redirect: 'follow'
  };
  
  const url = `${CHARGENOW_CONFIG.baseUrl}/cabinet/ejectByRepair?cabinetid=${stationId}&slotNum=${slotNum}`;
  console.log('Making API call to ChargeNow: /cabinet/ejectByRepair for station:', stationId, 'slot:', slotNum);
  
  const response = await fetch(url, requestOptions);
  const result = await response.text();
  
  console.log('ChargeNow eject battery response status:', response.status);
  
  // Parse the result
  let parsedResult;
  try {
    parsedResult = JSON.parse(result);
  } catch (e) {
    parsedResult = { code: -1, msg: 'Failed to parse response', raw: result };
  }
  
  return { response, result: parsedResult };
}

// ========================================
// ENERGO API FUNCTIONS
// ========================================

/**
 * Helper function to check if an API error is authentication-related
 * @param {Response} response - The fetch response object
 * @param {Object} result - The parsed JSON result (if available)
 * @returns {boolean} True if the error is authentication-related
 */
function isAuthError(response, result) {
  // Check HTTP status codes first
  if (response.status === 401 || response.status === 403) {
    console.log('🔐 Auth error detected: HTTP status', response.status);
    return true;
  }
  
  // Check if response is not OK (any non-2xx status) - treat as potential auth error
  if (!response.ok) {
    console.log('🔐 Response not OK, treating as potential auth error. Status:', response.status);
    return true;
  }
  
  // Check for common auth error messages in response body
  if (result) {
    const errorMsg = (result.message || result.msg || result.error || JSON.stringify(result)).toLowerCase();
    if (errorMsg.includes('unauthorized') || 
        errorMsg.includes('forbidden') || 
        (errorMsg.includes('token') && (errorMsg.includes('expired') || errorMsg.includes('invalid') || errorMsg.includes('invalid')))) {
      console.log('🔐 Auth error detected in response message:', errorMsg.substring(0, 100));
      return true;
    }
  }
  
  return false;
}

/**
 * Wrapper function for making ENERGO API requests with automatic token refresh on failure
 * @param {Function} requestFn - Async function that makes the API request and returns { response, result }
 * @returns {Promise<Object>} Object containing response and result
 */
async function makeEnergoRequest(requestFn) {
  try {
    // Make the initial request
    const { response, result } = await requestFn();
    
    console.log(`[ENERGO REQUEST] Status: ${response.status}, OK: ${response.ok}`);
    if (result) {
      console.log(`[ENERGO REQUEST] Result preview:`, JSON.stringify(result).substring(0, 200));
    }
    
    // Check if request failed due to authentication
    // We check for auth errors regardless of response.ok status
    if (isAuthError(response, result)) {
      console.log('⚠️  Energo API request failed with auth error, refreshing token...');
      console.log('Response details:', { status: response.status, statusText: response.statusText, result: result ? JSON.stringify(result).substring(0, 200) : 'null' });
      
      try {
        // Refresh the token
        await refreshEnergoToken();
        
        // Retry the request once with the new token
        console.log('🔄 Retrying Energo API request with new token...');
        return await requestFn();
      } catch (refreshError) {
        console.error('❌ Failed to refresh token:', refreshError.message);
        // Return the original error if refresh failed
        return { response, result };
      }
    }
    
    // Request succeeded or failed for non-auth reasons
    return { response, result };
  } catch (error) {
    // Handle JSON parsing errors or other exceptions
    // If it's a JSON parse error and we got a response, check if it's an auth error
    if (error.message && error.message.includes('JSON') && error.response) {
      console.log('⚠️  JSON parsing error, checking if it might be an auth error...');
      if (isAuthError(error.response, null)) {
        console.log('⚠️  Treating JSON parse error as auth error, refreshing token...');
        try {
          await refreshEnergoToken();
          console.log('🔄 Retrying Energo API request with new token...');
          return await requestFn();
        } catch (refreshError) {
          console.error('❌ Failed to refresh token:', refreshError.message);
          throw error; // Re-throw original error
        }
      }
    }
    
    // For other network errors or exceptions, don't attempt token refresh
    console.error('❌ Energo API request error:', error.message);
    throw error;
  }
}

/**
 * Converts date string to Epoch timestamp (milliseconds)
 * @param {string} dateStr - Date string in format "YYYY-MM-DD HH:mm:ss" (assumed to be UTC)
 * @returns {number} - Epoch timestamp in milliseconds
 */
function dateToEpoch(dateStr) {
  // Parse date string: "YYYY-MM-DD HH:mm:ss"
  // Since getDateRange returns UTC dates, parse as UTC
  const [datePart, timePart] = dateStr.split(' ');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes, seconds] = timePart.split(':').map(Number);
  
  // Create UTC date
  const date = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
  return date.getTime();
}

/**
 * Fetches station battery availability from Energo API
 * @param {string} cabinetId - The cabinet/station ID
 * @param {string} username - The username (optional, for backward compatibility)
 * @returns {Promise<Object>} - Object containing response and result with returnNum and borrowNum
 */
async function fetchEnergoStationAvailability(cabinetId, username = null) {
  const url = `${(await getEnergoConfig()).baseUrl}/cabinet?cabinetId=${cabinetId}`;
  console.log('Making API call to Energo: /cabinet for station:', cabinetId);
  
  // Wrap the API request with automatic token refresh on failure
  const { response, result } = await makeEnergoRequest(async () => {
    const energoConfig = await getEnergoConfig();
    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${energoConfig.token}`);
    myHeaders.append("Referer", "https://backend.energo.vip/device/list");
    myHeaders.append("oid", energoConfig.oid);
    
    const requestOptions = {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow'
    };
    
    const response = await fetch(url, requestOptions);
    
    // Try to parse JSON, but handle errors gracefully
    let result = null;
    try {
      const text = await response.text();
      try {
        result = JSON.parse(text);
      } catch (parseError) {
        // If JSON parsing fails, create an error result object
        console.warn('Failed to parse JSON response:', text.substring(0, 200));
        result = { error: 'Failed to parse response', raw: text.substring(0, 200) };
      }
    } catch (error) {
      console.error('Error reading response:', error.message);
      result = { error: 'Failed to read response', message: error.message };
    }
    
    console.log('Energo station availability response status:', response.status);
    return { response, result };
  });
  
  // Check if fetch was successful
  if (response.ok && result.content && result.content.length > 0) {
    // Extract returnNum and borrowNum from positionInfo
    const stationData = result.content[0];
    let returnNum = 0;
    let borrowNum = 0;
    
    if (stationData.positionInfo) {
      returnNum = stationData.positionInfo.returnNum || 0;
      borrowNum = stationData.positionInfo.borrowNum || 0;
    }
    
    return { 
      response, 
      result: {
        ...result,
        returnNum,
        borrowNum
      }
    };
  } else {
    // Fetch failed, return error response
    return {
      response: { ok: false, status: response.status || 500 },
      result: {
        ...result,
        returnNum: 0,
        borrowNum: 0
      }
    };
  }
}

/**
 * Fetches rental history for a specific station within a date range (Energo)
 * @param {string} cabinetId - The cabinet/station ID
 * @param {string} sTime - Start time (format: "YYYY-MM-DD HH:mm:ss")
 * @param {string} eTime - End time (format: "YYYY-MM-DD HH:mm:ss")
 * @param {string} username - The username (optional, for backward compatibility)
 * @returns {Promise<Object>} - Object containing response and result with totalPay and totalElements
 */
async function fetchEnergoStationRentalHistory(cabinetId, sTime, eTime, username = null) {
  // Convert dates to Epoch format
  const startEpoch = dateToEpoch(sTime);
  const endEpoch = dateToEpoch(eTime);
  
  // URL encode the array brackets
  const url = `${(await getEnergoConfig()).baseUrl}/order?page=0&size=0&createTime%5B0%5D=${startEpoch}&createTime%5B1%5D=${endEpoch}&cabinetid=${cabinetId}&sort=id%2Cdesc`;
  console.log('Making API call to Energo: /order for station:', cabinetId);
  console.log('Date range:', sTime, 'to', eTime, `(${startEpoch} to ${endEpoch})`);
  
  // Wrap the API request with automatic token refresh on failure
  const { response, result } = await makeEnergoRequest(async () => {
    const energoConfig = await getEnergoConfig();
    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${energoConfig.token}`);
    myHeaders.append("Referer", "https://backend.energo.vip/device/list");
    myHeaders.append("oid", energoConfig.oid);
    
    const requestOptions = {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow'
    };
    
    const response = await fetch(url, requestOptions);
    
    // Try to parse JSON, but handle errors gracefully
    let result = null;
    try {
      const text = await response.text();
      try {
        result = JSON.parse(text);
      } catch (parseError) {
        // If JSON parsing fails, create an error result object
        console.warn('Failed to parse JSON response:', text.substring(0, 200));
        result = { error: 'Failed to parse response', raw: text.substring(0, 200) };
      }
    } catch (error) {
      console.error('Error reading response:', error.message);
      result = { error: 'Failed to read response', message: error.message };
    }
    
    console.log('Energo rental history response status:', response.status);
    return { response, result };
  });
  
  // Check if fetch was successful
  if (response.ok) {
    // Extract totalPay and totalElements
    let totalPay = 0;
    let totalElements = 0;
    
    if (result.content && Array.isArray(result.content)) {
      // Sum all totalPay values from orders
      totalPay = result.content.reduce((sum, order) => {
        return sum + (parseFloat(order.totalPay) || 0);
      }, 0);
      totalElements = result.totalElements || result.content.length;
    }
    
    return { 
      response, 
      result: {
        ...result,
        totalPay,
        totalElements
      }
    };
  } else {
    // Fetch failed, return error response
    return {
      response: { ok: false, status: response.status || 500 },
      result: {
        ...result,
        totalPay: 0,
        totalElements: 0
      }
    };
  }
}

/**
 * Fetches station data from Energo API
 * Returns a single station in ChargeNow-compatible format
 * @param {string} cabinetId - The cabinet/station ID
 * @returns {Promise<string>} - JSON string of station data in ChargeNow format
 */
async function fetchEnergoStation(cabinetId, username = null) {
  try {
    const { result } = await fetchEnergoStationAvailability(cabinetId, username);
    
    if (!result.content || result.content.length === 0) {
      return JSON.stringify({ code: -1, msg: 'Station not found', data: [] });
    }
    
    const stationData = result.content[0];
    
    // Convert Energo format to ChargeNow-compatible format
    const chargeNowFormat = {
      code: 0,
      msg: "success",
      data: [{
        pCabinetid: stationData.cabinetId,
        id: stationData.cabinetId,
        stationTitle: stationData.shopName || stationData.cabinetId,
        location: stationData.subAddress || '',
        status: stationData.isOnline === 1 ? 'online' : 'offline',
        batteryCount: stationData.devicenum || 0,
        pBorrow: stationData.positionInfo?.borrowNum || 0, // To Take
        pAlso: stationData.positionInfo?.returnNum || 0,   // To Return
        availableBatteries: stationData.positionInfo?.borrowNum || 0,
        emptySlots: stationData.positionInfo?.returnNum || 0
      }]
    };
    
    return JSON.stringify(chargeNowFormat);
  } catch (error) {
    console.error('Error fetching Energo station:', error);
    return JSON.stringify({ code: -1, msg: error.message, data: [] });
  }
}

// ========================================
// UNIFIED API FUNCTIONS
// ========================================

/**
 * Fetches all stations - automatically routes to correct supplier
 * @param {string} username - The username to determine supplier
 * @returns {Promise<string>} - JSON string of station data
 */
async function fetchStations(username) {
  const supplier = determineSupplierSync(username);
  
  if (supplier === 'energo') {
    // For Energo, we need to fetch individual stations
    // This is a placeholder - in practice, you'd need to know which stations to fetch
    console.log('Energo supplier detected, but fetchStations requires station IDs');
    return JSON.stringify({ code: 0, msg: "success", data: [] });
  }
  
  return await fetchChargeNowStations();
}

/**
 * Fetches rental history for a specific station - automatically routes to correct supplier
 * @param {string} username - The username to determine supplier
 * @param {string} stationId - The station ID
 * @param {string} sTime - Start time (format: "YYYY-MM-DD HH:mm:ss")
 * @param {string} eTime - End time (format: "YYYY-MM-DD HH:mm:ss")
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Items per page (default: 1000)
 * @returns {Promise<Object>} - Object containing response and result in unified format
 */
async function fetchStationRentalHistory(username, stationId, sTime, eTime, page = 1, limit = 1000) {
  const supplier = await determineSupplier(username, stationId);
  
  if (supplier === 'energo') {
    const { response, result } = await fetchEnergoStationRentalHistory(stationId, sTime, eTime, username);
    
    console.log(`[ENERGO RENTAL HISTORY] Station ${stationId}: totalElements=${result.totalElements}, totalPay=${result.totalPay}`);
    
    // Convert Energo format to ChargeNow-compatible format
    return {
      response,
      result: {
        code: response.ok ? 0 : -1,
        msg: response.ok ? 'success' : 'error',
        page: {
          total: result.totalElements || 0,  // Number of rents
          records: result.content || [],
          // totalPay is already the sum of all order.totalPay values from fetchEnergoStationRentalHistory
          totalRevenue: result.totalPay || 0  // Total revenue (sum of all totalPay)
        }
      }
    };
  }
  
  // Default to ChargeNow
  return await fetchChargeNowStationRentalHistory(stationId, sTime, eTime, page, limit, username);
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Generates demo station data for testing
 * @returns {string} - JSON string of demo station data
 */
function generateDemoStationData() {
  const demoStations = [
    {
      pCabinetid: "DEMO001",
      id: "DEMO001",
      stationTitle: "Demo Station - Downtown Mall",
      location: "123 Main Street, Downtown",
      status: "online",
      batteryCount: 8,
      availableBatteries: Math.floor(Math.random() * 4) + 3, // 3-6 available
      totalRevenue: (Math.random() * 800) + 50, // $50-$850
      totalRents: Math.floor(Math.random() * 50) + 20 // 20-70 rents
    },
    {
      pCabinetid: "DEMO002", 
      id: "DEMO002",
      stationTitle: "Demo Station - University Campus",
      location: "456 University Ave, Campus",
      status: "online",
      batteryCount: 12,
      availableBatteries: Math.floor(Math.random() * 6) + 4, // 4-9 available
      totalRevenue: (Math.random() * 800) + 50, // $50-$850
      totalRents: Math.floor(Math.random() * 50) + 20 // 20-70 rents
    },
    {
      pCabinetid: "DEMO003",
      id: "DEMO003", 
      stationTitle: "Demo Station - Shopping Center",
      location: "789 Mall Drive, Shopping Center",
      status: "online",
      batteryCount: 6,
      availableBatteries: Math.floor(Math.random() * 3) + 2, // 2-4 available
      totalRevenue: (Math.random() * 800) + 50, // $50-$850
      totalRents: Math.floor(Math.random() * 50) + 20 // 20-70 rents
    },
    {
      pCabinetid: "DEMO004",
      id: "DEMO004",
      stationTitle: "Demo Station - Office Building", 
      location: "321 Business Blvd, Office District",
      status: "online",
      batteryCount: 10,
      availableBatteries: Math.floor(Math.random() * 5) + 3, // 3-7 available
      totalRevenue: (Math.random() * 800) + 50, // $50-$850
      totalRents: Math.floor(Math.random() * 50) + 20 // 20-70 rents
    }
  ];
  
  return JSON.stringify({
    code: 0,
    msg: "success",
    data: demoStations
  });
}

/**
 * Calculates revenue and rent statistics from order data
 * Only counts records where settledAmount (or amount) is greater than 0
 * @param {Array} orders - Array of order objects
 * @returns {Object} - Object with totalRevenue and totalRecords
 */
function calculateOrderStats(orders) {
  if (!Array.isArray(orders) || orders.length === 0) {
    return {
      totalRevenue: 0,
      totalRecords: 0
    };
  }
  
  // Filter out records where settledAmount or amount is 0
  const validOrders = orders.filter(order => {
    const amount = parseFloat(order.settledAmount || order.amount || 0);
    return amount > 0;
  });
  
  const totalRevenue = validOrders.reduce((sum, order) => {
    const amount = parseFloat(order.settledAmount || order.amount || 0);
    return sum + amount;
  }, 0);
  
  return {
    totalRevenue: totalRevenue,
    totalRecords: validOrders.length
  };
}

// ========================================
// KEEP-ALIVE FUNCTION
// ========================================

/**
 * Sends a simple Energo API request every minute to keep the API key alive
 * Uses a known Energo station ID for the request
 */
async function sendEnergoKeepAliveRequest() {
  try {
    // Use a known Energo station ID (RL3T format)
    const testStationId = 'RL3T062411030004';
    const url = `${(await getEnergoConfig()).baseUrl}/cabinet?cabinetId=${testStationId}`;
    
    // Wrap the API request with automatic token refresh on failure
    const { response } = await makeEnergoRequest(async () => {
      const energoConfig = await getEnergoConfig();
      const myHeaders = new Headers();
      myHeaders.append("Authorization", `Bearer ${energoConfig.token}`);
      myHeaders.append("Referer", "https://backend.energo.vip/device/list");
      myHeaders.append("oid", energoConfig.oid);
      
      const requestOptions = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow'
      };
      
      const response = await fetch(url, requestOptions);
      
      // Try to parse JSON, but handle errors gracefully
      let result = null;
      try {
        const text = await response.text();
        try {
          result = JSON.parse(text);
        } catch (parseError) {
          result = { error: 'Failed to parse response' };
        }
      } catch (error) {
        result = { error: 'Failed to read response', message: error.message };
      }
      
      return { response, result };
    });
    
    if (response.ok) {
      console.log(`[ENERGO KEEP-ALIVE] Successfully sent keep-alive request at ${new Date().toISOString()}`);
    } else {
      console.warn(`[ENERGO KEEP-ALIVE] Keep-alive request returned status ${response.status}`);
    }
  } catch (error) {
    console.error('[ENERGO KEEP-ALIVE] Error sending keep-alive request:', error.message);
  }
}

/**
 * Starts the Energo API keep-alive interval (sends request every 1 minute)
 */
function startEnergoKeepAlive() {
  console.log('[ENERGO KEEP-ALIVE] Starting Energo API keep-alive service (1 minute interval)');
  
  // Send initial request immediately
  sendEnergoKeepAliveRequest();
  
  // Then send every 1 minute (60000 ms)
  setInterval(() => {
    sendEnergoKeepAliveRequest();
  }, 60000);
}

// ========================================
// EXPORTS
// ========================================

module.exports = {
  // Unified API functions (auto-detect supplier)
  fetchStations,
  fetchStationRentalHistory,
  
  // ChargeNow API functions (for backward compatibility)
  fetchChargeNowStations,
  fetchBatteryRentalInfo,
  fetchStationAvailability,
  fetchChargeNowStationRentalHistory,
  dispenseBattery,
  ejectBatteryByRepair,
  
  // Energo API functions
  fetchEnergoStationAvailability,
  fetchEnergoStationRentalHistory,
  fetchEnergoStation,
  
  // Helper functions
  generateDemoStationData,
  calculateOrderStats,
  determineSupplier,
  
  // Configuration (for future customization)
  CHARGENOW_CONFIG,
  getEnergoConfig,
  
  // Keep-alive function
  startEnergoKeepAlive
};

