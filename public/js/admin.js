// ========================================
// CUUB DASHBOARD - ADMIN PANEL
// ========================================
// This file handles the admin panel functionality including:
// - Password-based authentication
// - User management and viewing
// - Admin interface controls

// ========================================
// CONFIGURATION
// ========================================

// Admin password - you can change this to whatever you want
const ADMIN_PASSWORD = 'admin123';

// ========================================
// INITIALIZATION
// ========================================

/**
 * Main initialization function that runs when the page loads
 * Checks if admin is already authenticated and shows appropriate content
 */
window.onload = function() {
  // Check if already authenticated from previous session
  if (localStorage.getItem('adminAuthenticated') === 'true') {
    showAdminContent();
  } else {
    showPasswordScreen();
  }
};

// ========================================
// AUTHENTICATION FUNCTIONS
// ========================================

/**
 * Displays the password entry screen and hides admin content
 * Sets up event listeners for password submission
 */
function showPasswordScreen() {
  // Show password screen, hide admin content
  document.getElementById('password-screen').style.display = 'flex';
  document.getElementById('admin-content').style.display = 'none';
  
  // Add event listeners for password submission
  document.getElementById('submit-password').addEventListener('click', checkPassword);
  
  // Allow Enter key to submit password
  document.getElementById('admin-password').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      checkPassword();
    }
  });
}

/**
 * Validates the entered admin password
 * If correct: stores authentication and shows admin panel
 * If incorrect: shows error message and clears input
 */
function checkPassword() {
  const password = document.getElementById('admin-password').value;
  const errorElement = document.getElementById('password-error');
  
  if (password === ADMIN_PASSWORD) {
    // Correct password - authenticate and show admin content
    localStorage.setItem('adminAuthenticated', 'true');
    showAdminContent();
  } else {
    // Wrong password - show error and reset input
    errorElement.style.display = 'block';
    document.getElementById('admin-password').value = '';
    document.getElementById('admin-password').focus();
  }
}

// ========================================
// ADMIN CONTENT MANAGEMENT
// ========================================

/**
 * Displays the main admin panel content
 * Hides password screen, loads user data, and sets up admin controls
 */
function showAdminContent() {
  // Hide password screen, show admin content
  document.getElementById('password-screen').style.display = 'none';
  document.getElementById('admin-content').style.display = 'block';
  
  // Load and display user data
  loadUsers();
  
  // Set up admin functionality buttons
  setupAdminControls();
}

/**
 * Sets up event listeners for admin panel controls
 * Currently handles the "Add User" button redirect
 */
function setupAdminControls() {
  document.getElementById('addUserBtn').addEventListener('click', function() {
    // Redirect to new user creation page
    window.location.href = '/newuser';
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
 * Shows username, phone, user type, and assigned stations
 * 
 * @param {Object} user - User object with user data
 * @returns {HTMLElement} - DOM element for the user item
 */
function createUserItem(user) {
  const userItem = document.createElement('div');
  userItem.className = 'admin-user-item';
  
  // Create user details section
  const userDetails = document.createElement('div');
  userDetails.className = 'admin-user-details';
  userDetails.innerHTML = `
    <div><strong>Username:</strong> ${user.username}</div>
    <div><strong>Phone:</strong> ${user.phone}</div>
    <div><strong>User Type:</strong> ${user.userType || 'Unknown'}</div>
    <div><strong>Station IDs:</strong> ${formatStationIds(user.station_ids)}</div>
  `;
  
  userItem.appendChild(userDetails);
  return userItem;
}

/**
 * Formats station IDs for display
 * Joins multiple station IDs with commas or shows "None assigned" if empty
 * 
 * @param {Array} stationIds - Array of station ID strings
 * @returns {string} - Formatted station IDs string
 */
function formatStationIds(stationIds) {
  if (stationIds && stationIds.length > 0) {
    return stationIds.join(', ');
  }
  return 'None assigned';
} 