window.onload = function() {
  loadUsers();

  document.getElementById('addUserBtn').addEventListener('click', function() {
    // Redirect to new user creation page
    window.location.href = '/newuser';
  });
};

function loadUsers() {
  fetch('/admin/users')
    .then(r => {
      if (r.status !== 200) {
        console.error('Failed to load users');
        return;
      }
      return r.json();
    })
    .then(users => {
      if (!users) return;
      const userList = document.getElementById('user-list');
      userList.innerHTML = '';
      users.forEach(u => {
        const card = document.createElement('div');
        card.className = 'user-card';
        const name = document.createElement('div');
        name.className = 'user-card-name';
        name.textContent = u.username;
        const phone = document.createElement('div');
        phone.className = 'user-card-phone';
        phone.textContent = u.phone;
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete User';
        deleteBtn.className = 'primary user-card-btn delete-btn';
        deleteBtn.onclick = () => deleteUser(u.username);
        card.appendChild(name);
        card.appendChild(phone);
        card.appendChild(document.createElement('br'));
        card.appendChild(deleteBtn);
        userList.appendChild(card);
      });
    });
}

function deleteUser(username) {
  if (confirm(`Are you sure you want to delete user "${username}"?`)) {
    fetch('/admin/delete-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'username=' + encodeURIComponent(username)
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