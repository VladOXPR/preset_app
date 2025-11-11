// API Test Configuration
const API_URL = 'https://backend.energo.vip/api/cabinet?sort=isOnline,asc&sort=id,desc&page=0&size=10&leaseFilter=false&posFilter=false&AdsFilter=false';
const DEFAULT_AUTH_TOKEN = 'Bearer eyJhbGciOiJIUzUxMiJ9.eyJqdGkiOiJkNDVhMjkzNWY3M2Y0ZjQ1OWU4MzdjM2E1YzBmOTgyMCIsInVzZXIiOiJjdWJVU0EyMDI1IiwiaXNBcGlUb2tlbiI6ZmFsc2UsInN1YiI6ImN1YlVTQTIwMjUiLCJBUElLRVkiOiJidXpOTEQyMDI0IiwiZXhwIjoxNzY1NDc5MDI1fQ.e8cSdnd-EQQZbkNf-qZCMn_0dBk1x8R9vYSkQNVObvp_f6PHcndXJTI5YBddl8WzUFAiMHLfM17zZV5ppmZ7Pw';

// Current token (can be updated by user)
let currentAuthToken = DEFAULT_AUTH_TOKEN;

// Test state
let testInterval = null;
let testStartTime = null;
let uptimeInterval = null;

let stats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  lastSuccessTime: null,
  firstFailureTime: null
};

let requestLog = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadToken();
  loadState();
  updateUI();
});

// Start test
function startTest() {
  const intervalSeconds = parseInt(document.getElementById('interval').value);
  if (intervalSeconds < 1 || intervalSeconds > 300) {
    alert('Interval must be between 1 and 300 seconds');
    return;
  }

  testStartTime = Date.now();
  document.getElementById('start-btn').disabled = true;
  document.getElementById('stop-btn').disabled = false;
  document.getElementById('interval').disabled = true;

  updateStatus('testing', 'Testing in progress...');

  // Run first test immediately
  runTest();

  // Schedule periodic tests
  testInterval = setInterval(runTest, intervalSeconds * 1000);

  // Update uptime every second
  uptimeInterval = setInterval(updateUptime, 1000);

  saveState();
}

// Stop test
function stopTest() {
  if (testInterval) {
    clearInterval(testInterval);
    testInterval = null;
  }
  if (uptimeInterval) {
    clearInterval(uptimeInterval);
    uptimeInterval = null;
  }

  document.getElementById('start-btn').disabled = false;
  document.getElementById('stop-btn').disabled = true;
  document.getElementById('interval').disabled = false;

  updateStatus('testing', 'Test stopped. Click Start to resume.');
  saveState();
}

// Reset test
function resetTest() {
  stopTest();
  
  stats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    lastSuccessTime: null,
    firstFailureTime: null
  };
  
  requestLog = [];
  testStartTime = null;

  updateUI();
  updateStatus('testing', 'Ready to start testing');
  document.getElementById('log-entries').innerHTML = '';
  
  saveState();
}

