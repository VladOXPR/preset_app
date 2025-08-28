#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname);
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

// Helper functions
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
    console.log(`✅ Data written to ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`❌ Error writing ${filePath}:`, error);
  }
}

// Database management functions
function resetDatabase() {
  console.log('🔄 Resetting database...');
  
  // Reset users with demo data
  const demoUsers = [
    {
      id: 1,
      username: "admin",
      phone: "+1234567890",
      password: bcrypt.hashSync("password", 10),
      station_ids: ["ST001", "ST002", "ST003", "ST004", "ST005"],
      created_at: "2024-01-01T00:00:00.000Z"
    },
    {
      id: 2,
      username: "john_doe",
      phone: "+1987654321",
      password: bcrypt.hashSync("password", 10),
      station_ids: ["ST001", "ST002"],
      created_at: "2024-01-02T10:30:00.000Z"
    },
    {
      id: 3,
      username: "jane_smith",
      phone: "+1555123456",
      password: bcrypt.hashSync("password", 10),
      station_ids: ["ST003", "ST004"],
      created_at: "2024-01-03T14:15:00.000Z"
    },
    {
      id: 4,
      username: "bob_wilson",
      phone: "+1777888999",
      password: bcrypt.hashSync("password", 10),
      station_ids: ["ST005"],
      created_at: "2024-01-04T09:45:00.000Z"
    },
    {
      id: 5,
      username: "alice_brown",
      phone: "+1666777888",
      password: bcrypt.hashSync("password", 10),
      station_ids: ["ST001", "ST003", "ST005"],
      created_at: "2024-01-05T16:20:00.000Z"
    }
  ];
  
  // Reset messages with demo data
  const demoMessages = [
    {
      id: 1,
      from_user: "john_doe",
      to_user: "jane_smith",
      text: "Hey Jane! How's it going?",
      timestamp: "2024-01-06T10:00:00.000Z"
    },
    {
      id: 2,
      from_user: "jane_smith",
      to_user: "john_doe",
      text: "Hi John! I'm doing great, thanks for asking. How about you?",
      timestamp: "2024-01-06T10:05:00.000Z"
    },
    {
      id: 3,
      from_user: "john_doe",
      to_user: "jane_smith",
      text: "Pretty good! Working on some new projects. Want to grab coffee later?",
      timestamp: "2024-01-06T10:10:00.000Z"
    },
    {
      id: 4,
      from_user: "jane_smith",
      to_user: "john_doe",
      text: "That sounds great! How about 3 PM at the usual place?",
      timestamp: "2024-01-06T10:15:00.000Z"
    },
    {
      id: 5,
      from_user: "bob_wilson",
      to_user: "alice_brown",
      text: "Alice, did you get the project files I sent?",
      timestamp: "2024-01-06T11:00:00.000Z"
    },
    {
      id: 6,
      from_user: "alice_brown",
      to_user: "bob_wilson",
      text: "Yes, I got them! Thanks Bob. I'll review them this afternoon.",
      timestamp: "2024-01-06T11:30:00.000Z"
    },
    {
      id: 7,
      from_user: "bob_wilson",
      to_user: "alice_brown",
      text: "Perfect! Let me know if you need any clarification.",
      timestamp: "2024-01-06T11:35:00.000Z"
    },
    {
      id: 8,
      from_user: "admin",
      to_user: "john_doe",
      text: "Welcome to the platform, John! Let me know if you need any help.",
      timestamp: "2024-01-06T12:00:00.000Z"
    },
    {
      id: 9,
      from_user: "john_doe",
      to_user: "admin",
      text: "Thanks admin! The platform looks great so far.",
      timestamp: "2024-01-06T12:05:00.000Z"
    },
    {
      id: 10,
      from_user: "jane_smith",
      to_user: "alice_brown",
      text: "Hey Alice! How's the new project coming along?",
      timestamp: "2024-01-06T14:00:00.000Z"
    },
    {
      id: 11,
      from_user: "alice_brown",
      to_user: "jane_smith",
      text: "It's going well! We're making good progress. How about yours?",
      timestamp: "2024-01-06T14:15:00.000Z"
    },
    {
      id: 12,
      from_user: "jane_smith",
      to_user: "alice_brown",
      text: "Same here! We should collaborate on something soon.",
      timestamp: "2024-01-06T14:20:00.000Z"
    }
  ];
  
  writeJsonFile(USERS_FILE, demoUsers);
  writeJsonFile(MESSAGES_FILE, demoMessages);
  
  console.log('✅ Database reset complete!');
  console.log('📝 Demo users created: admin, john_doe, jane_smith, bob_wilson, alice_brown');
  console.log('🔑 All users have password: "password"');
}

function showStats() {
  console.log('📊 Database Statistics:');
  
  const users = readJsonFile(USERS_FILE);
  const messages = readJsonFile(MESSAGES_FILE);
  
  console.log(`👥 Users: ${users.length}`);
  users.forEach(user => {
    console.log(`   - ${user.username} (${user.phone})`);
  });
  
  console.log(`💬 Messages: ${messages.length}`);
  
  // Count messages per user
  const messageCounts = {};
  messages.forEach(msg => {
    messageCounts[msg.from_user] = (messageCounts[msg.from_user] || 0) + 1;
    messageCounts[msg.to_user] = (messageCounts[msg.to_user] || 0) + 1;
  });
  
  console.log('📈 Message activity:');
  Object.entries(messageCounts).forEach(([user, count]) => {
    console.log(`   - ${user}: ${count} messages`);
  });
}

function addUser(username, phone, password, stationIds = []) {
  const users = readJsonFile(USERS_FILE);
  
  // Check if user exists
  if (users.find(u => u.username === username)) {
    console.log(`❌ User "${username}" already exists`);
    return;
  }
  
  const newUser = {
    id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
    username,
    phone,
    password: bcrypt.hashSync(password, 10),
    station_ids: stationIds,
    created_at: new Date().toISOString()
  };
  
  users.push(newUser);
  writeJsonFile(USERS_FILE, users);
  console.log(`✅ User "${username}" created successfully with ${stationIds.length} stations`);
}

function clearMessages() {
  writeJsonFile(MESSAGES_FILE, []);
  console.log('🗑️  All messages cleared');
}

function deleteUser(userId) {
  const users = readJsonFile(USERS_FILE);
  
  // Find user to delete
  const userToDelete = users.find(user => user.id === parseInt(userId));
  if (!userToDelete) {
    console.log(`❌ User with ID ${userId} not found`);
    return;
  }
  
  // Delete user
  const filteredUsers = users.filter(user => user.id !== parseInt(userId));
  
  // Write updated data
  writeJsonFile(USERS_FILE, filteredUsers);
  console.log(`✅ User "${userToDelete.username}" deleted successfully`);
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'reset':
    resetDatabase();
    break;
  case 'stats':
    showStats();
    break;
  case 'add-user':
    const username = process.argv[3];
    const phone = process.argv[4];
    const password = process.argv[5];
    const stationIds = process.argv[6] ? process.argv[6].split(',') : [];
    
    if (!username || !phone || !password) {
      console.log('Usage: node db-manager.js add-user <username> <phone> <password> [stationIds]');
      console.log('Example: node db-manager.js add-user john +1234567890 password ST001,ST002');
      process.exit(1);
    }
    
    addUser(username, phone, password, stationIds);
    break;
  case 'delete-user':
    const deleteUserId = process.argv[3];
    
    if (!deleteUserId) {
      console.log('Usage: node db-manager.js delete-user <userId>');
      process.exit(1);
    }
    
    deleteUser(deleteUserId);
    break;
  case 'clear-messages':
    clearMessages();
    break;
  default:
    console.log('📋 JSON Database Manager');
    console.log('');
    console.log('Commands:');
console.log('  reset           - Reset database with demo data');
console.log('  stats           - Show database statistics');
console.log('  add-user        - Add a new user');
console.log('  delete-user     - Delete a user by ID');
console.log('  clear-messages  - Clear all messages');
    console.log('');
    console.log('Examples:');
console.log('  node db-manager.js reset');
console.log('  node db-manager.js stats');
console.log('  node db-manager.js add-user testuser +1234567890 mypassword ST001,ST002');
console.log('  node db-manager.js clear-messages');
} 