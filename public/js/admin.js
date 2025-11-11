// ========================================
// CUUB DASHBOARD - ADMIN PANEL
// ========================================
// This file handles the admin panel functionality including:
// - User management and viewing
// - Admin interface controls

// ========================================
// CONFIGURATION
// ========================================

// ========================================
// INITIALIZATION
// ========================================

/**
 * Main initialization function that runs when the page loads
 * Since authentication is now handled server-side, we just load the admin content
 */
// Admin dashboard initialization - called after home.js loads
function initializeAdminDashboard() {
  // Check if this is an admin dashboard
  const isAdminDashboard = document.querySelector('.admin-dashboard');
  if (isAdminDashboard) {
    // For admin dashboard, only setup controls
    console.log('Admin dashboard detected - admin.js loaded');
    setupAdminControls();
  } else {
    // For standalone admin page, load everything
    loadStations();
    loadUsers();
    setupAdminControls();
  }
}

// Initialize admin dashboard after DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Small delay to ensure home.js has loaded first
  setTimeout(initializeAdminDashboard, 100);
});

// ========================================
// ADMIN CONTENT MANAGEMENT
// ========================================

/**
 * Logs out the admin user by clearing authentication cookies
 * Redirects to the admin password page
 */
function logout() {
  // Clear admin authentication cookie
  fetch('/api/logout-admin', {
    method: 'POST',
    credentials: 'include'
  })
  .then(() => {
    // Redirect to admin password page
    window.location.href = '/admin-password';
  })
  .catch(error => {
    console.error('Error during logout:', error);
    // Still redirect to admin password page even if logout request fails
    window.location.href = '/admin-password';
  });
}

/**
 * Sets up event listeners for admin panel controls
 * Handles the "Add User" button redirect and logout functionality
 */
function setupAdminControls() {
  document.getElementById('addUserBtn').addEventListener('click', function() {
    // Redirect to new user creation page
    window.location.href = '/newuser';
  });
  
  document.getElementById('addStationBtn').addEventListener('click', function() {
    // Show add station form
    showAddStationForm();
  });
  
  // Add logout button handler
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      // Clear admin authentication and redirect to login
      logout();
    });
  }
}

// ========================================
// USER DATA MANAGEMENT
// ========================================

/**
 * Fetches and displays all users in the admin panel
 * Makes API call to get user data and renders it in the user list
 */
function loadUsers() {
  // Get API configuration (handles both local and remote deployments)
  const apiUrl = window.API_CONFIG ? window.API_CONFIG.getApiUrl : (endpoint) => endpoint;
  
  // Fetch users from admin endpoint
  fetch(apiUrl('/admin/users-full'))
    .then(response => {
      if (response.status !== 200) {
        console.error('Failed to load users - HTTP status:', response.status);
        return;
      }
      return response.json();
    })
    .then(users => {
      if (!users) return;
      
      console.log('Admin users data received:', users);
      renderUserList(users);
    })
    .catch(error => {
      console.error('Error loading users:', error);
    });
}

/**
 * Renders the user list in the admin panel
 * Creates HTML elements for each user with their details
 * 
 * @param {Array} users - Array of user objects from the API
 */
function renderUserList(users) {
  const userList = document.getElementById('user-list');
  userList.innerHTML = ''; // Clear existing content
  
  users.forEach(user => {
    const userItem = createUserItem(user);
    userList.appendChild(userItem);
  });
}

/**
 * Creates a single user item element for display
 * Shows username, phone, user type, and station management interface
 * 
 * @param {Object} user - User object with user data
 * @returns {HTMLElement} - DOM element for the user item
 */
