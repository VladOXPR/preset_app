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
const fsSync = require('fs');
const path = require('path');

// ========================================
// CONFIGURATION
// ========================================

const CHARGENOW_CONFIG = {
  baseUrl: 'https://developer.chargenow.top/cdb-open-api/v1',
  credentials: 'Basic VmxhZFZhbGNoa292OlZWMTIxMg==', // Base64 encoded credentials
};

// Energo config path
const energoConfigPath = path.join(__dirname, 'data/energo-config.json');
// Users file path
const usersFilePath = path.join(__dirname, 'data/users.json');

// Default Energo config (fallback if file doesn't exist)
const DEFAULT_ENERGO_CONFIG = {
  baseUrl: 'https://backend.energo.vip/api',
  token: 'eyJhbGciOiJIUzUxMiJ9.eyJqdGkiOiIyNGUyMWYxYjBmN2Q0MWU3ODU5NmZiYmVkOGM5NGMzMiIsInVzZXIiOiJjdWJVU0EyMDI1IiwiaXNBcGlUb2tlbiI6ZmFsc2UsInN1YiI6ImN1YlVTQTIwMjUiLCJBUElLRVkiOiJidXpOTEQyMDI0IiwiZXhwIjoxNzY5NDQ1NzA5fQ.A_YhhSjlMUbiEZ6l0RvX3eHdAqPsW36HTGukF8yBwVa1t_3rHQUHcwEmMUXDTkS3koQnhcYU20aNZ0Txvxk0ww',
  oid: '3526',
};

// In-memory token cache (shared with server.js via module-level variable)
// This allows immediate use of updated tokens on Vercel
let tokenCache = null;

/**
 * Set token cache (called from server.js after update)
 */
function setTokenCache(token) {
  tokenCache = token;
}

/**
 * Get token cache (for reading current cached token)
 */
function getTokenCache() {
  return tokenCache;
}

/**
 * Get Energo configuration (reads from cache first, then env var, then file, then default)
 * @returns {Promise<Object>} Energo config object
 */
