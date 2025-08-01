import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.DATABASE_URL) {
    return res.status(500).json({ error: 'DATABASE_URL not found' });
  }

  try {
    console.log('🔄 Starting Neon database migration...');
    const sql = neon(process.env.DATABASE_URL);

    // Check if bio column exists
    console.log('📋 Checking if bio column exists...');
    const columnCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'bio'
    `;

    if (columnCheck.length > 0) {
      console.log('✅ Bio column already exists in users table.');
      return res.json({ 
        status: 'success', 
        message: 'Bio column already exists',
        timestamp: new Date().toISOString()
      });
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
      console.log('🔍 Verification successful');
      return res.json({ 
        status: 'success', 
        message: 'Bio column added successfully',
        column: verify[0],
        timestamp: new Date().toISOString()
      });
    } else {
      throw new Error('Column verification failed');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return res.status(500).json({ 
      status: 'error', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 