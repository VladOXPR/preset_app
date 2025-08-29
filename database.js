// Database configuration - JSON files only for simplicity
const fs = require('fs');
const path = require('path');

// Database file paths
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize JSON files if they don't exist
function initJsonFiles() {
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
  }
}

// Helper functions to read/write JSON files
function readJsonFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return [];
  }
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    throw error;
  }
}

console.log('Using JSON database for local development');
initJsonFiles();

// Initialize database tables
async function initDatabase() {
  try {
    console.log('Initializing JSON database...');
    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// User functions
async function createUser(username, phone, password, stationIds = [], stationTitles = {}) {
  try {
    console.log('Creating user:', username);
    
    const users = readJsonFile(USERS_FILE);
    
    // Check if user already exists
    const existingUser = users.find(user => user.username === username);
    if (existingUser) {
      throw new Error('Username already exists');
    }

    // Create new user
    const newUser = {
      id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
      username,
      phone,
      password,
      station_ids: stationIds || [],
      station_titles: stationTitles || {},
      created_at: new Date().toISOString()
    };
    
    users.push(newUser);
    writeJsonFile(USERS_FILE, users);
    
    console.log('User created successfully:', username);
    return newUser;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

async function getUserByUsername(username) {
  try {
    const users = readJsonFile(USERS_FILE);
    const user = users.find(user => user.username === username);
    if (user) {
      // Ensure station_ids and station_titles are always arrays/objects
      user.station_ids = user.station_ids || [];
      user.station_titles = user.station_titles || {};
    }
    return user || null;
  } catch (error) {
    console.error('Error getting user by username:', error);
    throw error;
  }
}

async function getAllUsers() {
  try {
    const users = readJsonFile(USERS_FILE);
    // Return users without password field for security
    return users.map(user => ({
      id: user.id,
      username: user.username,
      phone: user.phone,
      station_ids: user.station_ids || [],
      station_titles: user.station_titles || {},
      created_at: user.created_at
    }));
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
}

async function getAllUsersWithPasswords() {
  try {
    const users = readJsonFile(USERS_FILE);
    // Return users with password field for admin panel
    return users.map(user => ({
      id: user.id,
      username: user.username,
      phone: user.phone,
      password: user.password,
      station_ids: user.station_ids || [],
      station_titles: user.station_titles || {},
      created_at: user.created_at
    }));
  } catch (error) {
    console.error('Error getting all users with passwords:', error);
    throw error;
  }
}

async function getUserById(id) {
  try {
    const users = readJsonFile(USERS_FILE);
    const user = users.find(user => user.id === parseInt(id));
    if (user) {
      // Ensure station_ids and station_titles are always arrays/objects
      user.station_ids = user.station_ids || [];
      user.station_titles = user.station_titles || {};
    }
    return user || null;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
}

// Function to update user's station assignments
async function updateUserStations(userId, stationIds) {
  try {
    const users = readJsonFile(USERS_FILE);
    const userIndex = users.findIndex(user => user.id === parseInt(userId));
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    users[userIndex].station_ids = stationIds || [];
    writeJsonFile(USERS_FILE, users);
    
    return users[userIndex];
  } catch (error) {
    console.error('Error updating user stations:', error);
    throw error;
  }
}

async function deleteUser(userId) {
  try {
    const users = readJsonFile(USERS_FILE);
    
    // Find user to delete
    const userToDelete = users.find(user => user.id === parseInt(userId));
    if (!userToDelete) {
      throw new Error('User not found');
    }
    
    // Delete user
    const filteredUsers = users.filter(user => user.id !== parseInt(userId));
    
    // Write updated data
    writeJsonFile(USERS_FILE, filteredUsers);
    
    console.log('User deleted:', userToDelete.username);
    return userToDelete;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

// Initialize database when module is loaded
initDatabase()
  .then(() => console.log('Database ready'))
  .catch(console.error);

module.exports = {
  createUser,
  getUserByUsername,
  getAllUsers,
  getAllUsersWithPasswords,
  getUserById,
  updateUserStations,
  deleteUser
}; 