function createUserItem(user) {
  const userItem = document.createElement('div');
  userItem.className = 'admin-user-item';
  userItem.setAttribute('data-user-id', user.id);
  
  // Create user details section
  const userDetails = document.createElement('div');
  userDetails.className = 'admin-user-details';
  userDetails.innerHTML = `
    <div><strong>Username:</strong> ${user.username}</div>
    <div><strong>Phone:</strong> ${user.phone}</div>
    <div><strong>User Type:</strong> ${user.userType || 'Unknown'}</div>
  `;
  
  // Create station management section
  const stationSection = createStationManagementSection(user);
  
  // Create action buttons
  const actionButtons = document.createElement('div');
  actionButtons.className = 'admin-user-actions';
  actionButtons.innerHTML = `
    <button class="btn-delete-user" onclick="deleteUser(${user.id})">Delete User</button>
  `;
  
  userItem.appendChild(userDetails);
  userItem.appendChild(stationSection);
  userItem.appendChild(actionButtons);
  
  return userItem;
}

/**
 * Creates the station management section for a user
 * Shows station ID and title inputs with add/remove functionality
 * 
 * @param {Object} user - User object with station data
 * @returns {HTMLElement} - DOM element for station management
 */
function createStationManagementSection(user) {
  const stationSection = document.createElement('div');
  stationSection.className = 'station-management-section';
  
  // Create header
  const header = document.createElement('div');
  header.className = 'station-header';
  header.innerHTML = `
    <div class="station-columns">
      <div class="station-column">Station</div>
      <div class="station-column">Title</div>
    </div>
  `;
  
  // Create stations container
  const stationsContainer = document.createElement('div');
  stationsContainer.className = 'stations-container';
  stationsContainer.setAttribute('data-user-id', user.id);
  
  // Add existing stations
  if (user.station_ids && typeof user.station_ids === 'object') {
    Object.entries(user.station_ids).forEach(([stationId, title]) => {
      const stationRow = createStationRow(user.id, stationId, title);
      stationsContainer.appendChild(stationRow);
    });
  }
  
  // Add station button
  const addButton = document.createElement('div');
  addButton.className = 'add-station-btn';
  addButton.innerHTML = '<span>+ Add station</span>';
  addButton.onclick = () => addNewStationRow(user.id);
  
  stationSection.appendChild(header);
  stationSection.appendChild(stationsContainer);
  stationSection.appendChild(addButton);
  
  return stationSection;
}

/**
 * Creates a single station row with ID and title inputs
 * 
 * @param {number} userId - User ID
 * @param {string} stationId - Station ID (empty for new stations)
 * @param {string} title - Station title (empty for new stations)
 * @returns {HTMLElement} - DOM element for station row
 */
function createStationRow(userId, stationId = '', title = '') {
  const stationRow = document.createElement('div');
  stationRow.className = 'station-row';
  
  stationRow.innerHTML = `
    <div class="station-input-group">
      <input type="text" class="station-id-input" placeholder="Station ID" value="${stationId}">
      <span class="station-separator">-</span>
      <input type="text" class="station-title-input" placeholder="Station Title" value="${title}">
      <button class="btn-remove-station" onclick="removeStationRow(this)">×</button>
    </div>
  `;
  
  // Add event listeners for auto-save
  const stationIdInput = stationRow.querySelector('.station-id-input');
  const titleInput = stationRow.querySelector('.station-title-input');
  
  stationIdInput.addEventListener('blur', () => saveUserStations(userId));
  titleInput.addEventListener('blur', () => saveUserStations(userId));
  
  return stationRow;
}

/**
 * Adds a new empty station row for a user
 * 
 * @param {number} userId - User ID
 */
function addNewStationRow(userId) {
  const stationsContainer = document.querySelector(`[data-user-id="${userId}"] .stations-container`);
  const newStationRow = createStationRow(userId);
  stationsContainer.appendChild(newStationRow);
  
  // Focus on the station ID input
  const stationIdInput = newStationRow.querySelector('.station-id-input');
  stationIdInput.focus();
}

/**
 * Removes a station row from the UI
 * 
 * @param {HTMLElement} button - The remove button that was clicked
 */
function removeStationRow(button) {
  const stationRow = button.closest('.station-row');
  stationRow.remove();
  
  // Auto-save after removal
  const userId = stationRow.closest('.station-management-section').querySelector('.stations-container').getAttribute('data-user-id');
  saveUserStations(userId);
}

/**
 * Saves the current station configuration for a user
 * 
 * @param {number} userId - User ID
 */
