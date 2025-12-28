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
const supplierAPI = require('./supplierApi');
const maintenance = require('./maintenance');

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

// Function to fetch and update station data (ChargeNow only - Energo stations are fetched on-demand)
async function updateStationData() {
  try {
    console.log('🔄 Scheduled station data update started at:', new Date().toISOString());
    
    const result = await supplierAPI.fetchChargeNowStations();
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

// Start maintenance monitoring system
maintenance.startMaintenanceMonitoring();

// Start Energo API keep-alive service
supplierAPI.startEnergoKeepAlive();

// ========================================
// BACKGROUND API TOKEN TESTING SERVICE
// ========================================

// Store test results in memory
let tokenTestResults = {
  requestCount: 0,
  successCount: 0,
  failureCount: 0,
  lastSuccessTime: null,
  firstFailureTime: null,
  recentLogs: [], // Keep last 100 entries
  isRunning: true,
  testInterval: 60000, // 1 minute default
  lastTestTime: null
};
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

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Parse station IDs from comma-separated string or array
 */
function parseStationIds(stationIds) {
  if (!stationIds) return [];
  if (typeof stationIds === 'string') {
    return stationIds.split(',').map(id => id.trim()).filter(id => id);
  }
  return Array.isArray(stationIds) ? stationIds : [];
}

/**
 * Hash password using bcrypt
 */
function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

/**
 * Create JWT authentication token
 */
function createAuthToken(username, userType = null) {
  const payload = { username };
  if (userType) payload.userType = userType;
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

/**
 * Set authentication cookie with standard options
 */
function setAuthCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax',
    path: '/'
  });
}

/**
 * Get date range in API format (sTime, eTime)
 * @param {string} startDateStr - Optional start date string (YYYY-MM-DD)
 * @param {string} endDateStr - Optional end date string (YYYY-MM-DD)
 * @returns {Object} { sTime, eTime } - Formatted date strings
 */
function getDateRange(startDateStr, endDateStr) {
  let startDate, endDate;
  
  if (startDateStr && endDateStr) {
    // Custom date range from query parameters
    startDate = new Date(startDateStr + 'T00:00:00');
    endDate = new Date(endDateStr + 'T23:59:59');
  } else {
    // Default: first day of current month to today
    endDate = new Date();
    startDate = new Date();
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
  }
  
  return {
    sTime: startDate.toISOString().slice(0, 19).replace('T', ' '),
    eTime: endDate.toISOString().slice(0, 19).replace('T', ' ')
  };
}

/**
 * Check if user already exists
 */
async function checkUserExists(username) {
  const existingUser = await db.getUserByUsername(username);
  return !!existingUser;
}

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

// Get background token test results - returns stored data
app.get('/api/test-token-status', (req, res) => {
  try {
    const successRate = tokenTestResults.requestCount > 0 
      ? ((tokenTestResults.successCount / tokenTestResults.requestCount) * 100).toFixed(2) 
      : 0;
    
    res.json({ 
      success: true,
      stats: {
        requestCount: tokenTestResults.requestCount,
        successCount: tokenTestResults.successCount,
        failureCount: tokenTestResults.failureCount,
        successRate: parseFloat(successRate),
        lastSuccessTime: tokenTestResults.lastSuccessTime,
        firstFailureTime: tokenTestResults.firstFailureTime,
        lastTestTime: tokenTestResults.lastTestTime,
        isRunning: tokenTestResults.isRunning,
        testInterval: tokenTestResults.testInterval
      },
      recentLogs: tokenTestResults.recentLogs.slice(0, 50), // Return last 50 logs
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting token test status:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get test status',
      message: error.message
    });
  }
});

// Trigger an immediate token test (optional - for manual testing)
app.post('/api/test-token-now', async (req, res) => {
  try {
    console.log('Manual token test triggered from UI');
    await performTokenTest();
    
    // Return the latest result
    const latestLog = tokenTestResults.recentLogs[0];
    res.json({ 
      success: latestLog.status === 'success',
      result: latestLog,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error triggering manual test:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to perform test',
      message: error.message
    });
  }
});

// ========================================
// CHARGENOW API WRAPPER FUNCTIONS
// ========================================
// These functions are now imported from supplierApi.js module
// This makes it easier to switch suppliers in the future
// ========================================

