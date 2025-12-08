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
      // Store station info by its 'id' field from stations.json
      // This 'id' should match the pCabinetid or id from the API
      if (station.id && station.address) {
        const stationData = {
          coordinates: station.coordinates || null,
          address: station.address
        };
        
        // Store by 'id' (primary key from stations.json)
        coordinatesMap[station.id] = stationData;
        
        // Also store by 'name' if it exists, for additional lookup flexibility
        if (station.name) {
          coordinatesMap[station.name] = stationData;
        }
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
 * Searches for station by ID in stations.json and uses the address
 * @param {string} stationId - Station ID (pCabinetid or id from API) to look up in stations.json
 * @param {string} stationTitle - Station title/name (fallback)
 */
window.openAppleMapsDirections = async function(stationId, stationTitle) {
  const coordinatesMap = await loadStationCoordinates();
  
  // Try to find station by exact ID match
  let stationInfo = coordinatesMap[stationId];
  
  // If not found, try case-insensitive match
  if (!stationInfo) {
    const allStationIds = Object.keys(coordinatesMap);
    const matchingId = allStationIds.find(id => id.toLowerCase() === stationId.toLowerCase());
    if (matchingId) {
      stationInfo = coordinatesMap[matchingId];
    }
  }
  
  // Prioritize address from stations.json
  if (stationInfo && stationInfo.address) {
    const encodedAddress = encodeURIComponent(stationInfo.address);
    // Use daddr parameter for directions
    window.location.href = `https://maps.apple.com/?daddr=${encodedAddress}`;
    return;
  }
  
  // Fallback to coordinates if address not available
  if (stationInfo && stationInfo.coordinates && Array.isArray(stationInfo.coordinates) && stationInfo.coordinates.length === 2) {
    const [lng, lat] = stationInfo.coordinates;
    // Apple Maps URL format: https://maps.apple.com/?daddr=lat,lng
    window.location.href = `https://maps.apple.com/?daddr=${lat},${lng}`;
    return;
  }
  
  // Final fallback: use station title
  const encodedTitle = encodeURIComponent(stationTitle);
  window.location.href = `https://maps.apple.com/?q=${encodedTitle}`;
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
            <button class="service-btn service-btn-red" onclick="openAppleMapsDirections('${stationId}', '${stationTitle.replace(/'/g, "\\'")}')">Restock Now</button>
          </div>
        `;
      } else if (pBorrow <= pAlso) {
        // Yellow card: to take <= to return
        cardClass = 'station-card station-card-yellow';
        buttonHTML = `
          <div class="pop-out-section">
            <button class="service-btn service-btn-yellow" onclick="openAppleMapsDirections('${stationId}', '${stationTitle.replace(/'/g, "\\'")}')">Restock Soon</button>
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
    
    // Add click handler for distributor accounts
    const clickHandler = currentUserType === 'Distributor' ? `onclick="openStationModal('${stationId}', '${stationTitle.replace(/'/g, "\\'")}', ${pBorrow}, ${pAlso}, ${totalRents}, ${totalRevenue}, '${cardClass}')"` : '';
    const cursorStyle = currentUserType === 'Distributor' ? 'style="cursor: pointer;"' : '';
    
    return `
      <div class="${cardClass}" ${clickHandler} ${cursorStyle}>
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

/**
 * Opens the station modal with station details
 * @param {string} stationId - Station ID
 * @param {string} stationTitle - Station title
 * @param {number} pBorrow - To take count
 * @param {number} pAlso - To return count
 * @param {number} totalRents - Total rents
 * @param {number} totalRevenue - Total revenue
 * @param {string} cardClass - Card class (for styling)
 */
window.openStationModal = async function(stationId, stationTitle, pBorrow, pAlso, totalRents, totalRevenue, cardClass) {
  const modalOverlay = document.getElementById('station-modal-overlay');
  const modal = document.getElementById('station-modal');
  
  // Load station data from stations.json
  const coordinatesMap = await loadStationCoordinates();
  const stationInfo = coordinatesMap[stationId] || {};
  const currentId = stationId;
  const currentAddress = stationInfo.address || '';
  
  // Determine restock button style (modal always stays grey)
  let restockButtonClass = 'restock-btn-grey';
  let restockButtonText = 'No restock needed';
  
  if (cardClass.includes('station-card-red')) {
    restockButtonClass = 'restock-btn-red';
    restockButtonText = 'Restock Now';
  } else if (cardClass.includes('station-card-yellow')) {
    restockButtonClass = 'restock-btn-yellow';
    restockButtonText = 'Restock Soon';
  }
  
  // Create modal content (always grey background and border)
  modal.className = 'station-modal';
  modal.innerHTML = `
    <button class="station-modal-close" onclick="closeStationModal()">×</button>
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
    </div>
    <div class="station-modal-input-group">
      <label for="modal-station-id">Station ID</label>
      <input type="text" id="modal-station-id" value="${currentId}" data-original-id="${currentId}">
    </div>
    <div class="station-modal-input-group">
      <label for="modal-station-address">Address</label>
      <input type="text" id="modal-station-address" value="${currentAddress}" data-original-address="${currentAddress}">
    </div>
    <div class="station-modal-buttons">
      <button class="pop-out-btn" onclick="dispenseBattery('${stationId}')">Pop out</button>
      <button class="restock-btn ${restockButtonClass}" onclick="handleRestock('${stationId}')">${restockButtonText}</button>
    </div>
  `;
  
  // Add event listener for ID change
  const idInput = document.getElementById('modal-station-id');
  let saveTimeout;
  idInput.addEventListener('input', function() {
    clearTimeout(saveTimeout);
    const newId = this.value.trim();
    const originalId = this.getAttribute('data-original-id');
    
    if (newId && newId !== originalId) {
      // Debounce: save after 1 second of no typing
      saveTimeout = setTimeout(() => {
        updateStationId(originalId, newId);
      }, 1000);
    }
  });
  
  // Add event listener for address change
  const addressInput = document.getElementById('modal-station-address');
  addressInput.addEventListener('blur', function() {
    const newAddress = this.value.trim();
    const originalAddress = this.getAttribute('data-original-address');
    const currentId = idInput.value.trim() || idInput.getAttribute('data-original-id');
    
    if (newAddress !== originalAddress) {
      updateStationAddress(currentId, newAddress);
    }
  });
  
  // Show modal
  modalOverlay.classList.add('active');
  
  // Close on overlay click (but not on modal click)
  modalOverlay.addEventListener('click', function(e) {
    if (e.target === modalOverlay) {
      closeStationModal();
    }
  });
}

/**
 * Closes the station modal
 */
window.closeStationModal = function() {
  const modalOverlay = document.getElementById('station-modal-overlay');
  modalOverlay.classList.remove('active');
  // Clear cache to reload station data
  stationCoordinatesCache = null;
}

/**
 * Updates station ID in stations.json
 * @param {string} oldId - Original station ID
 * @param {string} newId - New station ID
 */
async function updateStationId(oldId, newId) {
  try {
    const apiUrl = window.API_CONFIG ? window.API_CONFIG.getApiUrl : (endpoint) => endpoint;
    const response = await fetch(apiUrl('/api/admin/stations'), {
      credentials: 'include'
    });
    
    if (!response.ok) {
      console.error('Failed to fetch stations:', response.status);
      return;
    }
    
    const stations = await response.json();
    const stationIndex = stations.findIndex(s => s.id === oldId);
    
    if (stationIndex === -1) {
      console.error('Station not found:', oldId);
      return;
    }
    
    // Update the ID
    stations[stationIndex].id = newId;
    
    // Update via PUT request (use oldId in URL, newId in body)
    const updateResponse = await fetch(apiUrl(`/api/admin/stations/${oldId}`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        id: newId,
        name: stations[stationIndex].name || '',
        address: stations[stationIndex].address || '',
        coordinates: stations[stationIndex].coordinates || []
      })
    });
    
    if (updateResponse.ok) {
      console.log('Station ID updated successfully:', oldId, '->', newId);
      // Update the original ID attribute
      document.getElementById('modal-station-id').setAttribute('data-original-id', newId);
      // Clear cache to reload
      stationCoordinatesCache = null;
    } else {
      console.error('Failed to update station ID:', await updateResponse.text());
    }
  } catch (error) {
    console.error('Error updating station ID:', error);
  }
}

/**
 * Updates station address in stations.json
 * @param {string} stationId - Station ID
 * @param {string} newAddress - New address
 */
async function updateStationAddress(stationId, newAddress) {
  try {
    const apiUrl = window.API_CONFIG ? window.API_CONFIG.getApiUrl : (endpoint) => endpoint;
    const response = await fetch(apiUrl('/api/admin/stations'), {
      credentials: 'include'
    });
    
    if (!response.ok) {
      console.error('Failed to fetch stations:', response.status);
      return;
    }
    
    const stations = await response.json();
    const stationIndex = stations.findIndex(s => s.id === stationId);
    
    if (stationIndex === -1) {
      console.error('Station not found:', stationId);
      return;
    }
    
    // Update the address
    stations[stationIndex].address = newAddress;
    
    // Update via PUT request
    const updateResponse = await fetch(apiUrl(`/api/admin/stations/${stationId}`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        name: stations[stationIndex].name,
        address: newAddress,
        coordinates: stations[stationIndex].coordinates
      })
    });
    
    if (updateResponse.ok) {
      console.log('Station address updated successfully:', stationId);
      // Update the original address attribute
      document.getElementById('modal-station-address').setAttribute('data-original-address', newAddress);
      // Clear cache to reload
      stationCoordinatesCache = null;
    } else {
      console.error('Failed to update station address:', await updateResponse.text());
    }
  } catch (error) {
    console.error('Error updating station address:', error);
  }
}

/**
 * Handles restock button click
 * @param {string} stationId - Station ID
 */
window.handleRestock = function(stationId) {
  // Placeholder for restock functionality
  console.log('Restock requested for station:', stationId);
  // You can add restock logic here
}

 