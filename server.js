// Load environment variables for local development
require('dotenv').config({ path: '.env.local' });

// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const db = require('./database');
const chargenowAPI = require('./chargenow-api');

// Add fetch for Node.js (if not using Node 18+)
let fetch;
if (typeof globalThis.fetch === 'undefined') {
  fetch = require('node-fetch');
} else {
  fetch = globalThis.fetch;
}

// Global variable to store latest station data
let latestStationData = null;
let lastFetchTime = null;

// Function to fetch and update station data
async function updateStationData() {
  try {
    console.log('🔄 Scheduled station data update started at:', new Date().toISOString());
    
    const result = await chargenowAPI.fetchChargeNowStations();
    latestStationData = result;
    lastFetchTime = new Date().toISOString();
    
    console.log('✅ Station data updated successfully at:', lastFetchTime);
    console.log('📊 Data size:', result.length, 'characters');
  } catch (error) {
    console.error('❌ Scheduled station data update failed:', error.message);
    // Keep previous data if update fails
  }
}

// Initialize station data on server start
updateStationData();

// Schedule station data updates every minute (60000 ms)
setInterval(updateStationData, 60000);

// Initialize Express app and configuration
const app = express();
const PORT = process.env.PORT || 3000;

// JWT secret key
const JWT_SECRET = 'preset_jwt_secret_key_very_long_and_secure';

// Middleware setup
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); // Add JSON parser for API requests
app.use(cookieParser());

// Serve static files from public directory - place this early for better performance
app.use(express.static(path.join(__dirname, 'public')));

// JWT middleware to verify tokens
function verifyToken(req, res, next) {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Health check endpoint for Vercel
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test API token endpoint - uses same logic as testapi.js
app.get('/api/test-token', async (req, res) => {
  try {
    console.log('Testing ChargeNow API token...');
    
    // Use the exact same API call as testapi.js
    const API_URL = 'https://backend.energo.vip/api/cabinet?sort=isOnline,asc&sort=id,desc&page=0&size=10&leaseFilter=false&posFilter=false&AdsFilter=false';
    const AUTH_TOKEN = 'Bearer eyJhbGciOiJIUzUxMiJ9.eyJqdGkiOiJkNDVhMjkzNWY3M2Y0ZjQ1OWU4MzdjM2E1YzBmOTgyMCIsInVzZXIiOiJjdWJVU0EyMDI1IiwiaXNBcGlUb2tlbiI6ZmFsc2UsInN1YiI6ImN1YlVTQTIwMjUiLCJBUElLRVkiOiJidXpOTEQyMDI0IiwiZXhwIjoxNzY1NDc5MDI1fQ.e8cSdnd-EQQZbkNf-qZCMn_0dBk1x8R9vYSkQNVObvp_f6PHcndXJTI5YBddl8WzUFAiMHLfM17zZV5ppmZ7Pw';
    
    // Add timestamp to prevent caching
    const urlWithTimestamp = `${API_URL}&_t=${Date.now()}`;
    
    const response = await fetch(urlWithTimestamp, {
      method: 'GET',
      headers: {
        'Authorization': AUTH_TOKEN,
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'language': 'en-US',
        'oid': '3526',
        'Referer': 'https://backend.energo.vip/device/list',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:144.0) Gecko/20100101 Firefox/144.0'
      }
    });
    
    console.log(`Status Code: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      
      // Validate response structure
      if (data && data.content && Array.isArray(data.content)) {
        console.log('✅ Token test successful');
        res.json({
          success: true,
          statusCode: response.status,
          totalElements: data.totalElements,
          stationsCount: data.content.length,
          sampleStation: data.content[0]?.cabinetId || 'N/A',
          timestamp: new Date().toISOString()
        });
      } else {
        console.log('⚠️  Unexpected response structure');
        res.json({
          success: false,
          statusCode: response.status,
          error: 'Unexpected response structure',
          message: 'API returned data but not in expected format',
          data: data,
          timestamp: new Date().toISOString()
        });
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Token test failed');
      
      let errorMessage = errorText;
      if (response.status === 401 || response.status === 403) {
        errorMessage = '🔒 TOKEN EXPIRED OR UNAUTHORIZED!';
      }
      
      res.json({
        success: false,
        statusCode: response.status,
        error: response.statusText,
        message: errorMessage,
        details: errorText,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('❌ Token test error:', error.message);
    
    res.json({
      success: false,
      statusCode: 'N/A',
      error: error.name || 'Error',
      message: error.message || 'Unknown error occurred',
      timestamp: new Date().toISOString()
    });
  }
});

// ========================================
// CHARGENOW API WRAPPER FUNCTIONS
// ========================================
// These functions are now imported from chargenow-api.js module
// This makes it easier to switch suppliers in the future
// ========================================

// Test database endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    console.log('Testing database connection...');
    const users = await db.getAllUsers();
    console.log('Database test - Users found:', users.length);
    res.json({ 
      status: 'ok', 
      users_count: users.length,
      sample_user: users[0] || null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ 
      status: 'error', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Database schema check endpoint (JSON-based)
app.get('/api/check-schema', async (req, res) => {
  try {
    console.log('🔍 Checking JSON database schema...');
    
    const fs = require('fs');
    const path = require('path');
    const USERS_FILE = path.join(__dirname, 'data', 'users.json');
    
    if (!fs.existsSync(USERS_FILE)) {
      return res.json({ 
        status: 'success', 
        table: 'users',
        database: 'JSON',
        message: 'No users file found',
        timestamp: new Date().toISOString()
      });
    }
    
    const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    const sampleUser = users[0] || {};
    
    res.json({ 
      status: 'success', 
      table: 'users',
      database: 'JSON',
      userCount: users.length,
      sampleFields: Object.keys(sampleUser),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Schema check failed:', error);
    res.status(500).json({ 
      status: 'error', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Static files are served by express.static middleware above

// Static page routes - serve HTML files
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Helper function to escape HTML characters
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

app.get('/login', (req, res) => {
  // Extract username from URL parameters (password not pre-filled for security)
  const username = escapeHtml(req.query.username || '');
  
  res.setHeader('Content-Type', 'text/html');
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Sign in</title>
  <link rel="stylesheet" href="/css/style.css">
  
  <!-- Favicon and iOS icons -->
  <link rel="icon" type="image/x-icon" href="/icons/favicon.ico?v=2">
  <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png?v=2">
  <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png?v=2">
  <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png?v=2">
  <link rel="manifest" href="/icons/site.webmanifest?v=2">
  
  <!-- iOS home screen meta tags -->
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Preset App">
  <meta name="theme-color" content="#000000">
</head>
<body class="login-page">
  <div class="login-split-container">
    <!-- Left side - Blue background with payment image -->
    <div class="login-left">
      <div class="payment-image-container">
        <img src="/icons/payment-illustration.png" alt="Contactless Payment" class="payment-image">
      </div>
    </div>
    
    <!-- Right side - Login form -->
    <div class="login-right">
      <div class="login-form-container">
        <h1>Sign in</h1>
        <form action="/login" method="POST">
          <label for="username">Username</label>
          <input type="text" id="username" name="username" value="${username}" required>
          <label for="password">Password</label>
          <input type="password" id="password" name="password" required>
          <div class="remember-me">
            <input type="checkbox" id="remember-me" name="remember-me">
            <label for="remember-me">Keep me signed in</label>
          </div>
          <div class="button-row">
            <button type="submit" class="primary">Sign in</button>
            <a href="/signup" class="secondary">Sign up</a>
          </div>
        </form>
      </div>
    </div>
  </div>
  <script src="/js/remember-me.js"></script>
  <script src="/js/zoom-prevention.js"></script>
</body>
</html>
  `);
});

app.get('/signup', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Sign up</title>
  <link rel="stylesheet" href="/css/style.css">
  
  <!-- Favicon and iOS icons -->
  <link rel="icon" type="image/x-icon" href="/icons/favicon.ico?v=2">
  <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png?v=2">
  <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png?v=2">
  <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png?v=2">
  <link rel="manifest" href="/icons/site.webmanifest?v=2">
  
  <!-- iOS home screen meta tags -->
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Preset App">
  <meta name="theme-color" content="#000000">
</head>
<body class="signup-page">
  <div class="login-split-container">
    <!-- Left side - Blue background with payment image -->
    <div class="login-left">
      <div class="payment-image-container">
        <img src="/icons/payment-illustration.png" alt="Contactless Payment" class="payment-image">
      </div>
    </div>
    
    <!-- Right side - Signup form -->
    <div class="login-right">
      <div class="login-form-container">
        <h1>Sign up</h1>
        <form action="/signup" method="POST">
          <label for="phone">Phone</label>
          <input type="text" id="phone" name="phone" required>
          <label for="username">Username</label>
          <input type="text" id="username" name="username" required>
          <label for="password">Password</label>
          <input type="password" id="password" name="password" required>
          <label for="password2">Confirm Password</label>
          <input type="password" id="password2" name="password2" required>
          <label for="stationIds">Station IDs (comma-separated)</label>
          <input type="text" id="stationIds" name="stationIds">
          <div class="button-row">
            <button type="submit" class="primary">Submit</button>
            <a href="/login" class="secondary">Back to sign in</a>
          </div>
        </form>
      </div>
    </div>
  </div>
  <script src="/js/zoom-prevention.js"></script>
</body>
</html>
  `);
});

app.get('/home', (req, res) => {
  // Check if user has valid JWT token
  const token = req.cookies?.token;
  
  if (!token) {
    console.log('No JWT token found, redirecting to login');
    return res.redirect('/login');
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('User accessing home page:', decoded.username);
    console.log('Username type:', typeof decoded.username);
    res.setHeader('Content-Type', 'text/html');
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Welcome</title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <div class="container" data-username="${decoded.username}" data-usertype="${decoded.userType}">
    <div class="welcome-top">
              <div class="summary-stats">
          <div class="stat-item">
            <div class="stat-value" id="take-home">$0</div>
            <div class="stat-label">Take home</div>
          </div>
          <div class="stat-item">
            <div class="stat-value" id="total-revenue">$0</div>
            <div class="stat-label">Total revenue</div>
          </div>
        </div>
      
      <div class="date-range-panel">
        <div class="date-inputs">
          <div class="date-input-group">
            <input type="date" id="start-date" class="date-input">
          </div>
          <div class="date-input-group">
            <input type="date" id="end-date" class="date-input">
          </div>
        </div>
      </div>
    </div>
    
    <div class="station-section">
      <div id="station-list">
        <!-- Station list will be populated here -->
      </div>
    </div>
    
    <!-- Menu Icon -->
    <div class="menu-icon" id="menu-icon">
      <div class="hamburger-lines">
        <div class="hamburger-line"></div>
        <div class="hamburger-line"></div>
        <div class="hamburger-line"></div>
      </div>
      <div class="menu-x">×</div>
    </div>
    
    <!-- Full Screen Overlay -->
    <div class="menu-overlay" id="menu-overlay">
      <div class="menu-items">
        <a href="/logout" class="menu-item logout">Logout</a>
        <a href="https://battery.cuub.tech/map.html" class="menu-item" target="_blank">Map</a>
        <a href="https://cuub.tech/" class="menu-item" target="_blank">Website</a>
      </div>
    </div>
  </div>

  <script src="/js/deployment-manager.js"></script>
  <script src="/js/home.js"></script>
  <script src="/js/zoom-prevention.js"></script>
</body>
</html>
    `;
    
    res.send(htmlContent);
  } catch (error) {
    console.log('Invalid JWT token, redirecting to login');
    res.clearCookie('token');
    res.redirect('/login');
  }
});

