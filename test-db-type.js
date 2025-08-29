#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

console.log('🔍 Checking database configuration...');
console.log('📋 Environment variables:');
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('  NODE_ENV:', process.env.NODE_ENV || 'NOT SET');

if (process.env.DATABASE_URL) {
  console.log('✅ DATABASE_URL is set - will use Neon PostgreSQL');
  console.log('🔗 URL format:', process.env.DATABASE_URL.includes('neondb_owner') ? 'CORRECT' : 'INCORRECT');
} else {
  console.log('❌ DATABASE_URL not set - will fall back to JSON files');
}

console.log('\n🧪 Testing database connection...');

try {
  const db = require('./database');
  console.log('✅ Database module loaded successfully');
  
  // Test getting all users
  db.getAllUsers()
    .then(users => {
      console.log('✅ Database query successful');
      console.log(`👥 Found ${users.length} users`);
      users.forEach(user => {
        console.log(`  - ${user.username}: ${user.station_ids.length} stations`);
      });
    })
    .catch(error => {
      console.error('❌ Database query failed:', error.message);
    });
    
} catch (error) {
  console.error('❌ Failed to load database module:', error.message);
}
