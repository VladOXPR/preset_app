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
window.onload = function() {
  // Load and display users
  loadUsers();
  
  // Set up event listeners for admin functions
  setupAdminControls();
};

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
  
  document.getElementById('logoutBtn').addEventListener('click', function() {
    // Clear admin authentication and redirect to login
    logout();
  });
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