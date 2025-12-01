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

// ========================================
// CONFIGURATION
// ========================================

const CHARGENOW_CONFIG = {
  baseUrl: 'https://developer.chargenow.top/cdb-open-api/v1',
  credentials: 'Basic VmxhZFZhbGNoa292OlZWMTIxMg==', // Base64 encoded credentials
};

const ENERGO_CONFIG = {
  baseUrl: 'https://backend.energo.vip/api',
  token: 'eyJhbGciOiJIUzUxMiJ9.eyJqdGkiOiI2NThjNjA5YzE4MGE0YzA3OWUzNTNhYzA1YTZkZTBmYiIsInVzZXIiOiJjdWJVU0EyMDI1IiwiaXNBcGlUb2tlbiI6ZmFsc2UsInN1YiI6ImN1YlVTQTIwMjUiLCJBUElLRVkiOiJidXpOTEQyMDI0IiwiZXhwIjoxNzY3MDQ3MzgzfQ.iFJUU_GC9lwPLmLLY6pUSofg1-gdQNY3ohVON3HnbNi4hSd4WoAUk1xN2NgUPMNWy-A6znYhJCC7mqltOu0v6Q',
  oid: '3526',
};

// ========================================
// API DETECTION HELPERS
// ========================================

/**
 * Determines which API to use based on username or station ID
 * @param {string} username - The username
 * @param {string} stationId - The station ID (optional)
 * @returns {string} - 'energo' or 'chargenow'
 */
function determineSupplier(username, stationId = null) {
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
async function fetchChargeNowStationRentalHistory(stationId, sTime, eTime, page = 1, limit = 1000) {
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
 * @returns {Promise<Object>} - Object containing response and result with returnNum and borrowNum
 */
async function fetchEnergoStationAvailability(cabinetId) {
  const myHeaders = new Headers();
  myHeaders.append("Authorization", `Bearer ${ENERGO_CONFIG.token}`);
  myHeaders.append("Referer", "https://backend.energo.vip/device/list");
  myHeaders.append("oid", ENERGO_CONFIG.oid);
  
  const requestOptions = {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow'
  };
  
  const url = `${ENERGO_CONFIG.baseUrl}/cabinet?cabinetId=${cabinetId}`;
  console.log('Making API call to Energo: /cabinet for station:', cabinetId);
  
  const response = await fetch(url, requestOptions);
  const result = await response.json();
  
  console.log('Energo station availability response status:', response.status);
  
  // Extract returnNum and borrowNum from positionInfo
  let returnNum = 0;
  let borrowNum = 0;
  
  if (result.content && result.content.length > 0) {
    const stationData = result.content[0];
    if (stationData.positionInfo) {
      returnNum = stationData.positionInfo.returnNum || 0;
      borrowNum = stationData.positionInfo.borrowNum || 0;
    }
  }
  
  return { 
    response, 
    result: {
      ...result,
      returnNum,
      borrowNum
    }
  };
}

/**
 * Fetches rental history for a specific station within a date range (Energo)
 * @param {string} cabinetId - The cabinet/station ID
 * @param {string} sTime - Start time (format: "YYYY-MM-DD HH:mm:ss")
 * @param {string} eTime - End time (format: "YYYY-MM-DD HH:mm:ss")
 * @returns {Promise<Object>} - Object containing response and result with totalPay and totalElements
 */
async function fetchEnergoStationRentalHistory(cabinetId, sTime, eTime) {
  const myHeaders = new Headers();
  myHeaders.append("Authorization", `Bearer ${ENERGO_CONFIG.token}`);
  myHeaders.append("Referer", "https://backend.energo.vip/device/list");
  myHeaders.append("oid", ENERGO_CONFIG.oid);
  
  const requestOptions = {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow'
  };
  
  // Convert dates to Epoch format
  const startEpoch = dateToEpoch(sTime);
  const endEpoch = dateToEpoch(eTime);
  
  // URL encode the array brackets
  const url = `${ENERGO_CONFIG.baseUrl}/order?page=0&size=0&createTime%5B0%5D=${startEpoch}&createTime%5B1%5D=${endEpoch}&cabinetid=${cabinetId}&sort=id%2Cdesc`;
  console.log('Making API call to Energo: /order for station:', cabinetId);
  console.log('Date range:', sTime, 'to', eTime, `(${startEpoch} to ${endEpoch})`);
  
  const response = await fetch(url, requestOptions);
  const result = await response.json();
  
  console.log('Energo rental history response status:', response.status);
  
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
}

/**
 * Fetches station data from Energo API
 * Returns a single station in ChargeNow-compatible format
 * @param {string} cabinetId - The cabinet/station ID
 * @returns {Promise<string>} - JSON string of station data in ChargeNow format
 */
async function fetchEnergoStation(cabinetId) {
  try {
    const { result } = await fetchEnergoStationAvailability(cabinetId);
    
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
  const supplier = determineSupplier(username);
  
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
  const supplier = determineSupplier(username, stationId);
  
  if (supplier === 'energo') {
    const { response, result } = await fetchEnergoStationRentalHistory(stationId, sTime, eTime);
    
    // Convert Energo format to ChargeNow-compatible format
    return {
      response,
      result: {
        code: response.ok ? 0 : -1,
        msg: response.ok ? 'success' : 'error',
        page: {
          total: result.totalElements || 0,
          records: result.content || [],
          // Map totalPay to settledAmount for compatibility
          totalRevenue: result.totalPay || 0
        }
      }
    };
  }
  
  // Default to ChargeNow
  return await fetchChargeNowStationRentalHistory(stationId, sTime, eTime, page, limit);
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
  ENERGO_CONFIG
};

