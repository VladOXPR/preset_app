window.onload = function() {
  fetch('/me').then(r => {
    if (r.status !== 200) { window.location = '/login.html'; return; }
    return r.json();
  }).then(data => {
    if (!data) return;
    document.getElementById('welcome').textContent = 'Welcome, ' + data.username;
  });
  fetch('/users').then(r => {
    if (r.status !== 200) return;
    return r.json();
  }).then(users => {
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
      const chatBtn = document.createElement('a');
      chatBtn.textContent = 'Text me';
      chatBtn.href = `/chat?user=${encodeURIComponent(u.username)}`;
      chatBtn.className = 'primary user-card-btn';
      card.appendChild(name);
      card.appendChild(phone);
      card.appendChild(document.createElement('br'));
      card.appendChild(chatBtn);
      userList.appendChild(card);
    });
  });
}; 