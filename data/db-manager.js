#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname);
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// ========================================
// USER MANAGEMENT FUNCTIONS
// ========================================

function addUser(username, phone, password, userType = "Host", stationIds = []) {
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
    userType,
    station_ids: stationIds,
    created_at: new Date().toISOString(),
    station_titles: {}
  };
  
  users.push(newUser);
  writeJsonFile(USERS_FILE, users);
  console.log(`✅ User "${username}" created successfully as ${userType} with ${stationIds.length} stations`);
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

function updateUserPassword(username, newPassword) {
  const users = readJsonFile(USERS_FILE);
  
  // Find user to update
  const userIndex = users.findIndex(user => user.username === username);
  if (userIndex === -1) {
    console.log(`❌ User "${username}" not found`);
    return;
  }
  
  // Update password
  users[userIndex].password = bcrypt.hashSync(newPassword, 10);
  writeJsonFile(USERS_FILE, users);
  console.log(`✅ Password updated for user "${username}"`);
}

function showStats() {
  console.log('📊 Database Statistics:');
  
  const users = readJsonFile(USERS_FILE);
  
  console.log(`👥 Users: ${users.length}`);
  users.forEach(user => {
    console.log(`   - ${user.username} (${user.userType || 'Unknown'}) - ${user.station_ids.length} stations`);
  });
  
  // Count users by type
  const userTypeCounts = {};
  users.forEach(user => {
    const type = user.userType || 'Unknown';
    userTypeCounts[type] = (userTypeCounts[type] || 0) + 1;
  });
  
  console.log('📈 User type distribution:');
  Object.entries(userTypeCounts).forEach(([type, count]) => {
    console.log(`   - ${type}: ${count} users`);
  });
}

// ========================================
// HELPER FUNCTIONS
// ========================================

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

// ========================================
// COMMAND LINE INTERFACE
// ========================================

const command = process.argv[2];

switch (command) {
  case 'stats':
    showStats();
    break;
  case 'add-user':
    const username = process.argv[3];
    const phone = process.argv[4];
    const password = process.argv[5];
    const userType = process.argv[6] || "Host";
    const stationIds = process.argv[7] ? process.argv[7].split(',') : [];
    
    if (!username || !phone || !password) {
      console.log('Usage: node db-manager.js add-user <username> <phone> <password> [userType] [stationIds]');
      console.log('Example: node db-manager.js add-user john +1234567890 password Host ST001,ST002');
      console.log('Example: node db-manager.js add-user admin +1234567890 password Distributor ST001,ST002,ST003');
      process.exit(1);
    }
    
    addUser(username, phone, password, userType, stationIds);
    break;
  case 'delete-user':
    const deleteUserId = process.argv[3];
    
    if (!deleteUserId) {
      console.log('Usage: node db-manager.js delete-user <userId>');
      process.exit(1);
    }
    
    deleteUser(deleteUserId);
    break;
  case 'update-password':
    const updateUsername = process.argv[3];
    const newPassword = process.argv[4];
    
    if (!updateUsername || !newPassword) {
      console.log('Usage: node db-manager.js update-password <username> <newPassword>');
      process.exit(1);
    }
    
    updateUserPassword(updateUsername, newPassword);
    break;
  default:
    console.log('📋 CUUB Dashboard Database Manager');
    console.log('');
    console.log('Commands:');
    console.log('  stats           - Show database statistics');
    console.log('  add-user        - Add a new user (Host or Distributor)');
    console.log('  delete-user     - Delete a user by ID');
    console.log('  update-password - Update user password');
    console.log('');
    console.log('Examples:');
    console.log('  node db-manager.js stats');
    console.log('  node db-manager.js add-user testuser +1234567890 mypassword Host ST001,ST002');
    console.log('  node db-manager.js add-user admin +1234567890 mypassword Distributor ST001,ST002,ST003');
    console.log('  node db-manager.js update-password DePaul newpassword123');
} 