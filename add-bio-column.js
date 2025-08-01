#!/usr/bin/env node

// Migration script to add bio column to existing Neon database
const { neon } = require('@neondatabase/serverless');

async function addBioColumn() {
  if (!process.env.DATABASE_URL) {
    console.log('❌ DATABASE_URL not found. Please set your Neon database URL.');
    console.log('Example: DATABASE_URL=postgresql://user:pass@host/db node add-bio-column.js');
    process.exit(1);
  }

  try {
    console.log('🔄 Connecting to Neon database...');
    const sql = neon(process.env.DATABASE_URL);

    // Check if bio column already exists
    console.log('📋 Checking if bio column exists...');
    const columnCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'bio'
    `;

    if (columnCheck.length > 0) {
      console.log('✅ Bio column already exists in users table.');
      return;
    }

    // Add bio column
    console.log('➕ Adding bio column to users table...');
    await sql`
      ALTER TABLE users 
      ADD COLUMN bio TEXT DEFAULT ''
    `;
    
    console.log('✅ Bio column added successfully!');
    
    // Verify the column was added
    const verify = await sql`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'bio'
    `;
    
    if (verify.length > 0) {
      console.log('🔍 Verification successful:');
      console.log(`   Column: ${verify[0].column_name}`);
      console.log(`   Type: ${verify[0].data_type}`);
      console.log(`   Default: ${verify[0].column_default}`);
    }

    console.log('🎉 Migration completed successfully!');
    console.log('💡 Your Neon database now supports the bio feature.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

// Run migration
addBioColumn(); 