// Static files are served by express.static middleware above

// Static page routes - serve HTML files
app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/html/login.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/html/signup.html'));
});

app.get('/home', verifyToken, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/html/home.html'));
});

app.get('/qr-generator', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/html/qr-generator.html'));
});

app.get('/key', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/html/key.html'));
});

// Energo token management endpoints
const energoConfigPath = path.join(__dirname, 'data/energo-config.json');

// Check if we're running on Vercel
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;

// Cache removed - tokens are now always updated in environment variables

/**
 * Update ENERGO_TOKEN environment variable in Vercel via Management API
 * Requires: VERCEL_TOKEN, VERCEL_PROJECT_ID (and optionally VERCEL_TEAM_ID)
 */
async function updateVercelEnvironmentVariable(token) {
  const vercelToken = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID;
  
  if (!vercelToken || !projectId) {
    throw new Error('VERCEL_TOKEN and VERCEL_PROJECT_ID must be set to update token on Vercel');
  }
  
  const url = teamId 
    ? `https://api.vercel.com/v10/projects/${projectId}/env?teamId=${teamId}`
    : `https://api.vercel.com/v10/projects/${projectId}/env`;
  
  // First, get existing env vars to find the ENERGO_TOKEN entry
  const getResponse = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${vercelToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!getResponse.ok) {
    const errorText = await getResponse.text();
    throw new Error(`Failed to fetch environment variables: ${getResponse.status} ${errorText}`);
  }
  
  const envVars = await getResponse.json();
  const energoTokenVar = envVars.envs?.find(env => env.key === 'ENERGO_TOKEN');
  
  let updateUrl;
  if (energoTokenVar) {
    // Update existing variable
    updateUrl = teamId
      ? `https://api.vercel.com/v10/projects/${projectId}/env/${energoTokenVar.id}?teamId=${teamId}`
      : `https://api.vercel.com/v10/projects/${projectId}/env/${energoTokenVar.id}`;
    
    const updateResponse = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${vercelToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        value: token,
        type: 'encrypted',
        target: ['production', 'preview', 'development']
      })
    });
    
    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Failed to update environment variable: ${updateResponse.status} ${errorText}`);
    }
  } else {
    // Create new variable
    const createResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${vercelToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        key: 'ENERGO_TOKEN',
        value: token,
        type: 'encrypted',
        target: ['production', 'preview', 'development']
      })
    });
    
    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Failed to create environment variable: ${createResponse.status} ${errorText}`);
    }
  }
  
  return true;
}

// Get current Energo token
app.get('/api/energo-token', async (req, res) => {
  try {
    // Priority 1: Environment variable (always used when available)
    if (process.env.ENERGO_TOKEN) {
      return res.json({ 
        token: process.env.ENERGO_TOKEN,
        source: 'environment'
      });
    }
    
    // Priority 2: Config file (local development or initial load)
    try {
      const configData = await fs.readFile(energoConfigPath, 'utf8');
      const config = JSON.parse(configData);
      return res.json({ 
        token: config.token,
        source: 'file'
      });
    } catch (error) {
      return res.status(404).json({ error: 'Token not found' });
    }
  } catch (error) {
    console.error('Error reading Energo config:', error);
    res.status(500).json({ error: 'Failed to read token' });
  }
});

// Update Energo token
app.post('/api/energo-token', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Token is required' });
    }
    
    // Always try to update environment variable via Vercel API (works in all stages)
    try {
      await updateVercelEnvironmentVariable(token);
      console.log('✅ Energo token updated via Vercel API');
      return res.json({ 
        success: true, 
        message: 'Token updated successfully via Vercel API.',
        source: 'vercel-api'
      });
    } catch (error) {
      console.error('Error updating token via Vercel API:', error);
      // Continue to try file update even if Vercel API fails
    }
    
    // Local development: Update config file
    try {
      let config;
      try {
        const configData = await fs.readFile(energoConfigPath, 'utf8');
        config = JSON.parse(configData);
      } catch (error) {
        // If file doesn't exist, create default config
        config = { oid: '3526' };
      }
      
      config.token = token;
      await fs.writeFile(energoConfigPath, JSON.stringify(config, null, 2), 'utf8');
      console.log('✅ Energo token updated in file');
    } catch (writeError) {
      // File write failed, but env var update was attempted
      console.log('✅ Energo token update attempted (file write failed)');
    }
    
    res.json({ 
      success: true, 
      message: 'Token updated successfully',
      source: 'file'
    });
  } catch (error) {
    console.error('Error updating Energo token:', error);
    res.status(500).json({ error: 'Failed to update token: ' + error.message });
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
  
  res.sendFile(path.join(__dirname, 'public/html/admin.html'));
});

