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
    
    const result = await fetchChargeNowStations();
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

// Shared function to fetch stations from ChargeNow API
async function fetchChargeNowStations() {
  const myHeaders = new Headers();
  myHeaders.append("Authorization", "Basic VmxhZFZhbGNoa292OlZWMTIxMg==");
  
  const requestOptions = {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow'
  };
  
  console.log('Making API call to ChargeNow: /cabinet/getAllDevice');
  const response = await fetch("https://developer.chargenow.top/cdb-open-api/v1/cabinet/getAllDevice", requestOptions);
  const result = await response.text();
  
  console.log('ChargeNow API response status:', response.status);
  return result;
}

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

app.get('/login', (req, res) => {
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
          <input type="text" id="username" name="username" required>
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

app.get('/admin', (req, res) => {
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
    <!-- Password Protection Screen -->
    <div id="password-screen" class="password-screen">
      <div class="password-container">
        <h1>Admin Access</h1>
        <p>Enter password to access admin panel</p>
        <div class="password-input-group">
          <input type="password" id="admin-password" class="password-input" placeholder="Enter password">
          <button id="submit-password" class="primary">Access Admin</button>
        </div>
        <div id="password-error" class="password-error" style="display: none;">Incorrect password</div>
        <a href="/home" class="secondary">Back to Home</a>
      </div>
    </div>
    
    <!-- Admin Content (Hidden until password is correct) -->
    <div id="admin-content" class="admin-content" style="display: none;">
      <div class="home-top">
        <h1>Admin Panel</h1>
      </div>
      <div id="user-list"></div>
      <div class="button-row">
        <button id="addUserBtn" class="primary">Add New User</button>
        <a href="/home" class="secondary">Back to Home</a>
      </div>
    </div>
  </div>
  <script src="/js/deployment-manager.js"></script>
  <script src="/js/admin.js"></script>
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
    
    // Parse station IDs from comma-separated string or use empty array
    const stationIdsArray = stationIds ? stationIds.split(',').map(id => id.trim()).filter(id => id) : [];
    
    console.log('Updating stations for user ID:', userId, 'with stations:', stationIdsArray);
    const updatedUser = await db.updateUserStations(userId, stationIdsArray);
    
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





// Make initial API call when server starts
console.log('Making initial API call to ChargeNow...');
fetchChargeNowStations()
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
    console.log('User station_ids contains BJH09881:', user.station_ids.includes('BJH09881'));
    console.log('User station_ids array:', JSON.stringify(user.station_ids));
    console.log('=== END DEBUG ===');
    
    // Use cached station data if available, otherwise fetch new data
    let result;
    if (latestStationData && lastFetchTime) {
      console.log('📋 Using cached station data from:', lastFetchTime);
      result = latestStationData;
    } else {
      console.log('🔄 No cached data available, fetching fresh station data...');
      result = await fetchChargeNowStations();
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
      console.log('User station permissions length:', user.station_ids ? user.station_ids.length : 'undefined');
      
      if (user.station_ids && user.station_ids.length > 0) {
        // Filter to only show stations the user has access to
        filteredStations = stationsArray.filter(station => {
          const stationId = station.pCabinetid || station.id;
          console.log(`Checking station: ${stationId} (type: ${typeof stationId}) against user permissions: ${JSON.stringify(user.station_ids)}`);
          
          // Check for exact match first
          let hasAccess = user.station_ids.includes(stationId);
          
          // If no exact match, try case-insensitive comparison
          if (!hasAccess) {
            hasAccess = user.station_ids.some(permittedId => 
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
          // Use custom date range from frontend
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
          sTime = startDate.toISOString().slice(0, 19).replace('T', ' ');
          eTime = endDate.toISOString().slice(0, 19).replace('T', ' ');
          console.log(`Using default date range: ${sTime} to ${eTime}`);
        }
        
        for (let station of filteredStations) {
          try {
            const stationId = station.pCabinetid || station.id;
            console.log(`Fetching orders for station: ${stationId}`);
            
            const orderListUrl = `https://developer.chargenow.top/cdb-open-api/v1/order/list?page=1&limit=100&sTime=${sTime}&eTime=${eTime}&pCabinetid=${stationId}`;
            
            const myHeaders = new Headers();
            myHeaders.append("Authorization", "Basic VmxhZFZhbGNoa292OlZWMTIxMg==");
            
            const requestOptions = {
              method: 'GET',
              headers: myHeaders,
              redirect: 'follow'
            };
            
            const orderResponse = await fetch(orderListUrl, requestOptions);
            const orderResult = await orderResponse.text();
            
            let orderData;
            try {
              orderData = JSON.parse(orderResult);
            } catch (e) {
              orderData = { code: -1, msg: 'Failed to parse order data' };
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
            
            console.log(`Station ${stationId}: ${station.orderData.totalRecords} orders, $${station.orderData.totalRevenue.toFixed(2)} revenue`);
            
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
    
    res.json({ 
      success: true, 
      data: filteredStations,
      userPermissions: user.station_ids,
      totalStations: Array.isArray(formattedData) ? formattedData.length : 0,
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

// Test endpoint to get order list for a specific station
app.get('/api/test-orders/:stationId', async (req, res) => {
  try {
    const stationId = req.params.stationId;
    console.log('Testing order list API for station:', stationId);
    
    const myHeaders = new Headers();
    myHeaders.append("Authorization", "Basic VmxhZFZhbGNoa292OlZWMTIxMg==");
    
    const requestOptions = {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow'
    };
    
    // Set date range for the first day of current month to current date
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(1);
    
    const sTime = startDate.toISOString().slice(0, 19).replace('T', ' ');
    const eTime = endDate.toISOString().slice(0, 19).replace('T', ' ');
    
    const orderListUrl = `https://developer.chargenow.top/cdb-open-api/v1/order/list?page=1&limit=100&sTime=${sTime}&eTime=${eTime}&pCabinetid=${stationId}`;
    
    console.log('Making API call to order list:', orderListUrl);
    
    const response = await fetch(orderListUrl, requestOptions);
    const result = await response.text();
    
    console.log('Order list API response status:', response.status);
    console.log('Order list API response:', result);
    
    // Parse the response as JSON for better structure
    let parsedData;
    try {
      parsedData = JSON.parse(result);
    } catch (e) {
      parsedData = { rawResponse: result, parseError: e.message };
    }
    
    // Set proper JSON headers and return formatted response
    res.setHeader('Content-Type', 'application/json');
    
    // Create a cleaner response structure
    const responseData = {
      success: true,
      stationId: stationId,
      url: orderListUrl,
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
    const result = await fetchChargeNowStations();
    
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
    
    // Prepare the request to ChargeNow API
    const myHeaders = new Headers();
    myHeaders.append("Authorization", "Basic VmxhZFZhbGNoa292OlZWMTIxMg==");
    
    const requestOptions = {
      method: 'POST',
      headers: myHeaders,
      redirect: 'follow'
    };
    
    // Make the API call to dispense battery
    const dispenseUrl = `https://developer.chargenow.top/cdb-open-api/v1/cabinet/ejectByRepair?cabinetid=${stationId}&slotNum=0`;
    console.log('Making dispense API call to:', dispenseUrl);
    console.log('Request headers:', Object.fromEntries(myHeaders.entries()));
    
    const response = await fetch(dispenseUrl, requestOptions);
    const result = await response.text();
    
    console.log('Dispense API response status:', response.status);
    console.log('Dispense API response headers:', Object.fromEntries(response.headers.entries()));
    console.log('Dispense API response body:', result);
    
    // Parse the response as JSON for better structure
    let parsedData;
    try {
      parsedData = JSON.parse(result);
      console.log('Successfully parsed dispense response as JSON');
    } catch (e) {
      parsedData = { rawResponse: result, parseError: e.message };
      console.log('Failed to parse dispense response as JSON:', e.message);
    }
    
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