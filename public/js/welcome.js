window.onload = function() {
  fetch('/me').then(r => {
    if (r.status !== 200) { window.location = '/login'; return; }
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
    console.log('Users data received:', users);
    const userList = document.getElementById('user-list');
    userList.innerHTML = '';
    
    // Process users and check for messages
    users.forEach(u => {
      const card = document.createElement('div');
      card.className = 'user-card';
      
      const name = document.createElement('div');
      name.className = 'user-card-name';
      name.textContent = u.username;
      
      // Create message indicator container
      const messageIndicator = document.createElement('div');
      messageIndicator.className = 'message-indicator';
      
      // Create circle
      const circle = document.createElement('div');
      circle.className = 'message-circle';
      
      // Create text
      const text = document.createElement('span');
      text.className = 'message-text';
      
      // Check for messages from this user
      fetch(`/messages/unread?from=${encodeURIComponent(u.username)}`).then(r => {
        if (r.status !== 200) return;
        return r.json();
      }).then(data => {
        if (data && data.hasMessages) {
          circle.style.backgroundColor = '#B0D2FF';
          text.textContent = 'New message';
        } else {
          circle.style.backgroundColor = '#D9D9D9';
          text.textContent = 'No message';
        }
      }).catch(error => {
        console.error('Error checking messages:', error);
        circle.style.backgroundColor = '#D9D9D9';
        text.textContent = 'No message';
      });
      
      messageIndicator.appendChild(circle);
      messageIndicator.appendChild(text);
      
      const chatBtn = document.createElement('a');
      chatBtn.textContent = 'Text me';
      chatBtn.href = `/chat?user=${encodeURIComponent(u.username)}`;
      chatBtn.className = 'primary user-card-btn';
      
      card.appendChild(name);
      card.appendChild(messageIndicator);
      card.appendChild(document.createElement('br'));
      card.appendChild(chatBtn);
      userList.appendChild(card);
    });
  });
}; 