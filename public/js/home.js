window.onload = function() {
  // Use the remote API URL from config
  const apiUrl = window.API_CONFIG ? window.API_CONFIG.getApiUrl : (endpoint) => endpoint;
  
  fetch(apiUrl('/me'), {
    credentials: 'include' // Include cookies for authentication
  }).then(r => {
    if (r.status !== 200) { window.location = '/login'; return; }
    return r.json();
  }).then(data => {
    if (!data) return;
    // Note: 'welcome' element doesn't exist in home.html, so we skip this
    // The welcome message is handled by the data attributes on the container
  });
  
  // Initialize date inputs with default values (last month)
  initializeDateInputs();
  
          // Add event listeners for automatic date changes
        document.getElementById('start-date').addEventListener('change', function() {
          fetchStations();
        });
        
        document.getElementById('end-date').addEventListener('change', function() {
          fetchStations();
        });
  
          // Fetch and display stations
        fetchStations();
        
        // Initialize summary stats
        updateSummaryStats();
        
        // Initialize menu functionality
        initializeMenu();
};

function initializeDateInputs() {
  const endDate = new Date();
  const startDate = new Date();
  
  // Set start date to the first day of the current month
  startDate.setDate(1);
  
  // Use local date formatting to avoid timezone issues
  document.getElementById('start-date').value = startDate.toLocaleDateString('en-CA');
  document.getElementById('end-date').value = endDate.toLocaleDateString('en-CA');
}

function getSelectedDateRange() {
  const startDate = document.getElementById('start-date').value;
  const endDate = document.getElementById('end-date').value;
  
  if (!startDate || !endDate) {
    // Fallback to first day of current month to current date if dates not selected
    const end = new Date();
    const start = new Date();
    start.setDate(1);
    
    return {
      sTime: start.toISOString().slice(0, 19).replace('T', ' '),
      eTime: end.toISOString().slice(0, 19).replace('T', ' ')
    };
  }
  
  // Convert selected dates to the format expected by the API
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T23:59:59');
  
  return {
    sTime: start.toISOString().slice(0, 19).replace('T', ' '),
    eTime: end.toISOString().slice(0, 19).replace('T', ' ')
  };
}