// Run API test
async function runTest() {
  stats.totalRequests++;
  const timestamp = new Date();

  try {
    const urlWithTimestamp = `${API_URL}&_t=${Date.now()}`;
    
    const response = await fetch(urlWithTimestamp, {
      method: 'GET',
      headers: {
        'Authorization': currentAuthToken,
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'language': 'en-US',
        'oid': '3526',
        'Referer': 'https://backend.energo.vip/device/list',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:144.0) Gecko/20100101 Firefox/144.0'
      }
    });

    if (response.ok) {
      const data = await response.json();
      
      // Validate response structure
      if (data && data.content && Array.isArray(data.content)) {
        stats.successfulRequests++;
        stats.lastSuccessTime = timestamp;
        
        addLogEntry(true, timestamp, `✅ Success - ${data.totalElements} stations`);
        updateStatus('success', `✅ Token is valid - ${stats.successfulRequests} successful requests`);
      } else {
        handleFailure(timestamp, 'Unexpected response structure');
      }
    } else {
      handleFailure(timestamp, `HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    handleFailure(timestamp, `Error: ${error.message}`);
  }

  updateUI();
  saveState();
}

// Handle request failure
function handleFailure(timestamp, message) {
  stats.failedRequests++;
  
  if (!stats.firstFailureTime) {
    stats.firstFailureTime = timestamp;
  }

  addLogEntry(false, timestamp, `❌ ${message}`);
  updateStatus('failure', `🔒 TOKEN EXPIRED OR UNAUTHORIZED - Check logs`);
}

// Add log entry
function addLogEntry(success, timestamp, message) {
  const entry = {
    success,
    timestamp,
    message
  };

  requestLog.unshift(entry); // Add to beginning
  if (requestLog.length > 20) {
    requestLog = requestLog.slice(0, 20); // Keep only last 20
  }

  const logContainer = document.getElementById('log-entries');
  const logEntry = document.createElement('div');
  logEntry.className = `log-entry ${success ? 'success' : 'failure'}`;
  
  const timeStr = timestamp.toLocaleTimeString();
  logEntry.innerHTML = `
    <span class="log-icon">${success ? '✅' : '❌'}</span>
    <span class="log-time">${timeStr}</span>
    <span>${message}</span>
  `;

  logContainer.insertBefore(logEntry, logContainer.firstChild);

  // Remove old entries from DOM if more than 20
  while (logContainer.children.length > 20) {
    logContainer.removeChild(logContainer.lastChild);
  }
}

// Update UI
function updateUI() {
  document.getElementById('total-requests').textContent = stats.totalRequests;
  document.getElementById('successful-requests').textContent = stats.successfulRequests;
  document.getElementById('failed-requests').textContent = stats.failedRequests;
  
  updateUptime();
}

// Update uptime display
function updateUptime() {
  if (!testStartTime) {
    document.getElementById('uptime').textContent = '0m';
    return;
  }

  const uptimeMs = Date.now() - testStartTime;
  const minutes = Math.floor(uptimeMs / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  let uptimeText;
  if (days > 0) {
    uptimeText = `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    uptimeText = `${hours}h ${minutes % 60}m`;
  } else {
    uptimeText = `${minutes}m`;
  }

  document.getElementById('uptime').textContent = uptimeText;
}

// Update status indicator
function updateStatus(type, message) {
  const statusEl = document.getElementById('status');
  const dot = statusEl.querySelector('.status-dot');
  const text = statusEl.querySelector('span');

  statusEl.className = `status-indicator ${type}`;
  dot.className = `status-dot ${type}`;
  text.textContent = message;
}

// Save state to localStorage
function saveState() {
  const state = {
    stats,
    requestLog,
    testStartTime,
    isRunning: testInterval !== null
  };
  localStorage.setItem('apitest-state', JSON.stringify(state));
}

// Load state from localStorage
function loadState() {
  const saved = localStorage.getItem('apitest-state');
  if (!saved) return;

  try {
    const state = JSON.parse(saved);
    stats = state.stats || stats;
    requestLog = state.requestLog || [];
    testStartTime = state.testStartTime;

    // Restore log entries
    requestLog.forEach(entry => {
      const logContainer = document.getElementById('log-entries');
      const logEntry = document.createElement('div');
      logEntry.className = `log-entry ${entry.success ? 'success' : 'failure'}`;
      
      const timestamp = new Date(entry.timestamp);
      const timeStr = timestamp.toLocaleTimeString();
      logEntry.innerHTML = `
        <span class="log-icon">${entry.success ? '✅' : '❌'}</span>
        <span class="log-time">${timeStr}</span>
        <span>${entry.message}</span>
      `;
      logContainer.appendChild(logEntry);
    });

  } catch (error) {
    console.error('Failed to load saved state:', error);
  }
}

// Calculate success rate
function getSuccessRate() {
  if (stats.totalRequests === 0) return 0;
  return ((stats.successfulRequests / stats.totalRequests) * 100).toFixed(1);
}

// Token Management Functions

// Load token from localStorage
function loadToken() {
  const savedToken = localStorage.getItem('apitest-auth-token');
  if (savedToken) {
    currentAuthToken = savedToken;
    document.getElementById('auth-token').value = savedToken;
    updateTokenStatus(true);
  } else {
    currentAuthToken = DEFAULT_AUTH_TOKEN;
    document.getElementById('auth-token').value = DEFAULT_AUTH_TOKEN;
    updateTokenStatus(false);
  }
}

// Update token
function updateToken() {
  const newToken = document.getElementById('auth-token').value.trim();
  
  if (!newToken) {
    alert('Please enter a token');
    return;
  }
  
  if (!newToken.startsWith('Bearer ')) {
    alert('Token must start with "Bearer "');
    return;
  }
  
  currentAuthToken = newToken;
  localStorage.setItem('apitest-auth-token', newToken);
  updateTokenStatus(true);
  
  // Show success message
  const statusEl = document.getElementById('token-status');
  const originalText = statusEl.textContent;
  statusEl.textContent = '✅ Token Updated!';
  statusEl.style.background = 'rgba(40, 167, 69, 0.2)';
  statusEl.style.color = '#4ade80';
  statusEl.style.border = '1px solid #28a745';
  
  setTimeout(() => {
    updateTokenStatus(true);
  }, 2000);
  
  console.log('✅ Token updated successfully');
}

// Reset token to default
function resetToken() {
  currentAuthToken = DEFAULT_AUTH_TOKEN;
  document.getElementById('auth-token').value = DEFAULT_AUTH_TOKEN;
  localStorage.removeItem('apitest-auth-token');
  updateTokenStatus(false);
  
  // Show success message
  const statusEl = document.getElementById('token-status');
  statusEl.textContent = '↺ Reset to Default';
  statusEl.style.background = 'rgba(40, 167, 69, 0.2)';
  statusEl.style.color = '#4ade80';
  statusEl.style.border = '1px solid #28a745';
  
  setTimeout(() => {
    updateTokenStatus(false);
  }, 2000);
  
  console.log('↺ Token reset to default');
}

// Update token status indicator
function updateTokenStatus(isCustom) {
  const statusEl = document.getElementById('token-status');
  if (isCustom) {
    statusEl.textContent = 'Using custom token';
    statusEl.className = 'token-status custom';
  } else {
    statusEl.textContent = 'Using default token';
    statusEl.className = 'token-status';
  }
}

