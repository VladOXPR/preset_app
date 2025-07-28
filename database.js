// Vercel KV (Redis) database for persistent storage
const { kv } = require('@vercel/kv');

// In-memory fallback storage
let users = [];
let messages = [];
let useInMemory = false;

// Check if Vercel KV is available
async function checkKVConnection() {
  try {
    await kv.ping();
    console.log('Vercel KV connection successful');
    useInMemory = false;
    return true;
  } catch (error) {
    console.log('Vercel KV not available, using in-memory storage:', error.message);
    useInMemory = true;
    return false;
  }
}

// Simple database functions using Vercel KV
async function createUser(username, phone, password) {
  try {
    console.log('Creating user:', username);
    
    if (useInMemory) {
      // In-memory fallback
      const existingUser = users.find(u => u.username === username);
      if (existingUser) {
        throw new Error('Username already exists');
      }

      const newUser = {
        id: Date.now().toString(),
        username,
        phone,
        password,
        created_at: new Date().toISOString()
      };

      users.push(newUser);
      console.log('User created (in-memory):', username);
      return newUser;
    }

    // Vercel KV path
    // Check if user already exists
    const existingUser = await kv.get(`user:${username}`);
    if (existingUser) {
      throw new Error('Username already exists');
    }

    const newUser = {
      id: Date.now().toString(),
      username,
      phone,
      password,
      created_at: new Date().toISOString()
    };

    // Store user data
    await kv.set(`user:${username}`, newUser);
    await kv.sadd('users', username);
    
    console.log('User created successfully:', username);
    return newUser;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

async function getUserByUsername(username) {
  try {
    if (useInMemory) {
      // In-memory fallback
      const user = users.find(u => u.username === username);
      return user || null;
    }

    // Vercel KV path
    const user = await kv.get(`user:${username}`);
    return user;
  } catch (error) {
    console.error('Error getting user by username:', error);
    throw error;
  }
}

async function getAllUsers() {
  try {
    if (useInMemory) {
      // In-memory fallback
      return users.map(u => ({ id: u.id, username: u.username, phone: u.phone, created_at: u.created_at }));
    }

    // Vercel KV path
    const usernames = await kv.smembers('users');
    const users = [];
    
    for (const username of usernames) {
      const user = await kv.get(`user:${username}`);
      if (user) {
        // Don't return password
        const { password, ...userWithoutPassword } = user;
        users.push(userWithoutPassword);
      }
    }
    
    return users;
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
}

async function getUserById(id) {
  try {
    if (useInMemory) {
      // In-memory fallback
      const user = users.find(u => u.id === id);
      return user || null;
    }

    // Vercel KV path
    // Get all users and find by ID
    const usernames = await kv.smembers('users');
    for (const username of usernames) {
      const user = await kv.get(`user:${username}`);
      if (user && user.id === id) {
        return user;
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
}

async function saveMessage(fromUser, toUser, text) {
  try {
    const message = {
      id: Date.now().toString(),
      from_user: fromUser,
      to_user: toUser,
      text,
      timestamp: new Date().toISOString()
    };

    if (useInMemory) {
      // In-memory fallback
      messages.push(message);
      console.log('Message saved (in-memory):', { from: fromUser, to: toUser, text });
      return message;
    }

    // Vercel KV path
    // Store message
    await kv.set(`message:${message.id}`, message);
    
    // Add to chat history for both users
    await kv.lpush(`chat:${fromUser}:${toUser}`, message.id);
    await kv.lpush(`chat:${toUser}:${fromUser}`, message.id);
    
    console.log('Message saved:', { from: fromUser, to: toUser, text });
    return message;
  } catch (error) {
    console.error('Error saving message:', error);
    throw error;
  }
}

async function getChatHistory(user1, user2) {
  try {
    if (useInMemory) {
      // In-memory fallback
      const chatMessages = messages.filter(m => 
        (m.from_user === user1 && m.to_user === user2) ||
        (m.from_user === user2 && m.to_user === user1)
      ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      console.log('Chat history retrieved (in-memory):', chatMessages.length, 'messages');
      return chatMessages;
    }

    // Vercel KV path
    // Get message IDs for this chat
    const messageIds = await kv.lrange(`chat:${user1}:${user2}`, 0, -1);
    const messages = [];
    
    // Get actual message data
    for (const messageId of messageIds) {
      const message = await kv.get(`message:${messageId}`);
      if (message) {
        messages.push(message);
      }
    }
    
    // Sort by timestamp
    messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    console.log('Chat history retrieved:', messages.length, 'messages');
    return messages;
  } catch (error) {
    console.error('Error getting chat history:', error);
    throw error;
  }
}

async function deleteUser(userId) {
  try {
    if (useInMemory) {
      // In-memory fallback
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex === -1) {
        throw new Error('User not found');
      }

      const deletedUser = users.splice(userIndex, 1)[0];
      
      // Also delete all messages from/to this user
      messages = messages.filter(m => m.from_user !== deletedUser.username && m.to_user !== deletedUser.username);
      
      console.log('User deleted (in-memory):', deletedUser.username);
      return deletedUser;
    }

    // Vercel KV path
    // Find user by ID
    const usernames = await kv.smembers('users');
    let userToDelete = null;
    
    for (const username of usernames) {
      const user = await kv.get(`user:${username}`);
      if (user && user.id === userId) {
        userToDelete = user;
        break;
      }
    }
    
    if (!userToDelete) {
      throw new Error('User not found');
    }

    // Delete user
    await kv.del(`user:${userToDelete.username}`);
    await kv.srem('users', userToDelete.username);
    
    // Delete all messages from/to this user
    const allUsernames = await kv.smembers('users');
    for (const username of allUsernames) {
      await kv.del(`chat:${userToDelete.username}:${username}`);
      await kv.del(`chat:${username}:${userToDelete.username}`);
    }
    
    console.log('User deleted:', userToDelete.username);
    return userToDelete;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

// Initialize database
async function initDatabase() {
  console.log('Initializing database...');
  await checkKVConnection();
  console.log('Database ready');
}

// Initialize database when module is loaded
initDatabase()
  .then(() => console.log('Database initialization complete'))
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