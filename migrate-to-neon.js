#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Check if DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env.local');
  console.error('Please make sure your .env.local file contains the DATABASE_URL');
  process.exit(1);
}

const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function migrateToNeon() {
  try {
    console.log('🚀 Starting migration from users.json to Neon PostgreSQL...');
    
    // Read current users.json
    const usersFilePath = path.join(__dirname, 'data', 'users.json');
    if (!fs.existsSync(usersFilePath)) {
      console.error('❌ users.json not found');
      process.exit(1);
    }
    
    const users = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
    console.log(`📋 Found ${users.length} users to migrate`);
    
    // Create users table with updated schema
    console.log('🗄️  Creating users table...');
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20) NOT NULL,
        password VARCHAR(255) NOT NULL,
        station_ids TEXT DEFAULT '[]',
        station_titles TEXT DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🧹 Clearing existing data...');
    await sql`DELETE FROM users`;
    
    // Reset sequence
    await sql`ALTER SEQUENCE users_id_seq RESTART WITH 1`;
    
    // Migrate each user
    console.log('📤 Migrating users...');
    for (const user of users) {
      console.log(`  - Migrating user: ${user.username}`);
      
      const stationIdsJson = JSON.stringify(user.station_ids || []);
      const stationTitlesJson = JSON.stringify(user.station_titles || {});
      
      await sql`
        INSERT INTO users (username, phone, password, station_ids, station_titles, created_at)
        VALUES (${user.username}, ${user.phone}, ${user.password}, ${stationIdsJson}, ${stationTitlesJson}, ${user.created_at})
      `;
    }
    
    // Verify migration
    const migratedUsers = await sql`SELECT * FROM users ORDER BY id`;
    console.log(`✅ Successfully migrated ${migratedUsers.length} users`);
    
    // Display migrated users
    console.log('\n📊 Migrated Users:');
    migratedUsers.forEach(user => {
      const stationIds = JSON.parse(user.station_ids || '[]');
      const stationTitles = JSON.parse(user.station_titles || '{}');
      console.log(`  - ${user.username} (ID: ${user.id})`);
      console.log(`    Phone: ${user.phone}`);
      console.log(`    Stations: ${stationIds.join(', ')}`);
      console.log(`    Station Titles: ${Object.keys(stationTitles).length > 0 ? 'Yes' : 'No'}`);
      console.log(`    Created: ${user.created_at}`);
      console.log('');
    });
    
    console.log('🎉 Migration completed successfully!');
    console.log('💡 You can now delete users.json and use the Neon database');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateToNeon();