function saveUserStations(userId) {
  const stationsContainer = document.querySelector(`[data-user-id="${userId}"] .stations-container`);
  const stationRows = stationsContainer.querySelectorAll('.station-row');
  
  const stationIds = {};
  
  stationRows.forEach(row => {
    const stationId = row.querySelector('.station-id-input').value.trim();
    const title = row.querySelector('.station-title-input').value.trim();
    
    if (stationId) {
      stationIds[stationId] = title || stationId; // Use station ID as title if title is empty
    }
  });
  
  // Send update to server
  updateUserStations(userId, stationIds);
}

/**
 * Updates user stations on the server
 * 
 * @param {number} userId - User ID
 * @param {Object} stationIds - Dictionary of station IDs and titles
 */
function updateUserStations(userId, stationIds) {
  const apiUrl = window.API_CONFIG ? window.API_CONFIG.getApiUrl : (endpoint) => endpoint;
  
  fetch(apiUrl('/admin/update-user-stations'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: userId,
      stationIds: stationIds
    })
  })
  .then(response => response.json())
  .then(result => {
    if (result.success) {
      console.log('Stations updated successfully for user:', userId);
    } else {
      console.error('Failed to update stations:', result.error);
    }
  })
  .catch(error => {
    console.error('Error updating stations:', error);
  });
}

/**
 * Deletes a user from the system
 * 
 * @param {number} userId - User ID
 */
function deleteUser(userId) {
  if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
    const apiUrl = window.API_CONFIG ? window.API_CONFIG.getApiUrl : (endpoint) => endpoint;
    
    fetch(apiUrl('/admin/delete-user'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId
      })
    })
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        console.log('User deleted successfully:', userId);
        // Reload the user list
        loadUsers();
      } else {
        console.error('Failed to delete user:', result.error);
        alert('Failed to delete user: ' + result.error);
      }
    })
    .catch(error => {
      console.error('Error deleting user:', error);
      alert('Error deleting user: ' + error.message);
    });
  }
}

// ========================================
// STATION MANAGEMENT
// ========================================

/**
 * Loads all stations from the API and displays them
 */
function loadStations() {
  const apiUrl = window.API_CONFIG ? window.API_CONFIG.getApiUrl : (endpoint) => endpoint;
  
  fetch(apiUrl('/api/admin/stations'))
    .then(response => {
      if (response.status !== 200) {
        console.error('Failed to load stations - HTTP status:', response.status);
        return [];
      }
      return response.json();
    })
    .then(stations => {
      console.log('Stations data received:', stations);
      renderStationList(stations);
    })
    .catch(error => {
      console.error('Error loading stations:', error);
      renderStationList([]);
    });
}

/**
 * Renders the station list in the admin panel
 * 
 * @param {Array} stations - Array of station objects
 */
function renderStationList(stations) {
  const stationList = document.getElementById('station-list-admin');
  stationList.innerHTML = '';
  
  if (stations.length === 0) {
    stationList.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">No stations found. Add your first station below.</p>';
    return;
  }
  
  stations.forEach(station => {
    const stationItem = createStationItem(station);
    stationList.appendChild(stationItem);
  });
}

/**
 * Creates a station item element
 * 
 * @param {Object} station - Station object
 * @returns {HTMLElement} - DOM element for the station item
 */
function createStationItem(station) {
  const stationItem = document.createElement('div');
  stationItem.className = 'station-item-admin';
  stationItem.setAttribute('data-station-id', station.id);
  
  stationItem.innerHTML = `
    <div class="station-info-display">
      <div class="station-info-row">
        <span class="station-info-label">Station ID:</span>
        <span class="station-info-value">${station.id}</span>
      </div>
      <div class="station-info-row">
        <span class="station-info-label">Name:</span>
        <span class="station-info-value">${station.name}</span>
      </div>
      <div class="station-info-row">
        <span class="station-info-label">Address:</span>
        <span class="station-info-value">${station.address}</span>
      </div>
      <div class="station-info-row">
        <span class="station-info-label">Coordinates:</span>
        <span class="station-info-value">[${station.coordinates[0]}, ${station.coordinates[1]}]</span>
      </div>
    </div>
    <div class="station-actions">
      <button class="station-btn station-btn-edit" onclick="editStation('${station.id}')">Edit Station</button>
      <button class="station-btn station-btn-delete" onclick="deleteStation('${station.id}')">Delete Station</button>
    </div>
  `;
  
  return stationItem;
}

