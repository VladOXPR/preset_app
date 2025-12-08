// ========================================
// MAINTENANCE MONITORING SYSTEM
// ========================================
// Monitors station battery levels and sends alerts via Twilio
// when stations have less than 3 batteries available
// ========================================

const supplierAPI = require('./supplierApi');
const fs = require('fs');
const path = require('path');

// Add fetch for Node.js (if not using Node 18+)
let fetch;
if (typeof globalThis.fetch === 'undefined') {
  fetch = require('node-fetch');
} else {
  fetch = globalThis.fetch;
}

// Twilio Configuration
// All sensitive values should be set via environment variables
const TWILIO_CONFIG = {
  accountSid: process.env.TWILIO_ACCOUNT_SID || '',
  authToken: process.env.TWILIO_AUTH_TOKEN || '',
  messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID || '',
  alertPhoneNumber: process.env.TWILIO_ALERT_PHONE || '',
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
  calendarLink: process.env.CALENDAR_LINK || 'https://calendar.google.com'
};

// Station monitoring state
let stationIndex = 0;
let stations = [];
// Track which stations have already sent alerts (to prevent duplicate alerts)
// Set contains station IDs that are currently below 3 batteries and have already been alerted
const alertedStations = new Set();

/**
 * Loads stations from stations.json file
 * @returns {Array} Array of station objects with id, name, and address
 */
function loadStations() {
  try {
    const stationsPath = path.join(__dirname, 'data', 'stations.json');
    const stationsData = fs.readFileSync(stationsPath, 'utf8');
    const stationsList = JSON.parse(stationsData);
    
    console.log(`[MAINTENANCE] Loaded ${stationsList.length} stations from stations.json`);
    return stationsList;
  } catch (error) {
    console.error('[MAINTENANCE] Error loading stations:', error.message);
    return [];
  }
}

/**
 * Sends a Twilio SMS alert
 * @param {string} stationTitle - The station location title
 * @returns {Promise<void>}
 */
