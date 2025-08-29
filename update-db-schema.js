#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function updateDatabaseSchema() {
  try {
    console.log('🔧 Updating database schema...');
    
    // Check current table structure
    console.log('📋 Current table structure:');
    const currentColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `;
    
    currentColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
    });
    
    // Add missing columns if they don't exist
    console.log('\n🔧 Adding missing columns...');
    
    // Check if station_ids column exists
    const stationIdsExists = await sql`
      SELECT COUNT(*) as count FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'station_ids'
    `;
    
    if (stationIdsExists[0].count === 0) {
      console.log('  + Adding station_ids column...');
      await sql`ALTER TABLE users ADD COLUMN station_ids TEXT DEFAULT '[]'`;
    } else {
      console.log('  ✓ station_ids column already exists');
    }
    
    // Check if station_titles column exists
    const stationTitlesExists = await sql`
      SELECT COUNT(*) as count FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'station_titles'
    `;
    
    if (stationTitlesExists[0].count === 0) {
      console.log('  + Adding station_titles column...');
      await sql`ALTER TABLE users ADD COLUMN station_titles TEXT DEFAULT '{}'`;
    } else {
      console.log('  ✓ station_titles column already exists');
    }
    
    // Remove old bio column if it exists
    const bioExists = await sql`
      SELECT COUNT(*) as count FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'bio'
    `;
    
    if (bioExists[0].count > 0) {
      console.log('  - Removing old bio column...');
      await sql`ALTER TABLE users DROP COLUMN bio`;
    } else {
      console.log('  ✓ bio column already removed');
    }
    
    // Update existing users with default station data
    console.log('\n🔄 Updating existing users...');
    await sql`
      UPDATE users 
      SET station_ids = '[]', station_titles = '{}' 
      WHERE station_ids IS NULL OR station_titles IS NULL
    `;
    
    // Show final table structure
    console.log('\n📋 Final table structure:');
    const finalColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `;
    
    finalColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
    });
    
    // Show user count
    const userCount = await sql`SELECT COUNT(*) as count FROM users`;
    console.log(`\n👥 Total users: ${userCount[0].count}`);
    
    console.log('\n✅ Database schema updated successfully!');
    
  } catch (error) {
    console.error('❌ Error updating database schema:', error);
    process.exit(1);
  }
}

updateDatabaseSchema();