async function fetchStations() {
  try {
    console.log('Fetching stations...');
    
    // Get selected date range
    const dateRange = getSelectedDateRange();
    
    // Build query string with date parameters
    const queryParams = new URLSearchParams({
      startDate: document.getElementById('start-date').value,
      endDate: document.getElementById('end-date').value
    });
    
    const response = await fetch(`/api/stations?${queryParams}`, {
      credentials: 'include' // Include cookies for authentication
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Stations data:', result);
    
    if (result.success && result.data) {
      displayStations(result.data);
    } else {
      console.error('Failed to fetch stations:', result);
      document.getElementById('station-list').innerHTML = '<p>Error loading stations</p>';
    }
  } catch (error) {
    console.error('Error fetching stations:', error);
    document.getElementById('station-list').innerHTML = '<p>Error loading stations</p>';
  }
}

// Cache for station coordinates
let stationCoordinatesCache = null;

/**
 * Loads station coordinates from API
 * @returns {Promise<Object>} Object mapping station IDs to coordinates
 */
async function loadStationCoordinates() {
  if (stationCoordinatesCache) {
    return stationCoordinatesCache;
  }
  
  try {
    const apiUrl = window.API_CONFIG ? window.API_CONFIG.getApiUrl : (endpoint) => endpoint;
    const response = await fetch(apiUrl('/api/admin/stations'), {
      credentials: 'include' // Include cookies for authentication
    });
    
    if (!response.ok) {
      console.error('Failed to fetch station coordinates:', response.status);
      return {};
    }
    
    const stations = await response.json();
    const coordinatesMap = {};
    
    stations.forEach(station => {
      if (station.id && station.coordinates && Array.isArray(station.coordinates) && station.coordinates.length === 2) {
        coordinatesMap[station.id] = {
          coordinates: station.coordinates,
          address: station.address || ''
        };
      }
    });
    
    stationCoordinatesCache = coordinatesMap;
    return coordinatesMap;
  } catch (error) {
    console.error('Error loading station coordinates:', error);
    return {};
  }
}

/**
 * Opens Apple Maps directions to a location
 * @param {string} stationId - Station ID to look up coordinates
 * @param {string} stationTitle - Station title/name
 */
window.openAppleMapsDirections = async function(stationId, stationTitle) {
  const coordinatesMap = await loadStationCoordinates();
  const stationInfo = coordinatesMap[stationId];
  
  if (!stationInfo || !stationInfo.coordinates) {
    // Fallback: try to use address or station title
    const address = stationInfo?.address || stationTitle;
    const encodedAddress = encodeURIComponent(address);
    window.location.href = `https://maps.apple.com/?q=${encodedAddress}`;
    return;
  }
  
  const [lng, lat] = stationInfo.coordinates;
  // Apple Maps URL format: https://maps.apple.com/?daddr=lat,lng
  window.location.href = `https://maps.apple.com/?daddr=${lat},${lng}`;
}

function displayStations(stationsData) {
  const stationList = document.getElementById('station-list');
  
  // Check if the data has the expected structure
  let stations = [];
  
  if (Array.isArray(stationsData)) {
    stations = stationsData;
  } else if (stationsData.data && Array.isArray(stationsData.data)) {
    stations = stationsData.data;
  } else if (typeof stationsData === 'string') {
    try {
      const parsed = JSON.parse(stationsData);
      if (Array.isArray(parsed)) {
        stations = parsed;
      } else if (parsed.data && Array.isArray(parsed.data)) {
        stations = parsed.data;
      }
    } catch (e) {
      console.error('Failed to parse stations data:', e);
    }
  }
  
  if (stations.length === 0) {
    stationList.innerHTML = '<p>No stations assigned to your account. Please contact an administrator to get access to stations.</p>';
    return;
  }
  
  console.log('Processing stations:', stations);
  
  // Get username and userType from data attributes
  const container = document.querySelector('.container');
  const currentUsername = container ? container.getAttribute('data-username') : null;
  const currentUserType = container ? container.getAttribute('data-usertype') : null;
  
  // Create the station list
  const stationHTML = stations.map((station, index) => {
    const stationId = station.pCabinetid || station.id || `Station ${index + 1}`;
    const stationTitle = station.stationTitle || stationId; // Use title from backend, fallback to ID
    const pBorrow = parseInt(station.pBorrow) || 0;
    const pAlso = parseInt(station.pAlso) || 0;
    
    // Get order data from backend
    const orderData = station.orderData || {};
    const totalRents = orderData.totalRecords || 0;
    const totalRevenue = orderData.totalRevenue || 0;
    
    // Determine card style for Distributor accounts
    let cardClass = 'station-card';
    let buttonHTML = '';
    
    if (currentUserType === 'Distributor') {
      if (pBorrow < 3) {
        // Red card: to take < 3
        cardClass = 'station-card station-card-red';
        buttonHTML = `
          <div class="pop-out-section">
            <button class="service-btn service-btn-red" onclick="openAppleMapsDirections('${stationId}', '${stationTitle.replace(/'/g, "\\'")}')">SERVICE!</button>
          </div>
        `;
      } else if (pBorrow <= pAlso) {
        // Yellow card: to take <= to return
        cardClass = 'station-card station-card-yellow';
        buttonHTML = `
          <div class="pop-out-section">
            <button class="service-btn service-btn-yellow" onclick="openAppleMapsDirections('${stationId}', '${stationTitle.replace(/'/g, "\\'")}')">Service</button>
          </div>
        `;
      } else {
        // Normal card with pop out button
        buttonHTML = `
          <div class="pop-out-section">
            <button class="pop-out-btn" onclick="dispenseBattery('${stationId}')">Pop out</button>
          </div>
        `;
      }
    }
    
    return `
      <div class="${cardClass}">
        <div class="station-header">
          <div class="station-title">
            <p class="station-id">${stationTitle}</p>
          </div>
          <div class="station-counts">
            <div class="count-item">
              <div class="count-circle blue"></div>
              <div class="count-number">${pBorrow}</div>
              <div class="count-label">To Take</div>
            </div>
            <div class="count-item">
              <div class="count-circle grey"></div>
              <div class="count-number">${pAlso}</div>
              <div class="count-label">To Return</div>
            </div>
          </div>
        </div>
        <div class="station-footer">
          <div class="revenue-section">
            <div class="revenue-amount">$${Math.round(totalRevenue)}</div>
            <div class="revenue-label">Revenue</div>
          </div>
          <div class="rents-section">
            <div class="rents-number">${totalRents}</div>
            <div class="rents-label">Rents</div>
          </div>
          ${buttonHTML}
        </div>
      </div>
    `;
  }).join('');
  
  stationList.innerHTML = stationHTML;
  
  // Update summary stats after displaying stations
  updateSummaryStats();
}

function updateSummaryStats() {
  const stationCards = document.querySelectorAll('.station-card');
  let totalRevenue = 0;
  let totalRents = 0;
  
  stationCards.forEach(card => {
    const revenueElement = card.querySelector('.revenue-amount');
    const rentsElement = card.querySelector('.rents-number');
    
    if (revenueElement) {
      const revenue = parseFloat(revenueElement.textContent.replace('$', '')) || 0;
      totalRevenue += revenue;
    }
    
    if (rentsElement) {
      const rents = parseInt(rentsElement.textContent) || 0;
      totalRents += rents;
    }
  });
  
  // Get username and userType from data attributes
  const container = document.querySelector('.container');
  const currentUsername = container ? container.getAttribute('data-username') : null;
  const currentUserType = container ? container.getAttribute('data-usertype') : null;
  
  // Debug: Log current user info
  console.log('Current username:', currentUsername);
  console.log('Current userType:', currentUserType);
  console.log('UserType type:', typeof currentUserType);
  
  // Update the summary display based on user type
  const takeHomeElement = document.getElementById('take-home');
  const takeHomeLabel = document.querySelector('#take-home').parentElement.querySelector('.stat-label');
  
  // Check if username is "parlay" (case-insensitive)
  if (currentUsername && currentUsername.toLowerCase() === 'parlay') {
    // For parlay account, take home = number of rents (as dollar amount)
    takeHomeElement.textContent = `$${totalRents}`;
    takeHomeLabel.textContent = 'Take home';
    console.log('Parlay user detected - take home equals number of rents:', totalRents);
  } else if (currentUserType === 'Distributor') {
    // For Distributor accounts, show total rents count instead of take-home amount
    takeHomeElement.textContent = totalRents;
    takeHomeLabel.textContent = 'Rents';
    console.log('Distributor user detected - showing total rents:', totalRents);
  } else {
    // For other account types, calculate take home based on percentage
    let takeHomePercentage = 1.0; // Default 100% for most users
    
    if (currentUserType === 'Host') {
      takeHomePercentage = 0.2;
      console.log('Host user detected - using 20% take home');
    } else {
      console.log('Unknown user type - using default 100% take home');
    }
    
    console.log('Take home percentage:', takeHomePercentage);
    const takeHome = Math.round(totalRevenue * takeHomePercentage);
    takeHomeElement.textContent = `$${takeHome}`;
    takeHomeLabel.textContent = 'Take home';
  }
  
  document.getElementById('total-revenue').textContent = `$${Math.round(totalRevenue)}`;
}

// Menu functionality
function initializeMenu() {
  const menuIcon = document.getElementById('menu-icon');
  const menuOverlay = document.getElementById('menu-overlay');
  
  // Toggle menu when hamburger icon is clicked
  menuIcon.addEventListener('click', function() {
    if (menuIcon.classList.contains('active')) {
      // If menu is open, close it
      menuIcon.classList.remove('active');
      menuOverlay.classList.remove('active');
    } else {
      // If menu is closed, open it
      menuIcon.classList.add('active');
      menuOverlay.classList.add('active');
    }
  });
  
  // Close menu when clicking outside menu items
  menuOverlay.addEventListener('click', function(e) {
    if (e.target === menuOverlay) {
      menuIcon.classList.remove('active');
      menuOverlay.classList.remove('active');
    }
  });
  
  // Close menu with Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && menuOverlay.classList.contains('active')) {
      menuIcon.classList.remove('active');
      menuOverlay.classList.remove('active');
    }
  });
}

