#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function fixDatabaseSchema() {
  try {
    console.log('🔧 Fixing database schema...');
    
    // Show current structure
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
    
    // Add missing columns directly
    console.log('\n🔧 Adding missing columns...');
    
    try {
      await sql`ALTER TABLE users ADD COLUMN station_ids TEXT DEFAULT '[]'`;
      console.log('  + Added station_ids column');
    } catch (e) {
      if (e.code === '42701') {
        console.log('  ✓ station_ids column already exists');
      } else {
        throw e;
      }
    }
    
    try {
      await sql`ALTER TABLE users ADD COLUMN station_titles TEXT DEFAULT '{}'`;
      console.log('  + Added station_titles column');
    } catch (e) {
      if (e.code === '42701') {
        console.log('  ✓ station_titles column already exists');
      } else {
        throw e;
      }
    }
    
    // Remove old bio column
    try {
      await sql`ALTER TABLE users DROP COLUMN bio`;
      console.log('  - Removed old bio column');
    } catch (e) {
      if (e.code === '42703') {
        console.log('  ✓ bio column already removed');
      } else {
        throw e;
      }
    }
    
    // Show final structure
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
    
    console.log('\n✅ Database schema fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing database schema:', error);
    process.exit(1);
  }
}

fixDatabaseSchema();