/**
 * Shows the add station form
 */
function showAddStationForm() {
  const stationList = document.getElementById('station-list-admin');
  
  // Check if form already exists
  if (document.querySelector('.add-station-form')) {
    return;
  }
  
  const formContainer = document.createElement('div');
  formContainer.className = 'add-station-form active';
  formContainer.innerHTML = `
    <h3 class="section-title">Add New Station</h3>
    <div class="station-field-group">
      <label class="station-field-label">Station ID *</label>
      <input type="text" class="station-field-input" id="new-station-id" placeholder="e.g., DTN00873" required>
    </div>
    <div class="station-field-group">
      <label class="station-field-label">Station Name *</label>
      <input type="text" class="station-field-input" id="new-station-name" placeholder="e.g., DePaul University" required>
    </div>
    <div class="station-field-group">
      <label class="station-field-label">Address *</label>
      <input type="text" class="station-field-input" id="new-station-address" placeholder="e.g., 123 Main St, Chicago, IL 60614" required>
    </div>
    <div class="station-coordinates-group">
      <div class="station-field-group">
        <label class="station-field-label">Longitude *</label>
        <input type="number" step="any" class="station-field-input" id="new-station-lng" placeholder="e.g., -87.6500" required>
      </div>
      <div class="station-field-group">
        <label class="station-field-label">Latitude *</label>
        <input type="number" step="any" class="station-field-input" id="new-station-lat" placeholder="e.g., 41.9000" required>
      </div>
    </div>
    <div class="station-actions">
      <button class="station-btn station-btn-save" onclick="saveNewStation()">Add Station</button>
      <button class="station-btn station-btn-cancel" onclick="cancelAddStation()">Cancel</button>
    </div>
  `;
  
  stationList.insertBefore(formContainer, stationList.firstChild);
  document.getElementById('new-station-id').focus();
}

/**
 * Saves a new station
 */
function saveNewStation() {
  const id = document.getElementById('new-station-id').value.trim();
  const name = document.getElementById('new-station-name').value.trim();
  const address = document.getElementById('new-station-address').value.trim();
  const lng = parseFloat(document.getElementById('new-station-lng').value);
  const lat = parseFloat(document.getElementById('new-station-lat').value);
  
  // Validation
  if (!id || !name || !address || isNaN(lng) || isNaN(lat)) {
    alert('Please fill in all required fields with valid values.');
    return;
  }
  
  const stationData = {
    id: id,
    name: name,
    address: address,
    coordinates: [lng, lat]
  };
  
  const apiUrl = window.API_CONFIG ? window.API_CONFIG.getApiUrl : (endpoint) => endpoint;
  
  fetch(apiUrl('/api/admin/stations'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(stationData)
  })
  .then(response => response.json())
  .then(result => {
    if (result.error) {
      alert('Error: ' + result.error);
    } else {
      console.log('Station added successfully:', result);
      cancelAddStation();
      loadStations();
    }
  })
  .catch(error => {
    console.error('Error adding station:', error);
    alert('Error adding station: ' + error.message);
  });
}

/**
 * Cancels adding a new station
 */
function cancelAddStation() {
  const form = document.querySelector('.add-station-form');
  if (form) {
    form.remove();
  }
}

/**
 * Edits a station
 * 
 * @param {string} stationId - Station ID
 */
function editStation(stationId) {
  const apiUrl = window.API_CONFIG ? window.API_CONFIG.getApiUrl : (endpoint) => endpoint;
  
  // Fetch the station data first
  fetch(apiUrl('/api/admin/stations'))
    .then(response => response.json())
    .then(stations => {
      const station = stations.find(s => s.id === stationId);
      if (!station) {
        alert('Station not found');
        return;
      }
      
      showEditStationForm(station);
    })
    .catch(error => {
      console.error('Error loading station:', error);
      alert('Error loading station: ' + error.message);
    });
}