// Battery dispense functionality for Distributor users
function dispenseBattery(stationId) {
  console.log('Dispense request for station:', stationId);
  
  // Show confirmation dialog
  const confirmed = confirm(`Are you sure you want to dispense all batteries for station ${stationId}?`);
  
  if (!confirmed) {
    console.log('Dispense cancelled by user for station:', stationId);
    return;
  }
  
  console.log('Dispensing battery from station:', stationId);
  
  // Show loading state
  const button = event.target;
  const originalText = button.textContent;
  button.textContent = 'Dispensing...';
  button.disabled = true;
  
  // Make the API call to our backend endpoint
  fetch('/api/dispense-battery', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies for authentication
    body: JSON.stringify({ stationId: stationId })
  })
    .then(response => response.json())
    .then(result => {
      console.log('Dispense result:', result);
      
      if (result.success) {
        // Show success message
        button.textContent = 'Success!';
        button.style.background = '#4CAF50';
        console.log('✅ Battery dispensed successfully from station:', result.stationId);
        console.log('📡 API Response:', result.apiMessage);
      } else {
        // Show error message
        button.textContent = 'Failed!';
        button.style.background = '#f44336';
        console.log('❌ Battery dispense failed for station:', result.stationId);
        console.log('📡 API Error:', result.apiMessage);
        console.log('🔍 Full response:', result);
      }
      
      // Reset button after 2 seconds
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
        button.style.background = '';
      }, 2000);
    })
    .catch(error => {
      console.error('Dispense error:', error);
      
      // Show error message
      button.textContent = 'Error!';
      button.style.background = '#f44336';
      
      // Reset button after 2 seconds
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
        button.style.background = '';
      }, 2000);
    });
}

 