// MongoDB database for Vercel deployment
const { MongoClient } = require('mongodb');

// MongoDB connection string (you'll need to set this as environment variable)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/preset_app';

let client;
let db;

// Initialize database connection
async function initDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db();
    console.log('Connected to MongoDB successfully');
    
    // Create indexes for better performance
    await db.collection('users').createIndex({ username: 1 }, { unique: true });
    await db.collection('messages').createIndex({ from_user: 1, to_user: 1 });
    
    console.log('Database indexes created');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

// User functions
async function createUser(username, phone, password) {
  try {
    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ username });
    if (existingUser) {
      throw new Error('Username already exists');
    }

    const newUser = {
      username,
      phone,
      password,
      created_at: new Date()
    };

    const result = await db.collection('users').insertOne(newUser);
    console.log('User created:', username);
    return { ...newUser, id: result.insertedId };
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

async function getUserByUsername(username) {
  try {
    const user = await db.collection('users').findOne({ username });
    return user;
  } catch (error) {
    console.error('Error getting user by username:', error);
    throw error;
  }
}

async function getAllUsers() {
  try {
    const users = await db.collection('users').find({}, { 
      projection: { password: 0 } 
    }).toArray();
    return users;
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
}

async function getUserById(id) {
  try {
    const user = await db.collection('users').findOne({ _id: id });
    return user;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
}

// Message functions
async function saveMessage(fromUser, toUser, text) {
  try {
    const message = {
      from_user: fromUser,
      to_user: toUser,
      text,
      timestamp: new Date()
    };

    const result = await db.collection('messages').insertOne(message);
    console.log('Message saved:', { from: fromUser, to: toUser, text });
    return { ...message, id: result.insertedId };
  } catch (error) {
    console.error('Error saving message:', error);
    throw error;
  }
}

async function getChatHistory(user1, user2) {
  try {
    const messages = await db.collection('messages')
      .find({
        $or: [
          { from_user: user1, to_user: user2 },
          { from_user: user2, to_user: user1 }
        ]
      })
      .sort({ timestamp: 1 })
      .toArray();

    console.log('Chat history retrieved:', messages.length, 'messages');
    return messages;
  } catch (error) {
    console.error('Error getting chat history:', error);
    throw error;
  }
}

// Admin functions
async function deleteUser(userId) {
  try {
    const user = await db.collection('users').findOne({ _id: userId });
    if (!user) {
      throw new Error('User not found');
    }

    // Delete user
    await db.collection('users').deleteOne({ _id: userId });
    
    // Delete all messages from/to this user
    await db.collection('messages').deleteMany({
      $or: [
        { from_user: user.username },
        { to_user: user.username }
      ]
    });
    
    console.log('User deleted:', user.username);
    return user;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

// Initialize database when module is loaded
initDatabase()
  .then(() => console.log('MongoDB database initialized'))
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