async function getEnergoConfig() {
  // Priority 1: In-memory cache (for immediate use after update on Vercel)
  if (tokenCache) {
    return {
      baseUrl: 'https://backend.energo.vip/api',
      token: tokenCache,
      oid: process.env.ENERGO_OID || DEFAULT_ENERGO_CONFIG.oid,
    };
  }
  
  // Priority 2: Environment variable (for Vercel/production)
  if (process.env.ENERGO_TOKEN) {
    return {
      baseUrl: 'https://backend.energo.vip/api',
      token: process.env.ENERGO_TOKEN,
      oid: process.env.ENERGO_OID || DEFAULT_ENERGO_CONFIG.oid,
    };
  }
  
  // Priority 3: Config file (for local development)
  try {
    const configData = await fs.readFile(energoConfigPath, 'utf8');
    const config = JSON.parse(configData);
    return {
      baseUrl: 'https://backend.energo.vip/api',
      token: config.token || DEFAULT_ENERGO_CONFIG.token,
      oid: config.oid || DEFAULT_ENERGO_CONFIG.oid,
    };
  } catch (error) {
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
    
    // Check if fetch was successful
    if (response.ok && parsedResult.code === 0 && parsedResult.page) {
      // Calculate totals from records
      const records = parsedResult.page.records || [];
      const validRecords = records.filter(record => {
        const settledAmount = parseFloat(record.settledAmount || 0);
        return settledAmount > 0;
      });
      
      const totalRecords = validRecords.length;
      const totalRevenue = validRecords.reduce((sum, record) => {
        return sum + (parseFloat(record.settledAmount) || 0);
      }, 0);
      
      // Save successful data to cache
      if (username) {
        const cachedMetrics = getCachedStationMetrics(username, stationId) || {};
        saveStationMetricsToCache(username, stationId, {
          ...cachedMetrics,
          totalRecords: totalRecords,
          totalRevenue: totalRevenue
        });
      }
      
      return { response, result: parsedResult };
    } else {
      // Fetch failed, try to get from cache
      console.log(`⚠️  API fetch failed for station ${stationId} rental history, checking cache...`);
      if (username) {
        const cachedMetrics = getCachedStationMetrics(username, stationId);
        if (cachedMetrics && (cachedMetrics.totalRecords !== undefined || cachedMetrics.totalRevenue !== undefined)) {
          console.log(`📦 Using cached rental history for station ${stationId}`);
          return {
            response: { ok: true, status: 200 },
            result: {
              code: 0,
              msg: 'success',
              page: {
                total: cachedMetrics.totalRecords || 0,
                records: [],
                totalRevenue: cachedMetrics.totalRevenue || 0
              }
            }
          };
        }
      }
      
      // No cache available, return error response
      return { response, result: parsedResult };
    }
  } catch (error) {
    console.error(`❌ Error fetching ChargeNow rental history for ${stationId}:`, error.message);
    
    // Try to get from cache
    if (username) {
      const cachedMetrics = getCachedStationMetrics(username, stationId);
      if (cachedMetrics && (cachedMetrics.totalRecords !== undefined || cachedMetrics.totalRevenue !== undefined)) {
        console.log(`📦 Using cached rental history after error for station ${stationId}`);
        return {
          response: { ok: true, status: 200 },
          result: {
            code: 0,
            msg: 'success',
            page: {
              total: cachedMetrics.totalRecords || 0,
              records: [],
              totalRevenue: cachedMetrics.totalRevenue || 0
            }
          }
        };
      }
    }
    
    // No cache available, return error
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
 * Converts date string to Epoch timestamp (milliseconds)
 * @param {string} dateStr - Date string in format "YYYY-MM-DD HH:mm:ss" (assumed to be UTC)
 * @returns {number} - Epoch timestamp in milliseconds
 */
// ========================================
// USER DATA CACHE HELPERS
// ========================================

/**
 * Get cached station metrics from users.json for a specific user and station
 * Works for ALL user types (Host, Distributor, etc.) - no userType filtering
 * @param {string} username - The username (works for all user types)
 * @param {string} stationId - The station ID
 * @returns {Object|null} - Cached metrics or null if not found
 */
function getCachedStationMetrics(username, stationId) {
  try {
    const usersData = fsSync.readFileSync(usersFilePath, 'utf8');
    const users = JSON.parse(usersData);
    const user = users.find(u => u.username === username);
    
    if (!user || !user.stationMetrics || !user.stationMetrics[stationId]) {
      return null;
    }
    
    return user.stationMetrics[stationId];
  } catch (error) {
    console.error('Error reading cached station metrics:', error);
    return null;
  }
}

/**
 * Save station metrics to users.json for a specific user and station
 * Works for ALL user types (Host, Distributor, etc.) - no userType filtering
 * @param {string} username - The username (works for all user types)
 * @param {string} stationId - The station ID
 * @param {Object} metrics - The metrics to save (pBorrow, pAlso, totalRecords, totalRevenue, stationTitle)
 */
function saveStationMetricsToCache(username, stationId, metrics) {
  try {
    const usersData = fsSync.readFileSync(usersFilePath, 'utf8');
    const users = JSON.parse(usersData);
    const userIndex = users.findIndex(u => u.username === username);
    
    if (userIndex === -1) {
      console.error(`User ${username} not found in users.json`);
      return;
    }
    
    // Initialize stationMetrics if it doesn't exist
    if (!users[userIndex].stationMetrics) {
      users[userIndex].stationMetrics = {};
    }
    
    // Save metrics
    users[userIndex].stationMetrics[stationId] = {
      ...metrics,
      lastUpdated: new Date().toISOString()
    };
    
    fsSync.writeFileSync(usersFilePath, JSON.stringify(users, null, 2), 'utf8');
    console.log(`💾 Saved metrics to cache for user ${username}, station ${stationId}`);
  } catch (error) {
    console.error('Error saving station metrics to cache:', error);
  }
}

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
 * @param {string} username - The username (for cache lookup)
 * @returns {Promise<Object>} - Object containing response and result with returnNum and borrowNum
 */
async function fetchEnergoStationAvailability(cabinetId, username = null) {
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
  
  const url = `${energoConfig.baseUrl}/cabinet?cabinetId=${cabinetId}`;
  console.log('Making API call to Energo: /cabinet for station:', cabinetId);
  
  try {
    const response = await fetch(url, requestOptions);
    const result = await response.json();
    
    console.log('Energo station availability response status:', response.status);
    
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
      
      // Save successful data to cache
      if (username) {
        saveStationMetricsToCache(username, cabinetId, {
          pBorrow: borrowNum,
          pAlso: returnNum,
          stationTitle: stationData.shopName || cabinetId
        });
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
      // Fetch failed, try to get from cache
      console.log(`⚠️  API fetch failed for station ${cabinetId}, checking cache...`);
      if (username) {
        const cachedMetrics = getCachedStationMetrics(username, cabinetId);
        if (cachedMetrics) {
          console.log(`📦 Using cached metrics for station ${cabinetId}`);
          return {
            response: { ok: true, status: 200 },
            result: {
              content: [{
                cabinetId: cabinetId,
                shopName: cachedMetrics.stationTitle || cabinetId,
                positionInfo: {
                  returnNum: cachedMetrics.pAlso || 0,
                  borrowNum: cachedMetrics.pBorrow || 0
                }
              }],
              returnNum: cachedMetrics.pAlso || 0,
              borrowNum: cachedMetrics.pBorrow || 0
            }
          };
        }
      }
      
      // No cache available, return error response
      return {
        response: { ok: false, status: response.status || 500 },
        result: {
          ...result,
          returnNum: 0,
          borrowNum: 0
        }
      };
    }
  } catch (error) {
    console.error(`❌ Error fetching Energo station availability for ${cabinetId}:`, error.message);
    
    // Try to get from cache
    if (username) {
      const cachedMetrics = getCachedStationMetrics(username, cabinetId);
      if (cachedMetrics) {
        console.log(`📦 Using cached metrics after error for station ${cabinetId}`);
        return {
          response: { ok: true, status: 200 },
          result: {
            content: [{
              cabinetId: cabinetId,
              shopName: cachedMetrics.stationTitle || cabinetId,
              positionInfo: {
                returnNum: cachedMetrics.pAlso || 0,
                borrowNum: cachedMetrics.pBorrow || 0
              }
            }],
            returnNum: cachedMetrics.pAlso || 0,
            borrowNum: cachedMetrics.pBorrow || 0
          }
        };
      }
    }
    
    // No cache available, return error
    throw error;
  }
}

/**
 * Fetches rental history for a specific station within a date range (Energo)
 * @param {string} cabinetId - The cabinet/station ID
 * @param {string} sTime - Start time (format: "YYYY-MM-DD HH:mm:ss")
 * @param {string} eTime - End time (format: "YYYY-MM-DD HH:mm:ss")
 * @param {string} username - The username (for cache lookup)
 * @returns {Promise<Object>} - Object containing response and result with totalPay and totalElements
 */
async function fetchEnergoStationRentalHistory(cabinetId, sTime, eTime, username = null) {
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
  
  // Convert dates to Epoch format
  const startEpoch = dateToEpoch(sTime);
  const endEpoch = dateToEpoch(eTime);
  
  // URL encode the array brackets
  const url = `${energoConfig.baseUrl}/order?page=0&size=0&createTime%5B0%5D=${startEpoch}&createTime%5B1%5D=${endEpoch}&cabinetid=${cabinetId}&sort=id%2Cdesc`;
  console.log('Making API call to Energo: /order for station:', cabinetId);
  console.log('Date range:', sTime, 'to', eTime, `(${startEpoch} to ${endEpoch})`);
  
  try {
    const response = await fetch(url, requestOptions);
    const result = await response.json();
    
    console.log('Energo rental history response status:', response.status);
    
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
      
      // Save successful data to cache
      if (username) {
        const cachedMetrics = getCachedStationMetrics(username, cabinetId) || {};
        saveStationMetricsToCache(username, cabinetId, {
          ...cachedMetrics,
          totalRecords: totalElements,
          totalRevenue: totalPay
        });
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
      // Fetch failed, try to get from cache
      console.log(`⚠️  API fetch failed for station ${cabinetId} rental history, checking cache...`);
      if (username) {
        const cachedMetrics = getCachedStationMetrics(username, cabinetId);
        if (cachedMetrics && (cachedMetrics.totalRecords !== undefined || cachedMetrics.totalRevenue !== undefined)) {
          console.log(`📦 Using cached rental history for station ${cabinetId}`);
          return {
            response: { ok: true, status: 200 },
            result: {
              content: [],
              totalPay: cachedMetrics.totalRevenue || 0,
              totalElements: cachedMetrics.totalRecords || 0
            }
          };
        }
      }
      
      // No cache available, return error response
      return {
        response: { ok: false, status: response.status || 500 },
        result: {
          ...result,
          totalPay: 0,
          totalElements: 0
        }
      };
    }
  } catch (error) {
    console.error(`❌ Error fetching Energo rental history for ${cabinetId}:`, error.message);
    
    // Try to get from cache
    if (username) {
      const cachedMetrics = getCachedStationMetrics(username, cabinetId);
      if (cachedMetrics && (cachedMetrics.totalRecords !== undefined || cachedMetrics.totalRevenue !== undefined)) {
        console.log(`📦 Using cached rental history after error for station ${cabinetId}`);
        return {
          response: { ok: true, status: 200 },
          result: {
            content: [],
            totalPay: cachedMetrics.totalRevenue || 0,
            totalElements: cachedMetrics.totalRecords || 0
          }
        };
      }
    }
    
    // No cache available, return error
    throw error;
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
    const energoConfig = await getEnergoConfig();
    // Use a known Energo station ID (RL3T format)
    const testStationId = 'RL3T062411030004';
    
    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${energoConfig.token}`);
    myHeaders.append("Referer", "https://backend.energo.vip/device/list");
    myHeaders.append("oid", energoConfig.oid);
    
    const requestOptions = {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow'
    };
    
    const url = `${energoConfig.baseUrl}/cabinet?cabinetId=${testStationId}`;
    
    const response = await fetch(url, requestOptions);
    
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
  // Token cache management
  setTokenCache,
  getTokenCache,
  
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