/**
 * Shows the edit station form
 * 
 * @param {Object} station - Station object
 */
function showEditStationForm(station) {
  const stationItem = document.querySelector(`[data-station-id="${station.id}"]`);
  stationItem.classList.add('editing');
  
  stationItem.innerHTML = `
    <div class="station-field-group">
      <label class="station-field-label">Station ID</label>
      <input type="text" class="station-field-input readonly" value="${station.id}" disabled>
    </div>
    <div class="station-field-group">
      <label class="station-field-label">Station Name *</label>
      <input type="text" class="station-field-input" id="edit-station-name-${station.id}" value="${station.name}" required>
    </div>
    <div class="station-field-group">
      <label class="station-field-label">Address *</label>
      <input type="text" class="station-field-input" id="edit-station-address-${station.id}" value="${station.address}" required>
    </div>
    <div class="station-coordinates-group">
      <div class="station-field-group">
        <label class="station-field-label">Longitude *</label>
        <input type="number" step="any" class="station-field-input" id="edit-station-lng-${station.id}" value="${station.coordinates[0]}" required>
      </div>
      <div class="station-field-group">
        <label class="station-field-label">Latitude *</label>
        <input type="number" step="any" class="station-field-input" id="edit-station-lat-${station.id}" value="${station.coordinates[1]}" required>
      </div>
    </div>
    <div class="station-actions">
      <button class="station-btn station-btn-save" onclick="saveEditedStation('${station.id}')">Save Changes</button>
      <button class="station-btn station-btn-cancel" onclick="cancelEditStation('${station.id}')">Cancel</button>
    </div>
  `;
}

/**
 * Saves an edited station
 * 
 * @param {string} stationId - Station ID
 */
function saveEditedStation(stationId) {
  const name = document.getElementById(`edit-station-name-${stationId}`).value.trim();
  const address = document.getElementById(`edit-station-address-${stationId}`).value.trim();
  const lng = parseFloat(document.getElementById(`edit-station-lng-${stationId}`).value);
  const lat = parseFloat(document.getElementById(`edit-station-lat-${stationId}`).value);
  
  // Validation
  if (!name || !address || isNaN(lng) || isNaN(lat)) {
    alert('Please fill in all required fields with valid values.');
    return;
  }
  
  const stationData = {
    name: name,
    address: address,
    coordinates: [lng, lat]
  };
  
  const apiUrl = window.API_CONFIG ? window.API_CONFIG.getApiUrl : (endpoint) => endpoint;
  
  fetch(apiUrl(`/api/admin/stations/${stationId}`), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(stationData)
  })
  .then(response => response.json())
  .then(result => {
    if (result.error) {
      alert('Error: ' + result.error);
    } else {
      console.log('Station updated successfully:', result);
      loadStations();
    }
  })
  .catch(error => {
    console.error('Error updating station:', error);
    alert('Error updating station: ' + error.message);
  });
}

/**
 * Cancels editing a station
 * 
 * @param {string} stationId - Station ID
 */
function cancelEditStation(stationId) {
  loadStations();
}

/**
 * Deletes a station
 * 
 * @param {string} stationId - Station ID
 */
function deleteStation(stationId) {
  if (!confirm(`Are you sure you want to delete station ${stationId}? This action cannot be undone.`)) {
    return;
  }
  
  const apiUrl = window.API_CONFIG ? window.API_CONFIG.getApiUrl : (endpoint) => endpoint;
  
  fetch(apiUrl(`/api/admin/stations/${stationId}`), {
    method: 'DELETE'
  })
  .then(response => response.json())
  .then(result => {
    if (result.error) {
      alert('Error: ' + result.error);
    } else {
      console.log('Station deleted successfully:', result);
      loadStations();
    }
  })
  .catch(error => {
    console.error('Error deleting station:', error);
    alert('Error deleting station: ' + error.message);
  });
} 