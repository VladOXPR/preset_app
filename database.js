// In-memory database for Vercel deployment
// This is a temporary solution - consider using Vercel Postgres for production

// In-memory storage
let users = [];
let messages = [];

// Initialize database (no-op for in-memory)
function initDatabase() {
  console.log('Initializing in-memory database...');
  return Promise.resolve();
}

// User functions
function createUser(username, phone, password) {
  return new Promise((resolve, reject) => {
    try {
      // Check if user already exists
      const existingUser = users.find(u => u.username === username);
      if (existingUser) {
        reject(new Error('Username already exists'));
        return;
      }

      const newUser = {
        id: users.length + 1,
        username,
        phone,
        password,
        created_at: new Date().toISOString()
      };

      users.push(newUser);
      console.log('User created:', username);
      resolve(newUser);
    } catch (error) {
      reject(error);
    }
  });
}

function getUserByUsername(username) {
  return new Promise((resolve, reject) => {
    try {
      const user = users.find(u => u.username === username);
      resolve(user || null);
    } catch (error) {
      reject(error);
    }
  });
}

function getAllUsers() {
  return new Promise((resolve, reject) => {
    try {
      resolve(users.map(u => ({ id: u.id, username: u.username, phone: u.phone, created_at: u.created_at })));
    } catch (error) {
      reject(error);
    }
  });
}

function getUserById(id) {
  return new Promise((resolve, reject) => {
    try {
      const user = users.find(u => u.id === id);
      resolve(user || null);
    } catch (error) {
      reject(error);
    }
  });
}

// Message functions
function saveMessage(fromUser, toUser, text) {
  return new Promise((resolve, reject) => {
    try {
      const message = {
        id: messages.length + 1,
        from_user: fromUser,
        to_user: toUser,
        text,
        timestamp: new Date().toISOString()
      };

      messages.push(message);
      console.log('Message saved:', { from: fromUser, to: toUser, text });
      resolve(message);
    } catch (error) {
      reject(error);
    }
  });
}

function getChatHistory(user1, user2) {
  return new Promise((resolve, reject) => {
    try {
      const chatMessages = messages.filter(m => 
        (m.from_user === user1 && m.to_user === user2) ||
        (m.from_user === user2 && m.to_user === user1)
      ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      console.log('Chat history retrieved:', chatMessages.length, 'messages');
      resolve(chatMessages);
    } catch (error) {
      reject(error);
    }
  });
}

// Admin functions
function deleteUser(userId) {
  return new Promise((resolve, reject) => {
    try {
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex === -1) {
        reject(new Error('User not found'));
        return;
      }

      const deletedUser = users.splice(userIndex, 1)[0];
      
      // Also delete all messages from/to this user
      messages = messages.filter(m => m.from_user !== deletedUser.username && m.to_user !== deletedUser.username);
      
      console.log('User deleted:', deletedUser.username);
      resolve(deletedUser);
    } catch (error) {
      reject(error);
    }
  });
}

// Initialize database when module is loaded
initDatabase()
  .then(() => console.log('In-memory database initialized'))
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