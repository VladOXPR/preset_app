// JSON-based database for local development
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

// Initialize database
function initDatabase() {
  console.log('Initializing JSON database...');
  initJsonFiles();
  console.log('JSON database ready');
}

// User functions
async function createUser(username, phone, password, bio = '') {
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
      bio: bio || '',
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
    return users.find(user => user.username === username) || null;
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
      bio: user.bio || '',
      created_at: user.created_at
    }));
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
}

async function getUserById(id) {
  try {
    const users = readJsonFile(USERS_FILE);
    return users.find(user => user.id === parseInt(id)) || null;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
}

async function saveMessage(fromUser, toUser, text) {
  try {
    const messages = readJsonFile(MESSAGES_FILE);
    
    const newMessage = {
      id: messages.length > 0 ? Math.max(...messages.map(m => m.id)) + 1 : 1,
      from_user: fromUser,
      to_user: toUser,
      text,
      timestamp: new Date().toISOString()
    };
    
    messages.push(newMessage);
    writeJsonFile(MESSAGES_FILE, messages);
    
    console.log('Message saved:', { from: fromUser, to: toUser, text });
    return newMessage;
  } catch (error) {
    console.error('Error saving message:', error);
    throw error;
  }
}

async function getChatHistory(user1, user2) {
  try {
    const messages = readJsonFile(MESSAGES_FILE);
    
    const chatMessages = messages.filter(message => 
      (message.from_user === user1 && message.to_user === user2) ||
      (message.from_user === user2 && message.to_user === user1)
    );
    
    // Sort by timestamp
    chatMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    console.log('Chat history retrieved:', chatMessages.length, 'messages');
    return chatMessages;
  } catch (error) {
    console.error('Error getting chat history:', error);
    throw error;
  }
}

async function deleteUser(userId) {
  try {
    const users = readJsonFile(USERS_FILE);
    const messages = readJsonFile(MESSAGES_FILE);
    
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
    writeJsonFile(USERS_FILE, filteredUsers);
    writeJsonFile(MESSAGES_FILE, filteredMessages);
    
    console.log('User deleted:', userToDelete.username);
    return userToDelete;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

// Initialize database when module is loaded
initDatabase();

module.exports = {
  createUser,
  getUserByUsername,
  getAllUsers,
  getUserById,
  saveMessage,
  getChatHistory,
  deleteUser
}; 