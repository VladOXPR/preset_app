// Vercel KV (Redis) database for persistent storage
const { kv } = require('@vercel/kv');

// Simple database functions using Vercel KV
async function createUser(username, phone, password) {
  try {
    console.log('Creating user:', username);
    
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
    const user = await kv.get(`user:${username}`);
    return user;
  } catch (error) {
    console.error('Error getting user by username:', error);
    throw error;
  }
}

async function getAllUsers() {
  try {
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

// Initialize database (no-op for Vercel KV)
async function initDatabase() {
  console.log('Vercel KV database initialized');
}

// Initialize database when module is loaded
initDatabase()
  .then(() => console.log('Vercel KV database ready'))
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