// Admin password validation endpoint
app.post('/api/validate-admin-password', (req, res) => {
  const { password } = req.body;
  const ADMIN_PASSWORD = '1234'; // Default admin password
  
  if (password === ADMIN_PASSWORD) {
    // Set admin session cookie
    res.cookie('admin_authenticated', 'true', { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 60 * 1000 // 30 minutes
    });
    res.json({ success: true });
  } else {
    res.json({ success: false, error: 'Incorrect password' });
  }
});

// Admin logout endpoint
app.post('/api/logout-admin', (req, res) => {
  // Clear admin authentication cookie
  res.clearCookie('admin_authenticated');
  res.json({ success: true });
});

// Admin password page
app.get('/admin-password', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/html/admin-password.html'));
});

// Test API page
app.get('/testapi', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/html/testapi.html'));
});

// Protected admin route
app.get('/admin', (req, res) => {
  // Check if admin is authenticated
  if (req.cookies.admin_authenticated !== 'true') {
    return res.redirect('/admin-password');
  }
  
  res.setHeader('Content-Type', 'text/html');
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Admin Panel</title>
  <link rel="stylesheet" href="/css/style.css">
  
  <!-- Favicon and iOS icons -->
  <link rel="icon" type="image/x-icon" href="/icons/favicon.ico">
  <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-new.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-new-16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png">
  <link rel="manifest" href="/icons/site.webmanifest">
  
  <!-- iOS home screen meta tags -->
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Preset App">
  <meta name="theme-color" content="#000000">
</head>
<body>
  <div class="container">
    <div class="home-top">
      <h1>Admin Panel</h1>
    </div>
    
    <!-- Station Management Section -->
    <div id="station-management-section" class="admin-section">
      <h2 class="section-title">Station Management</h2>
      <div id="station-list-admin"></div>
      <button id="addStationBtn" class="primary" style="margin-top: 20px; width: 100%;">Add New Station</button>
    </div>
    
    <!-- User Management Section -->
    <div id="user-management-section" class="admin-section">
      <h2 class="section-title">User Management</h2>
      <div id="user-list"></div>
    </div>
    
    <div class="button-row">
      <button id="addUserBtn" class="primary">Add New User</button>
      <button id="logoutBtn" class="secondary">Logout</button>
    </div>
  </div>
  <script src="/js/deployment-manager.js"></script>
  <script src="/js/admin.js"></script>
  <script src="/js/zoom-prevention.js"></script>
</body>
</html>
  `);
});

app.get('/newuser', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Create New User</title>
  <link rel="stylesheet" href="/css/style.css">
  
  <!-- Favicon and iOS icons -->
  <link rel="icon" type="image/x-icon" href="/icons/favicon.ico">
  <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-new.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-new-16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png">
  <link rel="manifest" href="/icons/site.webmanifest">
  
  <!-- iOS home screen meta tags -->
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Preset App">
  <meta name="theme-color" content="#000000">
</head>
<body>
  <div class="container">
    <h1>Create New User</h1>
    <form action="/newuser" method="POST">
      <label for="phone">Phone</label>
      <input type="text" id="phone" name="phone" required>
      <label for="username">Username</label>
      <input type="text" id="username" name="username" required>
      <label for="password">Password</label>
      <input type="password" id="password" name="password" required>
      <label for="password2">Confirm Password</label>
      <input type="password" id="password2" name="password2" required>
      <label for="stationIds">Station IDs (comma-separated)</label>
      <input type="text" id="stationIds" name="stationIds">
      <div class="button-row">
        <button type="submit" class="primary">Create User</button>
        <a href="/admin" class="secondary">Back to Admin</a>
      </div>
    </form>
  </div>
  <script src="/js/zoom-prevention.js"></script>
</body>
</html>
  `);
});

