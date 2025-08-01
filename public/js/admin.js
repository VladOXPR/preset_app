window.onload = function() {
  loadUsers();

  document.getElementById('addUserBtn').addEventListener('click', function() {
    // Haptic feedback for navigation
    if (window.haptics) {
      haptics.navigation();
    }
    // Redirect to new user creation page
    window.location.href = '/newuser';
  });
};

function loadUsers() {
  fetch('/admin/users-full')
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
        const card = document.createElement('div');
        card.className = 'user-card';
        
        // Create user details in the specified format
        const userDetails = document.createElement('div');
        userDetails.className = 'user-card-details';
        userDetails.innerHTML = `
          <div><strong>Username:</strong> ${u.username}</div>
          <div><strong>Phonenumber:</strong> ${u.phone}</div>
        `;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete User';
        deleteBtn.className = 'primary user-card-btn delete-btn';
        deleteBtn.onclick = () => deleteUser(u.id);
        
        card.appendChild(userDetails);
        card.appendChild(document.createElement('br'));
        card.appendChild(deleteBtn);
        userList.appendChild(card);
      });
    });
}

function deleteUser(userId) {
  if (confirm(`Are you sure you want to delete this user?`)) {
    // Haptic feedback for delete action
    if (window.haptics) {
      haptics.heavy();
    }
    fetch('/admin/delete-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'userId=' + encodeURIComponent(userId)
    })
    .then(r => r.json())
    .then(res => {
      if (res.success) {
        // Success haptic feedback
        if (window.haptics) {
          haptics.success();
        }
        loadUsers(); // Reload the user list
      } else {
        // Error haptic feedback
        if (window.haptics) {
          haptics.error();
        }
        alert('Failed to delete user: ' + res.error);
      }
    })
    .catch(err => {
      console.error('Error deleting user:', err);
      alert('Error deleting user');
    });
  }
} 