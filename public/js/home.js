window.onload = function() {
  // Use the remote API URL from config
  const apiUrl = window.API_CONFIG ? window.API_CONFIG.getApiUrl : (endpoint) => endpoint;
  
  fetch(apiUrl('/me')).then(r => {
    if (r.status !== 200) { window.location = '/login'; return; }
    return r.json();
  }).then(data => {
    if (!data) return;
    document.getElementById('welcome').textContent = 'Welcome, ' + data.username;
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
};

function initializeDateInputs() {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 1);
  
  document.getElementById('start-date').value = startDate.toISOString().split('T')[0];
  document.getElementById('end-date').value = endDate.toISOString().split('T')[0];
}

function getSelectedDateRange() {
  const startDate = document.getElementById('start-date').value;
  const endDate = document.getElementById('end-date').value;
  
  if (!startDate || !endDate) {
    // Fallback to last month if dates not selected
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 1);
    
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
    
    const response = await fetch(`/api/stations?${queryParams}`);
    
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
  
  // Create the station list
  const stationHTML = stations.map((station, index) => {
    const stationId = station.pCabinetid || station.id || `Station ${index + 1}`;
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
            <p class="station-id">${stationId}</p>
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
            <div class="revenue-amount">$${totalRevenue.toFixed(2)}</div>
            <div class="revenue-label">Revenue</div>
          </div>
          <div class="rents-section">
            <div class="rents-number">${totalRents}</div>
            <div class="rents-label">Rents</div>
          </div>
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
  
  // Update the summary display
  document.getElementById('total-revenue').textContent = `$${totalRevenue.toFixed(2)}`;
  document.getElementById('total-rents').textContent = totalRents;
}

 