// Authentication routes
app.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

// User registration - handles new user signup
app.post('/signup', async (req, res) => {
  try {
    console.log('Signup attempt:', req.body);
    const { phone, username, password, password2, stationIds } = req.body;
    
    if (!phone || !username || !password || !password2 || password !== password2) {
      console.log('Signup validation failed');
      return res.redirect('/signup?error=invalid');
    }
    
    // Check if user already exists
    const existingUser = await db.getUserByUsername(username);
    if (existingUser) {
      console.log('Signup failed - user already exists:', username);
      return res.redirect('/signup?error=exists');
    }
    
    console.log('Creating new user:', username);
    const hash = bcrypt.hashSync(password, 10);
    // Parse station IDs from comma-separated string or use empty array
    const stationIdsArray = stationIds ? stationIds.split(',').map(id => id.trim()).filter(id => id) : [];
    await db.createUser(username, phone, hash, stationIdsArray);
    
    console.log('User created successfully, generating JWT token');
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
    
    // Set JWT token as HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // Set to true for HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax',
      path: '/'
    });
    
    console.log('JWT token set, redirecting to home');
    res.redirect('/home');
  } catch (error) {
    console.error('Signup error:', error);
    res.redirect('/signup?error=server');
  }
});

// Admin user creation - handles new user creation from admin panel
app.post('/newuser', async (req, res) => {
  try {
    console.log('Admin user creation request:', req.body);
    const { phone, username, password, password2, stationIds } = req.body;
    
    // Validate input
    if (!phone || !username || !password || !password2) {
      console.log('Missing required fields:', { phone, username, password: !!password, password2: !!password2 });
      return res.redirect('/newuser?error=invalid');
    }
    
    if (password !== password2) {
      console.log('Passwords do not match');
      return res.redirect('/newuser?error=invalid');
    }
    
    console.log('Checking if user exists:', username);
    // Check if user already exists
    const existingUser = await db.getUserByUsername(username);
    if (existingUser) {
      console.log('User already exists:', username);
      return res.redirect('/newuser?error=exists');
    }
    
    console.log('Creating new user:', username);
    const hash = bcrypt.hashSync(password, 10);
    // Parse station IDs from comma-separated string or use empty array
    const stationIdsArray = stationIds ? stationIds.split(',').map(id => id.trim()).filter(id => id) : [];
    const newUser = await db.createUser(username, phone, hash, stationIdsArray);
    console.log('User created successfully:', newUser);
    
    res.redirect('/admin');
  } catch (error) {
    console.error('New user creation error:', error);
    console.error('Error stack:', error.stack);
    res.redirect('/newuser?error=server');
  }
});

// User login - authenticates existing users
app.post('/login', async (req, res) => {
  try {
    console.log('Login attempt:', req.body);
    const { username, password } = req.body;
    const user = await db.getUserByUsername(username);
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
      console.log('Login failed for username:', username);
      return res.redirect('/login?error=invalid');
    }
    
          console.log('Login successful for username:', username);
      const token = jwt.sign({ username, userType: user.userType }, JWT_SECRET, { expiresIn: '24h' });
    
    // Set JWT token as HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // Set to true for HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax',
      path: '/'
    });
    
    console.log('JWT token set, redirecting to home');
    res.redirect('/home');
  } catch (error) {
    console.error('Login error:', error);
    res.redirect('/login?error=server');
  }
});

