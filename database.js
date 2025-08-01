// Database configuration - supports both Neon Postgres and JSON files
let sql;
let dbType;

// Check if we have a DATABASE_URL (Neon Postgres) or use JSON for local development
if (process.env.DATABASE_URL) {
  // Use Neon Postgres for production
  const { neon } = require('@neondatabase/serverless');
  sql = neon(process.env.DATABASE_URL);
  dbType = 'neon';
  console.log('Using Neon PostgreSQL database');
} else {
  // Use JSON files for local development
  const fs = require('fs');
  const path = require('path');
  
  // Database file paths
  const DATA_DIR = path.join(__dirname, 'data');
  const USERS_FILE = path.join(DATA_DIR, 'users.json');
  const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
  
  // Ensure data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  
  // Initialize JSON files if they don't exist
  function initJsonFiles() {
    if (!fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
    }
    if (!fs.existsSync(MESSAGES_FILE)) {
      fs.writeFileSync(MESSAGES_FILE, JSON.stringify([], null, 2));
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
      // Create users table for Neon with bio field
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          phone VARCHAR(20) NOT NULL,
          password VARCHAR(255) NOT NULL,
          bio TEXT DEFAULT '',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      
      // Create messages table for Neon
      await sql`
        CREATE TABLE IF NOT EXISTS messages (
          id SERIAL PRIMARY KEY,
          from_user VARCHAR(255) NOT NULL,
          to_user VARCHAR(255) NOT NULL,
          text TEXT NOT NULL,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
async function createUser(username, phone, password, bio = '') {
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

      // Create new user
      const newUser = await sql`
        INSERT INTO users (username, phone, password, bio)
        VALUES (${username}, ${phone}, ${password}, ${bio})
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
        bio: bio || '',
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
      return users.length > 0 ? users[0] : null;
    } else {
      // JSON file implementation
      const fs = require('fs');
      const path = require('path');
      const USERS_FILE = path.join(__dirname, 'data', 'users.json');
      
      const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
      return users.find(user => user.username === username) || null;
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
        SELECT id, username, phone, bio, created_at FROM users
      `;
      // Ensure all users have a bio field, even if NULL in database
      return users.map(user => ({
        ...user,
        bio: user.bio || ''
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
        bio: user.bio || '',
        created_at: user.created_at
      }));
    }
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
}

async function getUserById(id) {
  try {
    if (dbType === 'neon') {
      const users = await sql`
        SELECT * FROM users WHERE id = ${id}
      `;
      return users.length > 0 ? users[0] : null;
    } else {
      // JSON file implementation
      const fs = require('fs');
      const path = require('path');
      const USERS_FILE = path.join(__dirname, 'data', 'users.json');
      
      const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
      return users.find(user => user.id === parseInt(id)) || null;
    }
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
}

async function saveMessage(fromUser, toUser, text) {
  try {
    if (dbType === 'neon') {
      const message = await sql`
        INSERT INTO messages (from_user, to_user, text)
        VALUES (${fromUser}, ${toUser}, ${text})
        RETURNING *
      `;
      
      console.log('Message saved:', { from: fromUser, to: toUser, text });
      return message[0];
    } else {
      // JSON file implementation
      const fs = require('fs');
      const path = require('path');
      const MESSAGES_FILE = path.join(__dirname, 'data', 'messages.json');
      
      const messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
      
      const newMessage = {
        id: messages.length > 0 ? Math.max(...messages.map(m => m.id)) + 1 : 1,
        from_user: fromUser,
        to_user: toUser,
        text,
        timestamp: new Date().toISOString()
      };
      
      messages.push(newMessage);
      fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
      
      console.log('Message saved:', { from: fromUser, to: toUser, text });
      return newMessage;
    }
  } catch (error) {
    console.error('Error saving message:', error);
    throw error;
  }
}

async function getChatHistory(user1, user2) {
  try {
    if (dbType === 'neon') {
      const messages = await sql`
        SELECT * FROM messages 
        WHERE (from_user = ${user1} AND to_user = ${user2})
           OR (from_user = ${user2} AND to_user = ${user1})
        ORDER BY timestamp ASC
      `;
      
      console.log('Chat history retrieved:', messages.length, 'messages');
      return messages;
    } else {
      // JSON file implementation
      const fs = require('fs');
      const path = require('path');
      const MESSAGES_FILE = path.join(__dirname, 'data', 'messages.json');
      
      const messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
      
      const chatMessages = messages.filter(message => 
        (message.from_user === user1 && message.to_user === user2) ||
        (message.from_user === user2 && message.to_user === user1)
      );
      
      // Sort by timestamp
      chatMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      console.log('Chat history retrieved:', chatMessages.length, 'messages');
      return chatMessages;
    }
  } catch (error) {
    console.error('Error getting chat history:', error);
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
      const MESSAGES_FILE = path.join(__dirname, 'data', 'messages.json');
      
      const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
      const messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
      
      // Find user to delete
      const userToDelete = users.find(user => user.id === parseInt(userId));
      if (!userToDelete) {
        throw new Error('User not found');
      }
      
      // Delete all messages from/to this user
      const filteredMessages = messages.filter(message => 
        message.from_user !== userToDelete.username && 
        message.to_user !== userToDelete.username
      );
      
      // Delete user
      const filteredUsers = users.filter(user => user.id !== parseInt(userId));
      
      // Write updated data
      fs.writeFileSync(USERS_FILE, JSON.stringify(filteredUsers, null, 2));
      fs.writeFileSync(MESSAGES_FILE, JSON.stringify(filteredMessages, null, 2));
      
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
  getUserById,
  saveMessage,
  getChatHistory,
  deleteUser
}; 