async function sendTwilioAlert(stationTitle) {
  // Check if auth token is configured
  if (!TWILIO_CONFIG.authToken) {
    console.error('[MAINTENANCE] Twilio auth token not configured. Set TWILIO_AUTH_TOKEN environment variable.');
    return;
  }

  const messageBody = `Alert: Under 3 batteries @ ${stationTitle}\n\nSchedule a visit: ${TWILIO_CONFIG.calendarLink}`;
  
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_CONFIG.accountSid}/Messages.json`;
  
  const params = new URLSearchParams();
  params.append('To', TWILIO_CONFIG.alertPhoneNumber);
  params.append('MessagingServiceSid', TWILIO_CONFIG.messagingServiceSid);
  params.append('Body', messageBody);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${TWILIO_CONFIG.accountSid}:${TWILIO_CONFIG.authToken}`).toString('base64')}`
      },
      body: params.toString()
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log(`[MAINTENANCE] ✅ Alert sent successfully for ${stationTitle}. SID: ${result.sid}`);
    } else {
      console.error(`[MAINTENANCE] ❌ Failed to send alert for ${stationTitle}:`, result.message || result);
    }
  } catch (error) {
    console.error(`[MAINTENANCE] ❌ Error sending Twilio alert for ${stationTitle}:`, error.message);
  }
}

/**
 * Checks a single station's battery availability
 * @param {string} stationId - The station ID to check
 * @param {string} stationTitle - The station title/location name
 * @returns {Promise<void>}
 */
async function checkStationBatteries(stationId, stationTitle) {
  try {
    console.log(`[MAINTENANCE] Checking station: ${stationId} (${stationTitle})`);
    
    // Use ChargeNow API to fetch station availability
    const { response, result } = await supplierAPI.fetchStationAvailability(stationId);
    
    if (!response.ok) {
      console.error(`[MAINTENANCE] ❌ API request failed for ${stationId}:`, response.status);
      return;
    }

    // Extract the "to take" number (pBorrow) from the response
    // ChargeNow API response structure can vary, so we check multiple possible locations
    let toTakeCount = 0;
    
    if (result) {
      // Try different possible response structures
      if (result.data) {
        // Structure 1: result.data is an array
        if (Array.isArray(result.data) && result.data.length > 0) {
          const stationData = result.data[0];
          toTakeCount = parseInt(stationData.pBorrow || stationData.availableBatteries || stationData.emptySlots || 0);
        }
        // Structure 2: result.data is an object with cabinet
        else if (result.data.cabinet) {
          toTakeCount = parseInt(result.data.cabinet.emptySlots || result.data.cabinet.pBorrow || 0);
        }
        // Structure 3: result.data is an object with direct properties
        else if (result.data.pBorrow !== undefined) {
          toTakeCount = parseInt(result.data.pBorrow || 0);
        } else if (result.data.availableBatteries !== undefined) {
          toTakeCount = parseInt(result.data.availableBatteries || 0);
        } else if (result.data.emptySlots !== undefined) {
          toTakeCount = parseInt(result.data.emptySlots || 0);
        }
      }
      // Structure 4: Direct properties on result
      else if (result.pBorrow !== undefined) {
        toTakeCount = parseInt(result.pBorrow || 0);
      } else if (result.availableBatteries !== undefined) {
        toTakeCount = parseInt(result.availableBatteries || 0);
      }
    }
    
    // Log the full response structure for debugging if we couldn't find the count
    if (toTakeCount === 0 && result) {
      console.log(`[MAINTENANCE] ⚠️  Could not find battery count in response structure. Full result:`, JSON.stringify(result, null, 2));
    }

    console.log(`[MAINTENANCE] Station ${stationId} has ${toTakeCount} batteries available (to take)`);

    // Check if less than 3 batteries
    if (toTakeCount < 3) {
      // Check if we've already sent an alert for this station
      if (!alertedStations.has(stationId)) {
        // First time detecting low batteries for this station - send alert
        console.log(`[MAINTENANCE] ⚠️  ALERT: Station ${stationId} (${stationTitle}) has only ${toTakeCount} batteries!`);
        await sendTwilioAlert(stationTitle);
        // Mark this station as alerted
        alertedStations.add(stationId);
        console.log(`[MAINTENANCE] 📝 Station ${stationId} added to alerted stations list`);
      } else {
        // Already sent alert for this station - skip to avoid duplicates
        console.log(`[MAINTENANCE] ⚠️  Station ${stationId} (${stationTitle}) still has only ${toTakeCount} batteries (alert already sent)`);
      }
    } else {
      // Station has 3 or more batteries
      if (alertedStations.has(stationId)) {
        // Station recovered - remove from alerted list so it can alert again if it drops
        alertedStations.delete(stationId);
        console.log(`[MAINTENANCE] ✅ Station ${stationId} (${stationTitle}) recovered! Removed from alerted list. Batteries: ${toTakeCount}`);
      } else {
        console.log(`[MAINTENANCE] ✓ Station ${stationId} (${stationTitle}) has sufficient batteries (${toTakeCount})`);
      }
    }
  } catch (error) {
    console.error(`[MAINTENANCE] ❌ Error checking station ${stationId}:`, error.message);
  }
}

/**
 * Main maintenance monitoring function
 * Rotates through stations every 5 seconds, checking battery levels
 */
async function startMaintenanceMonitoring() {
  console.log('[MAINTENANCE] 🚀 Starting maintenance monitoring system...');
  
  // Load stations from stations.json
  stations = loadStations();
  
  if (stations.length === 0) {
    console.error('[MAINTENANCE] ❌ No stations found. Cannot start monitoring.');
    return;
  }

  console.log(`[MAINTENANCE] 📊 Monitoring ${stations.length} stations`);
  console.log(`[MAINTENANCE] ⏱️  Checking interval: 5 seconds per station`);
  console.log(`[MAINTENANCE] 📱 Alert threshold: Less than 3 batteries`);
  
  // Check first station immediately
  if (stations.length > 0) {
    const firstStation = stations[0];
    await checkStationBatteries(firstStation.id, firstStation.name);
    stationIndex = 1; // Start from second station next time
  }

  // Set up interval to check next station every 5 seconds
  setInterval(async () => {
    if (stations.length === 0) {
      // Reload stations in case they were updated
      stations = loadStations();
      if (stations.length === 0) {
        return;
      }
    }

    // Get current station (rotate through the list)
    const currentStation = stations[stationIndex % stations.length];
    
    // Check the station
    await checkStationBatteries(currentStation.id, currentStation.name);
    
    // Move to next station
    stationIndex = (stationIndex + 1) % stations.length;
  }, 5000); // 5 seconds

  console.log('[MAINTENANCE] ✅ Maintenance monitoring system is now running');
}

// Export the main function
module.exports = {
  startMaintenanceMonitoring
};