// Session check endpoint
app.get('/api/session', (req, res) => {
  res.json({
    sessionID: req.sessionID,
    session: req.session,
    user: req.session.user,
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint for deployment
app.get('/api/debug-vercel', async (req, res) => {
  try {
    res.json({
      environment: process.env.NODE_ENV || 'development',
      database: 'JSON',
      status: 'JSON database active',
      timestamp: new Date().toISOString(),
      serverTime: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint to check if user is logged in
app.get('/api/test-auth', (req, res) => {
  const token = req.cookies?.token;
  
  if (!token) {
    return res.json({ loggedIn: false });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ 
      loggedIn: true, 
      username: decoded.username
    });
  } catch (error) {
    res.clearCookie('token');
    res.json({ loggedIn: false });
  }
});

// JWT token check endpoint
app.get('/api/token', (req, res) => {
  const token = req.cookies?.token;
  
  if (!token) {
    return res.json({ hasToken: false });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ 
      hasToken: true, 
      username: decoded.username,
      expiresIn: decoded.exp 
    });
  } catch (error) {
    res.clearCookie('token');
    res.json({ hasToken: false, error: 'Invalid token' });
  }
});

// API endpoints for frontend data
app.get('/me', verifyToken, async (req, res) => {
  try {
    console.log('GET /me - User from token:', req.user);
    
    const user = await db.getUserByUsername(req.user.username);
    console.log('GET /me - User from DB:', user);
    
    if (!user) {
      console.log('GET /me - User not found in DB');
      return res.status(401).json({ error: 'User not found' });
    }
    
    res.json({ username: user.username, phone: user.phone });
  } catch (error) {
    console.error('GET /me - Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get list of all users (for home page)
app.get('/users', verifyToken, async (req, res) => {
  try {
    console.log('GET /users - User from token:', req.user);
    
    const users = await db.getAllUsers();
    console.log('GET /users - All users from DB:', users);
    console.log('GET /users - Users count:', users.length);
    console.log('GET /users - First user sample:', users[0]);
    
    const filteredUsers = users.filter(u => u.username !== req.user.username);
    console.log('GET /users - Filtered users:', filteredUsers);
    console.log('GET /users - Filtered count:', filteredUsers.length);
    
    res.json(filteredUsers);
  } catch (error) {
    console.error('GET /users - Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});



// Admin panel endpoints
app.get('/admin/users', async (req, res) => {
  try {
    console.log('GET /admin/users - Starting request');
    const users = await db.getAllUsers();
    console.log('GET /admin/users - Users from DB:', users);
    console.log('GET /admin/users - Users count:', users.length);
    console.log('GET /admin/users - First user sample:', users[0]);
    res.json(users);
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin panel endpoints with full user details (including passwords)
app.get('/admin/users-full', async (req, res) => {
  try {
    console.log('GET /admin/users-full - Starting request');
    const users = await db.getAllUsersWithPasswords();
    console.log('GET /admin/users-full - Users from DB:', users);
    console.log('GET /admin/users-full - Users count:', users.length);
    console.log('GET /admin/users-full - First user sample:', users[0]);
    res.json(users);
  } catch (error) {
    console.error('Get admin users full error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Endpoint to update user's station assignments
app.post('/admin/update-user-stations', async (req, res) => {
  try {
    console.log('Admin update user stations request:', req.body);
    const { userId, stationIds } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Handle both dictionary format (new) and array format (legacy)
    let stationIdsDict = {};
    
    if (typeof stationIds === 'object' && stationIds !== null) {
      // New dictionary format: { "DTN00971": "Station Title", "DTN00970": "Another Title" }
      stationIdsDict = stationIds;
    } else if (typeof stationIds === 'string') {
      // Legacy comma-separated string format
      const stationIdsArray = stationIds.split(',').map(id => id.trim()).filter(id => id);
      stationIdsArray.forEach(id => {
        stationIdsDict[id] = id; // Use station ID as title for legacy format
      });
    }
    
    console.log('Updating stations for user ID:', userId, 'with stations:', stationIdsDict);
    const updatedUser = await db.updateUserStations(userId, stationIdsDict);
    
    if (updatedUser) {
      console.log('User stations updated successfully:', updatedUser.username);
      res.json({ success: true, updatedUser });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Update user stations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/admin/delete-user', async (req, res) => {
  try {
    console.log('Admin delete user request:', req.body);
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    console.log('Deleting user with ID:', userId);
    const deletedUser = await db.deleteUser(userId);
    console.log('User deleted successfully:', deletedUser);
    
    res.json({ success: true, deletedUser });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});





// ========================================
// STATION MANAGEMENT API ENDPOINTS
// ========================================

const fs = require('fs').promises;
const stationsFilePath = path.join(__dirname, 'data', 'stations.json');

/**
 * Read stations from JSON file
 */
async function readStations() {
  try {
    const data = await fs.readFile(stationsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading stations file:', error);
    return [];
  }
}

/**
 * Write stations to JSON file
 */
async function writeStations(stations) {
  try {
    await fs.writeFile(stationsFilePath, JSON.stringify(stations, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing stations file:', error);
    return false;
  }
}

/**
 * GET all stations
 */
app.get('/api/admin/stations', async (req, res) => {
  try {
    console.log('GET /api/admin/stations - Fetching all stations');
    const stations = await readStations();
    console.log('Stations loaded:', stations.length);
    res.json(stations);
  } catch (error) {
    console.error('Error fetching stations:', error);
    res.status(500).json({ error: 'Failed to fetch stations' });
  }
});

/**
 * POST new station
 */
app.post('/api/admin/stations', async (req, res) => {
  try {
    console.log('POST /api/admin/stations - Adding new station:', req.body);
    
    const { id, name, address, coordinates } = req.body;
    
    // Validation
    if (!id || !name || !address || !coordinates) {
      return res.status(400).json({ error: 'Missing required fields: id, name, address, coordinates' });
    }
    
    if (!Array.isArray(coordinates) || coordinates.length !== 2) {
      return res.status(400).json({ error: 'Coordinates must be an array with [longitude, latitude]' });
    }
    
    // Read existing stations
    const stations = await readStations();
    
    // Check if station ID already exists
    if (stations.find(s => s.id === id)) {
      return res.status(409).json({ error: 'Station with this ID already exists' });
    }
    
    // Create new station object
    const newStation = {
      id,
      name,
      address,
      coordinates
    };
    
    // Add to stations array
    stations.push(newStation);
    
    // Write to file
    const success = await writeStations(stations);
    
    if (success) {
      console.log('Station added successfully:', newStation);
      res.status(201).json({
        message: 'Station added successfully',
        station: newStation
      });
    } else {
      res.status(500).json({ error: 'Failed to save station' });
    }
  } catch (error) {
    console.error('Error adding station:', error);
    res.status(500).json({ error: 'Failed to add station' });
  }
});

/**
 * PUT update station
 */
app.put('/api/admin/stations/:id', async (req, res) => {
  try {
    const stationId = req.params.id;
    console.log('PUT /api/admin/stations/:id - Updating station:', stationId, req.body);
    
    const { name, address, coordinates } = req.body;
    
    // Validation
    if (coordinates && (!Array.isArray(coordinates) || coordinates.length !== 2)) {
      return res.status(400).json({ error: 'Coordinates must be an array with [longitude, latitude]' });
    }
    
    // Read existing stations
    const stations = await readStations();
    
    // Find station to update
    const stationIndex = stations.findIndex(s => s.id === stationId);
    
    if (stationIndex === -1) {
      return res.status(404).json({ error: 'Station not found' });
    }
    
    // Update station fields
    if (name !== undefined) stations[stationIndex].name = name;
    if (address !== undefined) stations[stationIndex].address = address;
    if (coordinates !== undefined) stations[stationIndex].coordinates = coordinates;
    
    // Write to file
    const success = await writeStations(stations);
    
    if (success) {
      console.log('Station updated successfully:', stations[stationIndex]);
      res.json({
        message: 'Station updated successfully',
        station: stations[stationIndex]
      });
    } else {
      res.status(500).json({ error: 'Failed to update station' });
    }
  } catch (error) {
    console.error('Error updating station:', error);
    res.status(500).json({ error: 'Failed to update station' });
  }
});

/**
 * DELETE station
 */
app.delete('/api/admin/stations/:id', async (req, res) => {
  try {
    const stationId = req.params.id;
    console.log('DELETE /api/admin/stations/:id - Deleting station:', stationId);
    
    // Read existing stations
    const stations = await readStations();
    
    // Find station to delete
    const stationIndex = stations.findIndex(s => s.id === stationId);
    
    if (stationIndex === -1) {
      return res.status(404).json({ error: 'Station not found' });
    }
    
    // Remove station
    const deletedStation = stations.splice(stationIndex, 1)[0];
    
    // Write to file
    const success = await writeStations(stations);
    
    if (success) {
      console.log('Station deleted successfully:', deletedStation);
      res.json({ message: 'Station deleted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to delete station' });
    }
  } catch (error) {
    console.error('Error deleting station:', error);
    res.status(500).json({ error: 'Failed to delete station' });
  }
});

// Make initial API call when server starts
console.log('Making initial API call to ChargeNow...');
chargenowAPI.fetchChargeNowStations()
  .then(result => {
    console.log('Device list received:', result);
    console.log('Initial API call completed successfully');
  })
  .catch(error => {
    console.error('Initial API call failed:', error);
  });



// Endpoint to get station data for the home page (filtered by user permissions)
app.get('/api/stations', verifyToken, async (req, res) => {
  try {
    console.log('Fetching stations for user:', req.user.username);
    
    // Get user's station permissions
    const user = await db.getUserByUsername(req.user.username);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    console.log('=== STATION FILTERING DEBUG ===');
    console.log('Request user:', req.user.username);
    console.log('User data retrieved:', {
      username: user.username,
      station_ids: user.station_ids,
      station_ids_type: typeof user.station_ids,
      station_ids_length: Array.isArray(user.station_ids) ? user.station_ids.length : 'not array'
    });
    
    // Debug: Check if station_ids contains the expected value
    console.log('Expected station ID for Parlay: BJH09881');
    if (Array.isArray(user.station_ids)) {
      console.log('User station_ids contains BJH09881:', user.station_ids.includes('BJH09881'));
    } else if (typeof user.station_ids === 'object' && user.station_ids !== null) {
      console.log('User station_ids contains BJH09881:', 'BJH09881' in user.station_ids);
    }
    console.log('User station_ids:', JSON.stringify(user.station_ids));
    console.log('=== END DEBUG ===');
    
    // Use demo data for demo user, otherwise use cached station data
    let result;
    if (req.user.username === 'demo') {
      console.log('🎭 Using demo station data for demo user');
      result = chargenowAPI.generateDemoStationData();
    } else if (latestStationData && lastFetchTime) {
      console.log('📋 Using cached station data from:', lastFetchTime);
      result = latestStationData;
    } else {
      console.log('🔄 No cached data available, fetching fresh station data...');
      result = await chargenowAPI.fetchChargeNowStations();
    }
    
    let formattedData;
    try {
      formattedData = JSON.parse(result);
    } catch (e) {
      formattedData = result;
    }
    
    // Filter stations based on user permissions
    let filteredStations = [];
    
    // Check if the API response has the expected structure
    console.log('API response structure:', {
      hasData: !!formattedData.data,
      dataType: typeof formattedData.data,
      isArray: Array.isArray(formattedData.data),
      dataLength: Array.isArray(formattedData.data) ? formattedData.data.length : 'not array'
    });
    
    // Extract the stations array from the API response
    let stationsArray = [];
    if (formattedData && formattedData.data && Array.isArray(formattedData.data)) {
      stationsArray = formattedData.data;
    } else if (Array.isArray(formattedData)) {
      stationsArray = formattedData;
    }
    
    console.log('Stations array to filter:', {
      length: stationsArray.length,
      sampleStation: stationsArray[0] ? {
        pCabinetid: stationsArray[0].pCabinetid,
        id: stationsArray[0].id
      } : 'no stations'
    });
    
    if (stationsArray.length > 0) {
      console.log('User station permissions:', user.station_ids);
      console.log('User station permissions type:', typeof user.station_ids);
      
      // Handle both dictionary format (new) and array format (legacy)
      let userStationIds = [];
      if (typeof user.station_ids === 'object' && user.station_ids !== null) {
        if (Array.isArray(user.station_ids)) {
          // Legacy array format
          userStationIds = user.station_ids;
        } else {
          // New dictionary format - extract keys
          userStationIds = Object.keys(user.station_ids);
        }
      }
      
      console.log('User station permissions length:', userStationIds.length);
      
      if (userStationIds.length > 0) {
        // Filter to only show stations the user has access to
        filteredStations = stationsArray.filter(station => {
          const stationId = station.pCabinetid || station.id;
          console.log(`Checking station: ${stationId} (type: ${typeof stationId}) against user permissions: ${JSON.stringify(userStationIds)}`);
          
          // Check for exact match first
          let hasAccess = userStationIds.includes(stationId);
          
          // If no exact match, try case-insensitive comparison
          if (!hasAccess) {
            hasAccess = userStationIds.some(permittedId => 
              permittedId.toString().toLowerCase() === stationId.toString().toLowerCase()
            );
          }
          
          console.log(`Station ${stationId} access: ${hasAccess}`);
          return hasAccess;
        });
        console.log(`Filtered stations: ${filteredStations.length} out of ${stationsArray.length}`);
        console.log('Filtered station IDs:', filteredStations.map(s => s.pCabinetid || s.id));
        
        // Fetch order data for each filtered station
        console.log('Fetching order data for filtered stations...');
        
        // Get date range from query parameters or use default (last month)
        const queryStartDate = req.query.startDate;
        const queryEndDate = req.query.endDate;
        
        let sTime, eTime;
        if (queryStartDate && queryEndDate) {
          // Use custom date range from frontend - treat as local dates
          const startDate = new Date(queryStartDate + 'T00:00:00');
          const endDate = new Date(queryEndDate + 'T23:59:59');
          sTime = startDate.toISOString().slice(0, 19).replace('T', ' ');
          eTime = endDate.toISOString().slice(0, 19).replace('T', ' ');
          console.log(`Using custom date range: ${sTime} to ${eTime}`);
        } else {
          // Use default date range (first day of current month to current date)
          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(1);
          // Set to start of day and end of day in local timezone
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          sTime = startDate.toISOString().slice(0, 19).replace('T', ' ');
          eTime = endDate.toISOString().slice(0, 19).replace('T', ' ');
          console.log(`Using default date range: ${sTime} to ${eTime}`);
        }
        
        for (let station of filteredStations) {
          try {
            const stationId = station.pCabinetid || station.id;
            console.log(`Fetching orders for station: ${stationId}`);
            
            // Add station title from user's station_ids dictionary
            if (typeof user.station_ids === 'object' && user.station_ids !== null && !Array.isArray(user.station_ids)) {
              station.stationTitle = user.station_ids[stationId] || stationId;
            } else {
              station.stationTitle = stationId; // Fallback to station ID if no title
            }
            
            // Return demo data for demo stations
            if (stationId.startsWith('DEMO')) {
              // Generate random demo data for each station
              const randomOrders = Math.floor(Math.random() * 50) + 20; // 20-70 orders
              const randomRevenue = (Math.random() * 800) + 50; // $50-$850 revenue
              
              station.orderData = {
                totalRecords: randomOrders,
                totalRevenue: randomRevenue,
                success: true
              };
              
              console.log(`Station ${stationId}: ${station.orderData.totalRecords} orders, $${station.orderData.totalRevenue.toFixed(2)} revenue (DEMO DATA)`);
            } else {
              // Use real API for non-demo stations via chargenow-api module
              const { response, result: orderData } = await chargenowAPI.fetchStationRentalHistory(stationId, sTime, eTime);
              
              // Add order data to station
              station.orderData = {
                totalRecords: orderData.page?.total || 0,
                totalRevenue: 0,
                success: orderData.code === 0
              };
              
              // Calculate total revenue from all records
              if (orderData.page?.records && Array.isArray(orderData.page.records)) {
                station.orderData.totalRevenue = orderData.page.records.reduce((sum, record) => {
                  return sum + (parseFloat(record.settledAmount) || 0);
                }, 0);
              }
              
              console.log(`[MAIN] Station ${stationId}: ${station.orderData.totalRecords} orders, $${station.orderData.totalRevenue.toFixed(2)} revenue (rounded: $${Math.round(station.orderData.totalRevenue)})`);
            }
            
          } catch (error) {
            console.error(`Error fetching orders for station ${station.pCabinetid}:`, error);
            station.orderData = {
              totalRecords: 0,
              totalRevenue: 0,
              success: false,
              error: error.message
            };
          }
        }
        
      } else {
        console.log('User has no station permissions, showing no stations');
        filteredStations = [];
      }
    } else {
      console.log('No stations found in API response');
    }
    
    // Calculate totals for debugging (same as frontend)
    let debugTotalRevenue = 0;
    let debugTotalRents = 0;
    
    filteredStations.forEach(station => {
      const revenue = station.orderData?.totalRevenue || 0;
      const rents = station.orderData?.totalRecords || 0;
      
      const roundedRevenue = Math.round(revenue);
      debugTotalRevenue += roundedRevenue;
      debugTotalRents += rents;
      
      console.log(`[MAIN] Adding station ${station.pCabinetid}: $${revenue.toFixed(2)} -> $${roundedRevenue} (total now: $${debugTotalRevenue})`);
    });
    
    console.log(`[MAIN] Final totals: $${debugTotalRevenue} revenue, ${debugTotalRents} rents`);
    
    res.json({ 
      success: true, 
      data: filteredStations,
      userPermissions: user.station_ids,
      totalStations: Array.isArray(formattedData) ? formattedData.length : 0,
      debugTotals: {
        totalRevenue: debugTotalRevenue,
        totalRents: debugTotalRents
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching stations:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test endpoint to debug station filtering
app.get('/api/debug-stations', async (req, res) => {
  try {
    console.log('Debug endpoint called');
    
    // Simulate the station filtering logic
    const testUser = {
      username: 'Parlay',
      station_ids: ['BJH09881']
    };
    
    const testStations = [
      { pCabinetid: 'BJH09881', name: 'Station 1' },
      { pCabinetid: 'DTN00872', name: 'Station 2' },
      { pCabinetid: 'DTN00970', name: 'Station 3' }
    ];
    
    console.log('Test user:', testUser);
    console.log('Test stations:', testStations);
    
    const filtered = testStations.filter(station => {
      const stationId = station.pCabinetid || station.id;
      return testUser.station_ids.includes(stationId);
    });
    
    console.log('Filtered result:', filtered);
    
    res.json({
      testUser,
      testStations,
      filtered,
      filteringLogic: 'station.pCabinetid in user.station_ids'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint to check user data from database
app.get('/api/debug-user/:username', async (req, res) => {
  try {
    const username = req.params.username;
    console.log('Debug user endpoint called for:', username);
    
    const user = await db.getUserByUsername(username);
    console.log('User data retrieved:', user);
    
    res.json({
      username,
      userData: user,
      station_ids: user ? user.station_ids : null,
      station_ids_type: user ? typeof user.station_ids : 'user not found',
      station_ids_length: user && Array.isArray(user.station_ids) ? user.station_ids.length : 'not array'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to get take-home amount for CUUB user (no authentication required)
// This endpoint gets the data directly from the dashboard by calling the main /api/stations endpoint
app.get('/api/take-home', async (req, res) => {
  try {
    console.log('Fetching take-home amount for CUUB user from dashboard data');
    
    // Get date range from query parameters or use default (current month)
    const queryStartDate = req.query.startDate;
    const queryEndDate = req.query.endDate;
    
    // Build the same query parameters that the dashboard uses
    const queryParams = new URLSearchParams();
    if (queryStartDate) queryParams.append('startDate', queryStartDate);
    if (queryEndDate) queryParams.append('endDate', queryEndDate);
    
    // Instead of making an HTTP request, directly call the stations endpoint logic
    // This avoids fetch issues in production and ensures consistency
    console.log('Using internal stations endpoint logic for CUUB user');
    
    // Get CUUB user data directly
    const user = await db.getUserByUsername('CUUB');
    if (!user) {
      return res.status(404).json({ error: 'CUUB user not found' });
    }
    
    // Get date range from query parameters or use default (current month)
    let sTime, eTime;
    if (queryStartDate && queryEndDate) {
      // Use custom date range from frontend
      const startDate = new Date(queryStartDate + 'T00:00:00');
      const endDate = new Date(queryEndDate + 'T23:59:59');
      sTime = startDate.toISOString().slice(0, 19).replace('T', ' ');
      eTime = endDate.toISOString().slice(0, 19).replace('T', ' ');
      console.log(`Using custom date range for take-home: ${sTime} to ${eTime}`);
    } else {
      // Use default date range (first day of current month to current date)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(1);
      // Set to start of day and end of day in local timezone
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      sTime = startDate.toISOString().slice(0, 19).replace('T', ' ');
      eTime = endDate.toISOString().slice(0, 19).replace('T', ' ');
      console.log(`Using default date range for take-home: ${sTime} to ${eTime}`);
    }
    
    // Use the same logic as the main /api/stations endpoint
    let result;
    if (latestStationData && lastFetchTime) {
      console.log('📋 Using cached station data for take-home from:', lastFetchTime);
      result = latestStationData;
    } else {
      console.log('🔄 No cached data available, fetching fresh station data for take-home...');
      result = await chargenowAPI.fetchChargeNowStations();
    }
    
    let formattedData;
    try {
      formattedData = JSON.parse(result);
    } catch (e) {
      formattedData = result;
    }
    
    // Filter stations based on user permissions (same logic as main endpoint)
    let filteredStations = [];
    
    // Extract the stations array from the API response
    let stationsArray = [];
    if (formattedData && formattedData.data && Array.isArray(formattedData.data)) {
      stationsArray = formattedData.data;
    } else if (Array.isArray(formattedData)) {
      stationsArray = formattedData;
    }
    
    if (stationsArray.length > 0) {
      // Handle both dictionary format (new) and array format (legacy)
      let userStationIds = [];
      if (typeof user.station_ids === 'object' && user.station_ids !== null) {
        if (Array.isArray(user.station_ids)) {
          // Legacy array format
          userStationIds = user.station_ids;
        } else {
          // New dictionary format - extract keys
          userStationIds = Object.keys(user.station_ids);
        }
      }
      
      console.log(`[TAKE-HOME DEBUG] Total stations in API response: ${stationsArray.length}`);
      console.log(`[TAKE-HOME DEBUG] CUUB user station IDs:`, userStationIds);
      
      // Filter stations
      filteredStations = stationsArray.filter(station => {
        const stationId = station.pCabinetid || station.id;
        const isIncluded = userStationIds.includes(stationId);
        console.log(`[TAKE-HOME DEBUG] Station ${stationId}: ${isIncluded ? 'INCLUDED' : 'EXCLUDED'}`);
        return isIncluded;
      });
      
      console.log(`[TAKE-HOME DEBUG] Filtered ${filteredStations.length} stations for CUUB user`);
      console.log(`[TAKE-HOME DEBUG] Filtered station IDs:`, filteredStations.map(s => s.pCabinetid || s.id));
    } else {
      console.log(`[TAKE-HOME DEBUG] No stations found in API response`);
    }
    
    // Fetch order data for each filtered station (same logic as main endpoint)
    console.log(`[TAKE-HOME DEBUG] Starting to process ${filteredStations.length} stations for order data...`);
    
    for (let i = 0; i < filteredStations.length; i++) {
      const station = filteredStations[i];
      try {
        const stationId = station.pCabinetid || station.id;
        console.log(`[TAKE-HOME DEBUG] Processing station ${i + 1}/${filteredStations.length}: ${stationId}`);
        
        // Get station title from user's station_ids mapping
        if (user.station_ids && typeof user.station_ids === 'object' && user.station_ids[stationId]) {
          station.stationTitle = user.station_ids[stationId];
        } else {
          station.stationTitle = stationId;
        }
        
        // Use real API for non-demo stations via chargenow-api module
        console.log(`[TAKE-HOME DEBUG] Fetching orders for ${stationId} from ChargeNow API`);
        
        const { response: orderResponse, result: orderData } = await chargenowAPI.fetchStationRentalHistory(stationId, sTime, eTime);
        
        if (!orderResponse.ok) {
          console.error(`[TAKE-HOME DEBUG] API request failed for station ${stationId}: ${orderResponse.status} ${orderResponse.statusText}`);
          throw new Error(`API request failed: ${orderResponse.status}`);
        }
        
        if (orderData.code !== 0) {
          console.error(`[TAKE-HOME DEBUG] API returned error for station ${stationId}:`, orderData.msg);
        }
        
        // Add order data to station
        station.orderData = {
          totalRecords: orderData.page?.total || 0,
          totalRevenue: 0,
          success: orderData.code === 0
        };
        
        // Calculate total revenue from all records
        if (orderData.page?.records && Array.isArray(orderData.page.records)) {
          station.orderData.totalRevenue = orderData.page.records.reduce((sum, record) => {
            return sum + (parseFloat(record.settledAmount) || 0);
          }, 0);
        }
        
        console.log(`[TAKE-HOME DEBUG] Station ${stationId}: ${station.orderData.totalRecords} orders, $${station.orderData.totalRevenue.toFixed(2)} revenue`);
        
        // Add small delay to prevent rate limiting (except for last station)
        if (i < filteredStations.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
        }
        
      } catch (error) {
        console.error(`[TAKE-HOME DEBUG] Error fetching orders for station ${station.pCabinetid}:`, error);
        station.orderData = {
          totalRecords: 0,
          totalRevenue: 0,
          success: false,
          error: error.message
        };
      }
    }
    
    console.log(`[TAKE-HOME DEBUG] Finished processing all ${filteredStations.length} stations`);
    
    // Calculate totals using the same logic as the main endpoint debugTotals
    let totalRevenue = 0;
    let totalRents = 0;
    
    console.log(`[TAKE-HOME DEBUG] Calculating totals from ${filteredStations.length} stations...`);
    
    filteredStations.forEach((station, index) => {
      const revenue = station.orderData?.totalRevenue || 0;
      const rents = station.orderData?.totalRecords || 0;
      
      // Apply same rounding as frontend (Math.round for individual stations)
      const roundedRevenue = Math.round(revenue);
      totalRevenue += roundedRevenue;
      totalRents += rents;
      
      console.log(`[TAKE-HOME DEBUG] Station ${index + 1}/${filteredStations.length} - ${station.pCabinetid}: $${revenue.toFixed(2)} -> $${roundedRevenue} (running total: $${totalRevenue})`);
    });
    
    console.log(`[TAKE-HOME DEBUG] Final calculation totals: $${totalRevenue} revenue, ${totalRents} rents from ${filteredStations.length} stations`);
    
    // Summary of station processing results
    const successfulStations = filteredStations.filter(s => s.orderData?.success !== false);
    const failedStations = filteredStations.filter(s => s.orderData?.success === false);
    
    console.log(`[TAKE-HOME DEBUG] Processing summary:`);
    console.log(`[TAKE-HOME DEBUG] - Total stations: ${filteredStations.length}`);
    console.log(`[TAKE-HOME DEBUG] - Successful: ${successfulStations.length}`);
    console.log(`[TAKE-HOME DEBUG] - Failed: ${failedStations.length}`);
    
    if (failedStations.length > 0) {
      console.log(`[TAKE-HOME DEBUG] Failed stations:`, failedStations.map(s => `${s.pCabinetid} (${s.orderData?.error || 'unknown error'})`));
    }
    
    // Calculate take-home based on CUUB being a Distributor (80%)
    const takeHomePercentage = 0.8;
    const takeHomeAmount = Math.ceil(totalRevenue * takeHomePercentage);
    
    console.log(`Take-home calculation for CUUB:`);
    console.log(`- Total revenue: $${totalRevenue}`);
    console.log(`- Total rents: ${totalRents}`);
    console.log(`- Take-home (80%): $${takeHomeAmount}`);
    
    res.json({
      success: true,
      username: 'CUUB',
      userType: 'Distributor',
      dateRange: {
        startDate: queryStartDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString('en-CA'),
        endDate: queryEndDate || new Date().toLocaleDateString('en-CA')
      },
      totalRevenue: totalRevenue, // Same calculation as dashboard
      totalRents: totalRents,     // Same calculation as dashboard
      takeHomeAmount: takeHomeAmount,
      calculation: {
        takeHomePercentage: takeHomePercentage,
        formula: `$${totalRevenue} × ${takeHomePercentage * 100}% = $${takeHomeAmount}`
      },
      source: 'internal_calculation',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});


// Test endpoint to get order list for a specific station
app.get('/api/test-orders/:stationId', async (req, res) => {
  try {
    const stationId = req.params.stationId;
    console.log('Testing order list API for station:', stationId);
    
    // Return demo data for demo stations
    if (stationId.startsWith('DEMO')) {
      const demoOrders = {
        code: 0,
        msg: "success",
        data: {
          records: [
            {
              orderId: "DEMO001_001",
              userId: "user123",
              stationId: stationId,
              amount: 2.50,
              status: "completed",
              createTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
              endTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() // 1 hour ago
            },
            {
              orderId: "DEMO001_002", 
              userId: "user456",
              stationId: stationId,
              amount: 3.00,
              status: "completed",
              createTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
              endTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() // 3 hours ago
            },
            {
              orderId: "DEMO001_003",
              userId: "user789", 
              stationId: stationId,
              amount: 2.75,
              status: "completed",
              createTime: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
              endTime: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() // 5 hours ago
            }
          ],
          totalRecords: 3,
          totalRevenue: 8.25
        }
      };
      
      console.log('Returning demo order data for station:', stationId);
      res.setHeader('Content-Type', 'application/json');
      return res.json(demoOrders);
    }
    
    // Set date range for the first day of current month to current date
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(1);
    // Set to start of day and end of day in local timezone
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    
    const sTime = startDate.toISOString().slice(0, 19).replace('T', ' ');
    const eTime = endDate.toISOString().slice(0, 19).replace('T', ' ');
    
    console.log('Making API call to order list via chargenow-api module');
    
    const { response, result: parsedData } = await chargenowAPI.fetchStationRentalHistory(stationId, sTime, eTime);
    
    console.log('Order list API response status:', response.status);
    
    // Set proper JSON headers and return formatted response
    res.setHeader('Content-Type', 'application/json');
    
    // Create a cleaner response structure
    const responseData = {
      success: true,
      stationId: stationId,
      status: response.status,
      responseSummary: {
        message: parsedData.msg || 'No message',
        code: parsedData.code || 'No code',
        totalRecords: parsedData.page?.total || 0,
        currentPage: parsedData.page?.current || 1,
        pageSize: parsedData.page?.size || 10
      },
      sampleRecord: parsedData.page?.records?.[0] ? {
        orderId: parsedData.page.records[0].pOrderid,
        batteryId: parsedData.page.records[0].pBatteryid,
        amount: parsedData.page.records[0].settledAmount,
        duration: parsedData.page.records[0].billingDuration,
        borrowTime: parsedData.page.records[0].pBorrowtime,
        returnTime: parsedData.page.records[0].pGhtime,
        shopName: parsedData.page.records[0].pShopName
      } : null,
      totalRecords: parsedData.page?.records?.length || 0,
      parsedData: parsedData,
      timestamp: new Date().toISOString()
    };
    
    // Return properly formatted JSON
    res.status(200).json(responseData);
  } catch (error) {
    console.error('Order list API call failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint to manually trigger the API call
app.get('/api/test-chargenow', async (req, res) => {
  try {
    console.log('Manual API call triggered');
    
    console.log('Making API call to ChargeNow via shared function');
    const result = await chargenowAPI.fetchChargeNowStations();
    
    console.log('Response result:', result);
    
    res.json({ 
      success: true, 
      data: result,
      status: response.status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Manual API call failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Dispense battery endpoint for Distributor users
app.post('/api/dispense-battery', verifyToken, async (req, res) => {
  try {
    const { stationId } = req.body;
    
    // Check if user is a Distributor
    if (req.user.userType !== 'Distributor') {
      return res.status(403).json({ 
        success: false, 
        error: 'Only Distributor users can dispense batteries',
        timestamp: new Date().toISOString()
      });
    }
    
    if (!stationId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Station ID is required',
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`Dispensing battery from station: ${stationId} for user: ${req.user.username}`);
    
    // Make the API call to dispense battery via chargenow-api module
    console.log('Making dispense API call via chargenow-api module for station:', stationId);
    
    const { response, result: parsedData } = await chargenowAPI.ejectBatteryByRepair(stationId, 0);
    
    console.log('Dispense API response status:', response.status);
    console.log('Dispense API response:', parsedData);
    
    // Check if the dispense was actually successful
    const isSuccessful = parsedData.code === 0;
    const actualMessage = parsedData.msg || 'No message from API';
    
    console.log('=== DISPENSE ANALYSIS ===');
    console.log('Station ID:', stationId);
    console.log('HTTP Status:', response.status);
    console.log('API Response Code:', parsedData.code);
    console.log('API Message:', actualMessage);
    console.log('Is Successful:', isSuccessful);
    console.log('Full API Response:', JSON.stringify(parsedData, null, 2));
    console.log('=== END DISPENSE ANALYSIS ===');
    
    // Set proper JSON headers and return formatted response
    res.setHeader('Content-Type', 'application/json');
    
    // Create a cleaner response structure
    const responseData = {
      success: isSuccessful,
      stationId: stationId,
      url: dispenseUrl,
      status: response.status,
      apiCode: parsedData.code,
      apiMessage: actualMessage,
      responseSummary: {
        message: actualMessage,
        code: parsedData.code || 'No code',
        success: isSuccessful
      },
      parsedData: parsedData,
      timestamp: new Date().toISOString()
    };
    
    // Return properly formatted JSON
    res.status(200).json(responseData);
  } catch (error) {
    console.error('Dispense battery API call failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint to check station data cache status and manually refresh
app.get('/api/station-cache-status', async (req, res) => {
  try {
    res.json({
      success: true,
      hasCachedData: !!latestStationData,
      lastFetchTime: lastFetchTime,
      dataSize: latestStationData ? latestStationData.length : 0,
      nextScheduledUpdate: new Date(Date.now() + 60000).toISOString(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting cache status:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint to manually trigger station data refresh
app.post('/api/refresh-stations', async (req, res) => {
  try {
    console.log('🔄 Manual station data refresh triggered');
    
    await updateStationData();
    
    res.json({
      success: true,
      message: 'Station data refresh completed',
      lastFetchTime: lastFetchTime,
      dataSize: latestStationData ? latestStationData.length : 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Manual refresh failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint to generate pre-filled login links for onboarding (username only)
app.get('/api/generate-login-link', async (req, res) => {
  try {
    const { username, baseUrl } = req.query;
    
    if (!username) {
      return res.status(400).json({
        success: false,
        error: 'Username is required',
        timestamp: new Date().toISOString()
      });
    }
    
    // Use provided baseUrl or default to current request origin
    const base = baseUrl || `${req.protocol}://${req.get('host')}`;
    
    // Create the pre-filled login URL (username only for security)
    const loginUrl = `${base}/login?username=${encodeURIComponent(username)}`;
    
    res.json({
      success: true,
      loginUrl: loginUrl,
      username: username,
      message: 'Pre-filled login link generated successfully (username only)',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating login link:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API endpoint to get battery rental information
app.get('/api/battery-rentals', async (req, res) => {
  try {
    const { page = 1, limit = 100 } = req.query;
    
    console.log('Fetching battery rental information...');
    const { response, result } = await chargenowAPI.fetchBatteryRentalInfo(parseInt(page), parseInt(limit));
    
    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: 'Failed to fetch battery rental data',
        status: response.status
      });
    }
    
    // Format the response similar to existing patterns
    const responseData = {
      success: true,
      url: `https://developer.chargenow.top/cdb-open-api/v1/order/list?page=${page}&limit=${limit}`,
      status: response.status,
      responseSummary: {
        message: result.msg || 'No message',
        code: result.code || 'No code',
        totalRecords: result.page?.total || 0,
        currentPage: result.page?.current || 1,
        pageSize: result.page?.size || 10
      },
      totalRecords: result.page?.records?.length || 0,
      records: result.page?.records || [],
      timestamp: new Date().toISOString()
    };
    
    res.status(200).json(responseData);
  } catch (error) {
    console.error('Battery rental API call failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API endpoint to get station availability data
app.get('/api/station-availability/:stationId', async (req, res) => {
  try {
    const { stationId } = req.params;
    
    if (!stationId) {
      return res.status(400).json({
        success: false,
        error: 'Station ID is required'
      });
    }
    
    console.log('Fetching station availability for:', stationId);
    
    // Return demo data for demo stations
    if (stationId.startsWith('DEMO')) {
      const demoAvailability = {
        success: true,
        stationId: stationId,
        url: `demo://station-availability/${stationId}`,
        status: 200,
        availability: {
          deviceId: stationId,
          status: "online",
          batterySlots: [
            { slot: 1, status: "available", batteryLevel: 85 },
            { slot: 2, status: "available", batteryLevel: 92 },
            { slot: 3, status: "charging", batteryLevel: 45 },
            { slot: 4, status: "available", batteryLevel: 78 },
            { slot: 5, status: "available", batteryLevel: 88 },
            { slot: 6, status: "charging", batteryLevel: 23 }
          ]
        }
      };
      return res.json(demoAvailability);
    }
    
    const { response, result } = await chargenowAPI.fetchStationAvailability(stationId);
    
    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: 'Failed to fetch station availability data',
        status: response.status
      });
    }
    
    // Format the response similar to existing patterns
    const responseData = {
      success: true,
      stationId: stationId,
      url: `https://developer.chargenow.top/cdb-open-api/v1/rent/cabinet/query?deviceId=${stationId}`,
      status: response.status,
      availability: {
        available: result.data?.cabinet?.emptySlots || 0,
        occupied: result.data?.cabinet?.busySlots || 0,
        total: (result.data?.cabinet?.emptySlots || 0) + (result.data?.cabinet?.busySlots || 0)
      },
      rawData: result.data,
      timestamp: new Date().toISOString()
    };
    
    res.status(200).json(responseData);
  } catch (error) {
    console.error('Station availability API call failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API endpoint to get availability for multiple stations
app.get('/api/stations-availability', async (req, res) => {
  try {
    const { stationIds } = req.query;
    
    if (!stationIds) {
      return res.status(400).json({
        success: false,
        error: 'Station IDs are required (comma-separated)'
      });
    }
    
    const stationIdArray = stationIds.split(',').map(id => id.trim());
    console.log('Fetching availability for multiple stations:', stationIdArray);
    
    // Fetch availability for all stations in parallel
    const stationPromises = stationIdArray.map(async (id) => {
      try {
        const { response, result } = await chargenowAPI.fetchStationAvailability(id);
        return {
          id,
          available: result.data?.cabinet?.emptySlots || 0,
          occupied: result.data?.cabinet?.busySlots || 0,
          total: (result.data?.cabinet?.emptySlots || 0) + (result.data?.cabinet?.busySlots || 0),
          error: !response.ok,
          status: response.status
        };
      } catch (error) {
        return {
          id,
          available: 0,
          occupied: 0,
          total: 0,
          error: true,
          errorMessage: error.message
        };
      }
    });
    
    const results = await Promise.all(stationPromises);
    
    const responseData = {
      success: true,
      stationCount: stationIdArray.length,
      stations: results,
      timestamp: new Date().toISOString()
    };
    
    res.status(200).json(responseData);
  } catch (error) {
    console.error('Multiple stations availability API call failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Export the Express app for Vercel
module.exports = app;

// Start the server only if not in Vercel environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Error handling for uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });
}