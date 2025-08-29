// Database configuration - supports both Neon Postgres and JSON files
let sql;
let dbType;

// Check if we have a DATABASE_URL (Neon Postgres) or use JSON for local development
if (process.env.DATABASE_URL) {
  // Use Neon Postgres for production/Vercel
  const { neon } = require('@neondatabase/serverless');
  sql = neon(process.env.DATABASE_URL);
  dbType = 'neon';
  console.log('Using Neon PostgreSQL database');
  console.log('Environment:', process.env.NODE_ENV || 'development');
} else {
  // Use JSON files for local development
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
  
  // Create a simple SQL interface for JSON files
  sql = {
    async query(strings, ...values) {
      return new Promise((resolve, reject) => {
        let query = strings[0];
        for (let i = 0; i < values.length; i++) {
          query += '?' + strings[i + 1];
        }
        
        // This is a mock implementation for JSON files
        // The actual database functions will handle JSON directly
        resolve([]);
      });
    }
  };
  
  // Override the template literal function for JSON files
  sql.__proto__.exec = function(strings, ...values) {
    return this.query(strings, ...values);
  };
  
  dbType = 'json';
  console.log('Using JSON database for local development');
  initJsonFiles();
}

// Initialize database tables
async function initDatabase() {
  try {
    console.log(`Initializing ${dbType} database...`);
    
    if (dbType === 'neon') {
      // Create users table for Neon with station_ids and station_titles fields
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          phone VARCHAR(20) NOT NULL,
          password VARCHAR(255) NOT NULL,
          station_ids TEXT DEFAULT '[]',
          station_titles TEXT DEFAULT '{}',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
    }
    
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
    
    if (dbType === 'neon') {
      // Check if user already exists
      const existingUser = await sql`
        SELECT * FROM users WHERE username = ${username}
      `;
      
      if (existingUser.length > 0) {
        throw new Error('Username already exists');
      }

      // Create new user with station_ids and station_titles as JSON strings
      const stationIdsJson = JSON.stringify(stationIds);
      const stationTitlesJson = JSON.stringify(stationTitles);
      const newUser = await sql`
        INSERT INTO users (username, phone, password, station_ids, station_titles)
        VALUES (${username}, ${phone}, ${password}, ${stationIdsJson}, ${stationTitlesJson})
        RETURNING *
      `;
      
      console.log('User created successfully:', username);
      return newUser[0];
    } else {
      // JSON file implementation
      const fs = require('fs');
      const path = require('path');
      const USERS_FILE = path.join(__dirname, 'data', 'users.json');
      
      const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
      
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
      fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
      
      console.log('User created successfully:', username);
      return newUser;
    }
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

async function getUserByUsername(username) {
  try {
    if (dbType === 'neon') {
      const users = await sql`
        SELECT * FROM users WHERE username = ${username}
      `;
      if (users.length > 0) {
        const user = users[0];
        // Parse station_ids and station_titles from JSON strings
        try {
          user.station_ids = JSON.parse(user.station_ids || '[]');
        } catch (e) {
          user.station_ids = [];
        }
        try {
          user.station_titles = JSON.parse(user.station_titles || '{}');
        } catch (e) {
          user.station_titles = {};
        }
        return user;
      }
      return null;
    } else {
      // JSON file implementation
      const fs = require('fs');
      const path = require('path');
      const USERS_FILE = path.join(__dirname, 'data', 'users.json');
      
      const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
      const user = users.find(user => user.username === username);
      if (user) {
        // Ensure station_ids and station_titles are always arrays/objects
        user.station_ids = user.station_ids || [];
        user.station_titles = user.station_titles || {};
      }
      return user || null;
    }
  } catch (error) {
    console.error('Error getting user by username:', error);
    throw error;
  }
}

async function getAllUsers() {
  try {
    if (dbType === 'neon') {
      const users = await sql`
        SELECT id, username, phone, station_ids, station_titles, created_at FROM users
      `;
      // Parse station_ids and station_titles from JSON strings
      return users.map(user => ({
        ...user,
        station_ids: (() => {
          try {
            return JSON.parse(user.station_ids || '[]');
          } catch (e) {
            return [];
          }
        })(),
        station_titles: (() => {
          try {
            return JSON.parse(user.station_titles || '{}');
          } catch (e) {
            return {};
          }
        })()
      }));
    } else {
      // JSON file implementation
      const fs = require('fs');
      const path = require('path');
      const USERS_FILE = path.join(__dirname, 'data', 'users.json');
      
      const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
      // Return users without password field for security
      return users.map(user => ({
        id: user.id,
        username: user.username,
        phone: user.phone,
        station_ids: user.station_ids || [],
        station_titles: user.station_titles || {},
        created_at: user.created_at
      }));
    }
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
}

async function getAllUsersWithPasswords() {
  try {
    if (dbType === 'neon') {
      const users = await sql`
        SELECT id, username, phone, password, station_ids, station_titles, created_at FROM users
      `;
      // Parse station_ids and station_titles from JSON strings
      return users.map(user => ({
        ...user,
        station_ids: (() => {
          try {
            return JSON.parse(user.station_ids || '[]');
          } catch (e) {
            return [];
          }
        })(),
        station_titles: (() => {
          try {
            return JSON.parse(user.station_titles || '{}');
          } catch (e) {
            return {};
          }
        })()
      }));
    } else {
      // JSON file implementation
      const fs = require('fs');
      const path = require('path');
      const USERS_FILE = path.join(__dirname, 'data', 'users.json');
      
      const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
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
    }
  } catch (error) {
    console.error('Error getting all users with passwords:', error);
    throw error;
  }
}

async function getUserById(id) {
  try {
    if (dbType === 'neon') {
      const users = await sql`
        SELECT * FROM users WHERE id = ${id}
      `;
      if (users.length > 0) {
        const user = users[0];
        // Parse station_ids and station_titles from JSON strings
        try {
          user.station_ids = JSON.parse(user.station_ids || '[]');
        } catch (e) {
          user.station_ids = [];
        }
        try {
          user.station_titles = JSON.parse(user.station_titles || '{}');
        } catch (e) {
          user.station_titles = {};
        }
        return user;
      }
      return null;
    } else {
      // JSON file implementation
      const fs = require('fs');
      const path = require('path');
      const USERS_FILE = path.join(__dirname, 'data', 'users.json');
      
      const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
      const user = users.find(user => user.id === parseInt(id));
      if (user) {
        // Ensure station_ids and station_titles are always arrays/objects
        user.station_ids = user.station_ids || [];
        user.station_titles = user.station_titles || {};
      }
      return user || null;
    }
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
}

// Function to update user's station assignments
async function updateUserStations(userId, stationIds) {
  try {
    if (dbType === 'neon') {
      const stationIdsJson = JSON.stringify(stationIds);
      const result = await sql`
        UPDATE users 
        SET station_ids = ${stationIdsJson}
        WHERE id = ${userId}
        RETURNING *
      `;
      
      if (result.length > 0) {
        const user = result[0];
        // Parse station_ids and station_titles from JSON strings
        try {
          user.station_ids = JSON.parse(user.station_ids || '[]');
        } catch (e) {
          user.station_ids = [];
        }
        try {
          user.station_titles = JSON.parse(user.station_titles || '{}');
        } catch (e) {
          user.station_titles = {};
        }
        return user;
      }
      return null;
    } else {
      // JSON file implementation
      const fs = require('fs');
      const path = require('path');
      const USERS_FILE = path.join(__dirname, 'data', 'users.json');
      
      const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
      const userIndex = users.findIndex(user => user.id === parseInt(userId));
      
      if (userIndex === -1) {
        throw new Error('User not found');
      }
      
      users[userIndex].station_ids = stationIds || [];
      fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
      
      return users[userIndex];
    }
  } catch (error) {
    console.error('Error updating user stations:', error);
    throw error;
  }
}

async function deleteUser(userId) {
  try {
    if (dbType === 'neon') {
      // Get user first
      const users = await sql`
        SELECT * FROM users WHERE id = ${userId}
      `;
      
      if (users.length === 0) {
        throw new Error('User not found');
      }
      
      const userToDelete = users[0];
      
      // Delete all messages from/to this user
      await sql`
        DELETE FROM messages 
        WHERE from_user = ${userToDelete.username} OR to_user = ${userToDelete.username}
      `;
      
      // Delete user
      await sql`
        DELETE FROM users WHERE id = ${userId}
      `;
      
      console.log('User deleted:', userToDelete.username);
      return userToDelete;
    } else {
      // JSON file implementation
      const fs = require('fs');
      const path = require('path');
      const USERS_FILE = path.join(__dirname, 'data', 'users.json');
      
      const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
      
      // Find user to delete
      const userToDelete = users.find(user => user.id === parseInt(userId));
      if (!userToDelete) {
        throw new Error('User not found');
      }
      
      // Delete user
      const filteredUsers = users.filter(user => user.id !== parseInt(userId));
      
      // Write updated data
      fs.writeFileSync(USERS_FILE, JSON.stringify(filteredUsers, null, 2));
      
      console.log('User deleted:', userToDelete.username);
      return userToDelete;
    }
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