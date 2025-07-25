window.onload = function() {
  const params = new URLSearchParams(window.location.search);
  const user = params.get('user');
  if (!user) {
    document.getElementById('chatArea').innerHTML = '<div class="chat-message center">No user selected.</div>';
    return;
  }
  const chatArea = document.getElementById('chatArea');
  const input = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');

  function render(messages, myUsername) {
    chatArea.innerHTML = '';
    messages.forEach(m => {
      const div = document.createElement('div');
      div.className = 'chat-message ' + (m.from === myUsername ? 'right' : 'left');
      div.textContent = m.text;
      chatArea.appendChild(div);
    });
    chatArea.scrollTop = chatArea.scrollHeight;
  }

  let myUsername = null;
  fetch('/me').then(r => r.json()).then(me => {
    myUsername = me.username;
    loadHistory();
  });

  function loadHistory() {
    fetch('/chat/history?user=' + encodeURIComponent(user))
      .then(r => r.json())
      .then(messages => {
        render(messages, myUsername);
      });
  }

  function sendMessage() {
    if (!input.value.trim()) return;
    fetch('/chat/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'to=' + encodeURIComponent(user) + '&text=' + encodeURIComponent(input.value.trim())
    })
    .then(r => r.json())
    .then(res => {
      if (res.success) {
        input.value = '';
        loadHistory();
      }
    });
  }

  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  });
  sendBtn.addEventListener('click', sendMessage);

  // Poll for new messages every 2 seconds
  setInterval(loadHistory, 2000);
}; 