app.get('/newuser', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/html/newuser.html'));
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
    if (await checkUserExists(username)) {
      console.log('Signup failed - user already exists:', username);
      return res.redirect('/signup?error=exists');
    }
    
    console.log('Creating new user:', username);
    const hash = hashPassword(password);
    const stationIdsArray = parseStationIds(stationIds);
    await db.createUser(username, phone, hash, stationIdsArray);
    
    console.log('User created successfully, generating JWT token');
    const token = createAuthToken(username);
    
    // Set JWT token as HTTP-only cookie
    setAuthCookie(res, token);
    
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
    if (await checkUserExists(username)) {
      console.log('User already exists:', username);
      return res.redirect('/newuser?error=exists');
    }
    
    console.log('Creating new user:', username);
    const hash = hashPassword(password);
    const stationIdsArray = parseStationIds(stationIds);
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
    const token = createAuthToken(username, user.userType);
    
    // Set JWT token as HTTP-only cookie
    setAuthCookie(res, token);
    
    console.log('JWT token set, redirecting to home');
    res.redirect('/home');
  } catch (error) {
    console.error('Login error:', error);
    res.redirect('/login?error=server');
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
    
    res.json({ username: user.username, phone: user.phone, userType: user.userType });
  } catch (error) {
    console.error('GET /me - Error:', error);
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
      const stationIdsArray = parseStationIds(stationIds);
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
    
    const { id, name, address, coordinates } = req.body;
    
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
    
    // If ID is being changed, check if new ID already exists
    if (id && id !== stationId) {
      const existingStation = stations.find(s => s.id === id);
      if (existingStation) {
        return res.status(409).json({ error: 'Station with this ID already exists' });
      }
    }
    
    // Update station fields
    if (id !== undefined && id !== stationId) {
      stations[stationIndex].id = id;
    }
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

// Make initial API call when server starts (ChargeNow only)
console.log('Making initial API call to ChargeNow...');
supplierAPI.fetchChargeNowStations()
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
    
    // Determine which suppliers the user needs based on their station assignments
    const userStationIds = Array.isArray(user.station_ids) ? user.station_ids : Object.keys(user.station_ids || {});
    
    let hasChargeNowStations = false;
    let hasEnergoStations = false;
    let energoStationIds = [];
    let chargenowStationIds = [];
    
    if (userStationIds.length > 0) {
      try {
        const stationsData = await fs.readFile(stationsFilePath, 'utf8');
        const stations = JSON.parse(stationsData);
        
        // Categorize user's stations by supplier
        userStationIds.forEach(stationId => {
          const station = stations.find(s => s.id === stationId);
          if (station) {
            if (station.supplier === 'energo') {
              hasEnergoStations = true;
              energoStationIds.push(stationId);
            } else {
              hasChargeNowStations = true;
              chargenowStationIds.push(stationId);
            }
          } else {
            // If station not found in stations.json, assume ChargeNow (default)
            hasChargeNowStations = true;
            chargenowStationIds.push(stationId);
          }
        });
        
        console.log(`📊 User station breakdown: ${chargenowStationIds.length} ChargeNow, ${energoStationIds.length} Energo`);
      } catch (error) {
        console.error('Error checking stations.json for supplier:', error);
        // Fallback: assume all are ChargeNow
        hasChargeNowStations = true;
        chargenowStationIds = userStationIds;
      }
    }
    
    // Use demo data for demo user, otherwise fetch from appropriate suppliers
    let result;
    if (req.user.username === 'demo') {
      console.log('🎭 Using demo station data for demo user');
      result = supplierAPI.generateDemoStationData();
    } else {
      // Fetch stations from both suppliers if user has stations from both
      const allStations = [];
      
      // Fetch ChargeNow stations if user has any
      if (hasChargeNowStations) {
        console.log('🔌 Fetching ChargeNow stations...');
        let chargeNowResult;
        try {
          if (latestStationData && lastFetchTime) {
            console.log('📋 Using cached ChargeNow station data from:', lastFetchTime);
            chargeNowResult = latestStationData;
          } else {
            console.log('🔄 No cached data available, fetching fresh ChargeNow station data...');
            chargeNowResult = await supplierAPI.fetchChargeNowStations();
          }
          
          try {
            const parsed = typeof chargeNowResult === 'string' ? JSON.parse(chargeNowResult) : chargeNowResult;
            if (parsed && parsed.data && Array.isArray(parsed.data)) {
              allStations.push(...parsed.data);
              console.log(`✅ Added ${parsed.data.length} ChargeNow station(s)`);
            }
          } catch (e) {
            console.error('❌ Error parsing ChargeNow station data:', e);
          }
        } catch (error) {
          console.error('❌ Error fetching ChargeNow stations:', error.message);
          // Will fall through to cache check below
        }
      }
      
      // Fetch Energo stations if user has any
      if (hasEnergoStations && energoStationIds.length > 0) {
        console.log(`⚡ Fetching ${energoStationIds.length} Energo station(s)...`);
        try {
          const stationPromises = energoStationIds.map(stationId => 
            supplierAPI.fetchEnergoStation(stationId, req.user.username).catch(error => {
              console.error(`❌ Error fetching Energo station ${stationId}:`, error.message);
              return null; // Return null on error
            })
          );
          const stationResults = await Promise.all(stationPromises);
          
          stationResults.forEach((stationJson, index) => {
            if (stationJson) {
              try {
                const parsed = JSON.parse(stationJson);
                if (parsed.data && Array.isArray(parsed.data)) {
                  allStations.push(...parsed.data);
                  console.log(`✅ Added ${parsed.data.length} Energo station(s) from response ${index + 1}`);
                }
              } catch (e) {
                console.error(`❌ Error parsing Energo station data ${index + 1}:`, e);
              }
            }
          });
        } catch (error) {
          console.error('❌ Error in Energo station fetch batch:', error.message);
          // Continue to cache check below
        }
      }
      
      
      console.log(`📦 Total stations fetched: ${allStations.length} (${hasChargeNowStations ? 'ChargeNow + ' : ''}${hasEnergoStations ? 'Energo' : ''})`);
      result = JSON.stringify({ code: 0, msg: "success", data: allStations });
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
      let userStationIdsForFilter = [];
      if (typeof user.station_ids === 'object' && user.station_ids !== null) {
        if (Array.isArray(user.station_ids)) {
          // Legacy array format
          userStationIdsForFilter = user.station_ids;
        } else {
          // New dictionary format - extract keys
          userStationIdsForFilter = Object.keys(user.station_ids);
        }
      }
      
      console.log('User station permissions length:', userStationIdsForFilter.length);
      
      if (userStationIdsForFilter.length > 0) {
        // Filter to only show stations the user has access to
        // Note: Energo stations are already filtered (we only fetch user's stations),
        // but ChargeNow stations need filtering from the full list
        filteredStations = stationsArray.filter(station => {
          const stationId = station.pCabinetid || station.id;
          console.log(`Checking station: ${stationId} (type: ${typeof stationId}) against user permissions: ${JSON.stringify(userStationIdsForFilter)}`);
          
          // Check for exact match first
          let hasAccess = userStationIdsForFilter.includes(stationId);
          
          // If no exact match, try case-insensitive comparison
          if (!hasAccess) {
            hasAccess = userStationIdsForFilter.some(permittedId => 
              permittedId.toString().toLowerCase() === stationId.toString().toLowerCase()
            );
          }
          
          console.log(`Station ${stationId} access: ${hasAccess}`);
          return hasAccess;
        });
        console.log(`Filtered stations: ${filteredStations.length} out of ${stationsArray.length}`);
        console.log('Filtered station IDs:', filteredStations.map(s => s.pCabinetid || s.id));
      } else {
        console.log('User has no station permissions in userStationIdsForFilter, will check cache or user permissions');
        // Don't set filteredStations = [] here, let the fallback logic handle it
      }
      
      if (filteredStations.length > 0) {
        
        // Fetch order data for each filtered station
        console.log('Fetching order data for filtered stations...');
        
        // Get date range from query parameters or use default
        const { sTime, eTime } = getDateRange(req.query.startDate, req.query.endDate);
        console.log(`Using date range: ${sTime} to ${eTime}`);
        
        for (let station of filteredStations) {
          try {
            const stationId = station.pCabinetid || station.id;
            console.log(`Fetching orders for station: ${stationId}`);
            
            
            // Add station title - prefer user's custom title, then API title, then station ID
            if (typeof user.station_ids === 'object' && user.station_ids !== null && !Array.isArray(user.station_ids) && user.station_ids[stationId]) {
              // User has a custom title for this station - use it
              station.stationTitle = user.station_ids[stationId];
            } else if (station.stationTitle) {
              // Use title from API (e.g., Energo shopName or ChargeNow stationTitle)
              // Already set, keep it
            } else {
              // Fallback to station ID if no title available
              station.stationTitle = stationId;
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
              let orderDataSuccess = false;
              let orderData = null;
              
              try {
                // Use unified API that automatically routes to correct supplier
                const { response, result: orderDataResult } = await supplierAPI.fetchStationRentalHistory(
                  req.user.username,
                  stationId,
                  sTime,
                  eTime
                );
                
                orderData = orderDataResult;
                orderDataSuccess = orderData.code === 0;
              } catch (error) {
                console.error(`❌ Error fetching orders for station ${stationId}:`, error.message);
                orderDataSuccess = false;
                station.orderData = {
                  totalRecords: 0,
                  totalRevenue: 0,
                  success: false,
                  error: error.message
                };
              }
              
              // If we got here, API call succeeded
              // Add order data to station
              station.orderData = {
                totalRecords: 0,
                totalRevenue: 0,
                success: orderDataSuccess
              };
              
              // For Energo: Use totals directly from API (already calculated correctly)
              // For ChargeNow: Calculate from records
              if (orderData.page?.total !== undefined && orderData.page?.totalRevenue !== undefined) {
                // API provides totals directly (Energo format)
                // Use the totals from the API response
                station.orderData.totalRecords = orderData.page.total || 0;
                station.orderData.totalRevenue = orderData.page.totalRevenue || 0;
                console.log(`[ENERGO] Using API totals: ${station.orderData.totalRecords} rents, $${station.orderData.totalRevenue.toFixed(2)} revenue`);
              } else if (orderData.page?.records && Array.isArray(orderData.page.records)) {
                // For ChargeNow, calculate from records
                const validRecords = orderData.page.records.filter(record => {
                  const settledAmount = parseFloat(record.settledAmount || 0);
                  return settledAmount > 0;
                });
                
                // Count only valid records (non-zero settledAmount)
                station.orderData.totalRecords = validRecords.length;
                
                // Calculate total revenue from valid records only
                station.orderData.totalRevenue = validRecords.reduce((sum, record) => {
                  return sum + (parseFloat(record.settledAmount) || 0);
                }, 0);
                console.log(`[CHARGENOW] Calculated from records: ${station.orderData.totalRecords} rents, $${station.orderData.totalRevenue.toFixed(2)} revenue`);
              }
              
              
              console.log(`[MAIN] Station ${stationId}: ${station.orderData.totalRecords} orders, $${station.orderData.totalRevenue.toFixed(2)} revenue (rounded: $${Math.round(station.orderData.totalRevenue)})`);
            }
            
          } catch (error) {
            console.error(`Error processing station ${station.pCabinetid || station.id}:`, error);
            station.orderData = {
              totalRecords: 0,
              totalRevenue: 0,
              success: false,
              error: error.message
            };
          }
        }
        
      } else {
        console.log('User has no station permissions in filteredStations check, will check cache or user permissions');
        // Don't set filteredStations = [] here, let the fallback logic handle it
      }
    } else {
      console.log('No stations found in API response, will use cache or user permissions');
      // Don't do anything here, let the fallback logic handle it
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
    
    // Make the API call to dispense battery via supplier-api module
    console.log('Making dispense API call via supplier-api module for station:', stationId);
    
    const { response, result: parsedData } = await supplierAPI.ejectBatteryByRepair(stationId, 0);
    
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