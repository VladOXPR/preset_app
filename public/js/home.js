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
    
    // Check if this is an admin dashboard
    const isAdminDashboard = document.querySelector('.admin-dashboard');
    if (isAdminDashboard) {
      // For admin dashboard, don't try to update welcome element
      console.log('Admin dashboard detected');
    } else {
      // For regular dashboard, update welcome element if it exists
      const welcomeElement = document.getElementById('welcome');
      if (welcomeElement) {
        welcomeElement.textContent = 'Welcome, ' + data.username;
      }
    }
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
    console.log('Current URL:', window.location.href);
    console.log('Is admin dashboard:', !!document.querySelector('.admin-dashboard'));
    
    // Get selected date range
    const dateRange = getSelectedDateRange();
    
    // Build query string with date parameters
    const queryParams = new URLSearchParams({
      startDate: document.getElementById('start-date').value,
      endDate: document.getElementById('end-date').value
    });
    
    console.log('Fetching stations with params:', queryParams.toString());
    
    const response = await fetch(`/api/stations?${queryParams}`, {
      credentials: 'include' // Include cookies for authentication
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Stations data:', result);
    console.log('Result success:', result.success);
    console.log('Result data length:', result.data ? result.data.length : 'no data');
    
    if (result.success && result.data) {
      displayStations(result.data);
    } else {
      console.error('Failed to fetch stations:', result);
      const stationList = document.getElementById('station-list');
      if (stationList) {
        stationList.innerHTML = '<p>Error loading stations: ' + (result.error || 'Unknown error') + '</p>';
      }
    }
  } catch (error) {
    console.error('Error fetching stations:', error);
    const stationList = document.getElementById('station-list');
    if (stationList) {
      stationList.innerHTML = '<p>Error loading stations: ' + error.message + '</p>';
    }
  }
}

function displayStations(stationsData) {
  console.log('displayStations called with:', stationsData);
  
  const stationList = document.getElementById('station-list');
  console.log('station-list element:', stationList);
  
  if (!stationList) {
    console.error('station-list element not found!');
    return;
  }
  
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
    console.log('No stations found, showing message');
    stationList.innerHTML = '<p>No stations assigned to your account. Please contact an administrator to get access to stations.</p>';
    return;
  }
  
  console.log('Processing stations:', stations);
  console.log('Number of stations:', stations.length);
  
  // Get username and userType from data attributes
  const container = document.querySelector('.container') || document.querySelector('.admin-dashboard');
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
    
    return `
      <div class="station-card">
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
          ${currentUserType === 'Distributor' || currentUserType === 'Admin' ? `
          <div class="pop-out-section">
            <button class="pop-out-btn" onclick="dispenseBattery('${stationId}')">Pop out</button>
          </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
  
  console.log('Generated station HTML length:', stationHTML.length);
  console.log('Setting innerHTML...');
  
  stationList.innerHTML = stationHTML;
  
  console.log('Station list innerHTML set, updating summary stats...');
  
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
  const container = document.querySelector('.container') || document.querySelector('.admin-dashboard');
  const currentUsername = container ? container.getAttribute('data-username') : null;
  const currentUserType = container ? container.getAttribute('data-usertype') : null;
  
  // Debug: Log current user info
  console.log('Current username:', currentUsername);
  console.log('Current userType:', currentUserType);
  console.log('UserType type:', typeof currentUserType);
  
  // Update the summary display based on user type
  const takeHomeElement = document.getElementById('take-home');
  const takeHomeLabel = document.querySelector('#take-home').parentElement.querySelector('.stat-label');
  
  if (currentUserType === 'Distributor' || currentUserType === 'Admin') {
    // For Distributor/Admin accounts, show total rents count instead of take-home amount
    takeHomeElement.textContent = totalRents;
    takeHomeLabel.textContent = 'Rents';
    console.log('Distributor/Admin user detected - showing total rents:', totalRents);
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

 