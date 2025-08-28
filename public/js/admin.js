// Admin password - you can change this to whatever you want
const ADMIN_PASSWORD = 'admin123';

window.onload = function() {
  // Check if already authenticated
  if (localStorage.getItem('adminAuthenticated') === 'true') {
    showAdminContent();
  } else {
    showPasswordScreen();
  }
};

function showPasswordScreen() {
  document.getElementById('password-screen').style.display = 'flex';
  document.getElementById('admin-content').style.display = 'none';
  
  // Add event listeners for password submission
  document.getElementById('submit-password').addEventListener('click', checkPassword);
  document.getElementById('admin-password').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      checkPassword();
    }
  });
}

function showAdminContent() {
  document.getElementById('password-screen').style.display = 'none';
  document.getElementById('admin-content').style.display = 'block';
  
  // Load admin content
  loadUsers();
  
  // Add event listeners for admin functionality
  document.getElementById('addUserBtn').addEventListener('click', function() {
    // Redirect to new user creation page
    window.location.href = '/newuser';
  });
}

function checkPassword() {
  const password = document.getElementById('admin-password').value;
  const errorElement = document.getElementById('password-error');
  
  if (password === ADMIN_PASSWORD) {
    // Correct password - store authentication and show admin content
    localStorage.setItem('adminAuthenticated', 'true');
    showAdminContent();
  } else {
    // Wrong password - show error
    errorElement.style.display = 'block';
    document.getElementById('admin-password').value = '';
    document.getElementById('admin-password').focus();
  }
}

function loadUsers() {
  // Use the remote API URL from config
  const apiUrl = window.API_CONFIG ? window.API_CONFIG.getApiUrl : (endpoint) => endpoint;
  
  fetch(apiUrl('/admin/users-full'))
    .then(r => {
      if (r.status !== 200) {
        console.error('Failed to load users');
        return;
      }
      return r.json();
    })
    .then(users => {
      if (!users) return;
      console.log('Admin users data received:', users);
      const userList = document.getElementById('user-list');
      userList.innerHTML = '';
      users.forEach(u => {
        const userItem = document.createElement('div');
        userItem.className = 'admin-user-item';
        
        // Create user details
        const userDetails = document.createElement('div');
        userDetails.className = 'admin-user-details';
        userDetails.innerHTML = `
          <div><strong>Username:</strong> ${u.username}</div>
          <div><strong>Phonenumber:</strong> ${u.phone}</div>
          <div><strong>Station IDs:</strong> ${u.station_ids && u.station_ids.length > 0 ? u.station_ids.join(', ') : 'None assigned'}</div>
        `;
        
        // Create station management section
        const stationManagement = document.createElement('div');
        stationManagement.className = 'station-management';
        stationManagement.innerHTML = `
          <input type="text" id="station-input-${u.id}" placeholder="Enter station IDs (comma-separated)" 
                 value="${u.station_ids ? u.station_ids.join(', ') : ''}" class="station-input">
          <button onclick="updateUserStations(${u.id})" class="secondary">Update Stations</button>
        `;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete User';
        deleteBtn.className = 'primary admin-delete-btn';
        deleteBtn.onclick = () => deleteUser(u.id);
        
        userItem.appendChild(userDetails);
        userItem.appendChild(document.createElement('br'));
        userItem.appendChild(stationManagement);
        userItem.appendChild(document.createElement('br'));
        userItem.appendChild(deleteBtn);
        userList.appendChild(userItem);
      });
    });
}

function updateUserStations(userId) {
  // Use the remote API URL from config
  const apiUrl = window.API_CONFIG ? window.API_CONFIG.getApiUrl : (endpoint) => endpoint;
  
  const stationInput = document.getElementById(`station-input-${userId}`);
  const stationIds = stationInput.value;
  
  if (!stationIds.trim()) {
    alert('Please enter station IDs');
    return;
  }
  
  fetch(apiUrl('/admin/update-user-stations'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, stationIds })
  })
  .then(r => r.json())
  .then(res => {
    if (res.success) {
      alert('User stations updated successfully!');
      loadUsers(); // Reload the user list
    } else {
      alert('Failed to update user stations: ' + res.error);
    }
  })
  .catch(err => {
    console.error('Error updating user stations:', err);
    alert('Error updating user stations');
  });
}

function deleteUser(userId) {
  // Use the remote API URL from config
  const apiUrl = window.API_CONFIG ? window.API_CONFIG.getApiUrl : (endpoint) => endpoint;
  
  if (confirm(`Are you sure you want to delete this user?`)) {
    fetch(apiUrl('/admin/delete-user'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'userId=' + encodeURIComponent(userId)
    })
    .then(r => r.json())
    .then(res => {
      if (res.success) {
        loadUsers(); // Reload the user list
      } else {
        alert('Failed to delete user: ' + res.error);
      }
    })
    .catch(err => {
      console.error('Error deleting user:', err);
      alert('Error deleting user');
    });
  }
} 