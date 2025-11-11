// ========================================
// CHARGENOW API MODULE
// ========================================
// This module handles all API interactions with the ChargeNow service
// Isolating these functions makes it easier to:
// - Switch to a different supplier in the future
// - Mock API calls for testing
// - Maintain and update API logic independently
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

// ========================================
// CORE API FUNCTIONS
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
 * Fetches rental history for a specific station within a date range
 * @param {string} stationId - The station/device ID (pCabinetid parameter)
 * @param {string} sTime - Start time (format: "YYYY-MM-DD HH:mm:ss")
 * @param {string} eTime - End time (format: "YYYY-MM-DD HH:mm:ss")
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Items per page (default: 1000)
 * @returns {Promise<Object>} - Object containing response and result
 */
async function fetchStationRentalHistory(stationId, sTime, eTime, page = 1, limit = 1000) {
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
 * Dispenses a battery from a specific station using popAll endpoint
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
 * Ejects a battery from a specific slot using repair mode
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
  
  const totalRevenue = orders.reduce((sum, order) => {
    const amount = parseFloat(order.amount) || 0;
    return sum + amount;
  }, 0);
  
  return {
    totalRevenue: totalRevenue,
    totalRecords: orders.length
  };
}

// ========================================
// EXPORTS
// ========================================

module.exports = {
  // Core API functions
  fetchChargeNowStations,
  fetchBatteryRentalInfo,
  fetchStationAvailability,
  fetchStationRentalHistory,
  dispenseBattery,
  ejectBatteryByRepair,
  
  // Helper functions
  generateDemoStationData,
  calculateOrderStats,
  
  // Configuration (for future customization)
  CHARGENOW_CONFIG
};

