// Neon Postgres database for persistent storage
const { neon } = require('@neondatabase/serverless');

// Get database connection
const sql = neon(process.env.DATABASE_URL);

// Initialize database tables
async function initDatabase() {
  try {
    console.log('Initializing Neon Postgres database...');
    
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20) NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Create messages table
    await sql`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        from_user VARCHAR(255) NOT NULL,
        to_user VARCHAR(255) NOT NULL,
        text TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// User functions
async function createUser(username, phone, password) {
  try {
    console.log('Creating user:', username);
    
    // Check if user already exists
    const existingUser = await sql`
      SELECT * FROM users WHERE username = ${username}
    `;
    
    if (existingUser.length > 0) {
      throw new Error('Username already exists');
    }

    // Create new user
    const newUser = await sql`
      INSERT INTO users (username, phone, password)
      VALUES (${username}, ${phone}, ${password})
      RETURNING *
    `;
    
    console.log('User created successfully:', username);
    return newUser[0];
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

async function getUserByUsername(username) {
  try {
    const users = await sql`
      SELECT * FROM users WHERE username = ${username}
    `;
    return users.length > 0 ? users[0] : null;
  } catch (error) {
    console.error('Error getting user by username:', error);
    throw error;
  }
}

async function getAllUsers() {
  try {
    const users = await sql`
      SELECT id, username, phone, created_at FROM users
    `;
    return users;
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
}

async function getUserById(id) {
  try {
    const users = await sql`
      SELECT * FROM users WHERE id = ${id}
    `;
    return users.length > 0 ? users[0] : null;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
}

async function saveMessage(fromUser, toUser, text) {
  try {
    const message = await sql`
      INSERT INTO messages (from_user, to_user, text)
      VALUES (${fromUser}, ${toUser}, ${text})
      RETURNING *
    `;
    
    console.log('Message saved:', { from: fromUser, to: toUser, text });
    return message[0];
  } catch (error) {
    console.error('Error saving message:', error);
    throw error;
  }
}

async function getChatHistory(user1, user2) {
  try {
    const messages = await sql`
      SELECT * FROM messages 
      WHERE (from_user = ${user1} AND to_user = ${user2})
         OR (from_user = ${user2} AND to_user = ${user1})
      ORDER BY timestamp ASC
    `;
    
    console.log('Chat history retrieved:', messages.length, 'messages');
    return messages;
  } catch (error) {
    console.error('Error getting chat history:', error);
    throw error;
  }
}

async function deleteUser(userId) {
  try {
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
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

// Initialize database when module is loaded
initDatabase()
  .then(() => console.log('Neon Postgres database ready'))
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