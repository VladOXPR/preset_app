#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

// Check if DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env.local');
  console.error('Please make sure your .env.local file contains the DATABASE_URL');
  process.exit(1);
}

const { neon } = require('@neondatabase/serverless');

async function testConnection() {
  try {
    console.log('🔌 Testing Neon database connection...');
    console.log('📡 Connecting to:', process.env.DATABASE_URL.replace(/\/\/.*@/, '//***:***@'));
    
    const sql = neon(process.env.DATABASE_URL);
    
    // Test basic connection
    const result = await sql`SELECT NOW() as current_time`;
    console.log('✅ Database connection successful!');
    console.log('🕐 Current database time:', result[0].current_time);
    
    // Test users table
    console.log('\n📋 Testing users table...');
    const users = await sql`SELECT COUNT(*) as user_count FROM users`;
    console.log('👥 Total users in database:', users[0].user_count);
    
    // Show table structure
    console.log('\n🏗️  Table structure:');
    const tableInfo = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `;
    
    tableInfo.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'} ${col.column_default ? `default: ${col.column_default}` : ''}`);
    });
    
    console.log('\n🎉 Database connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    process.exit(1);
  }
}

testConnection();
