# 🗄️ Neon PostgreSQL Database Setup Guide

## Overview
This guide explains how to set up and use the Neon PostgreSQL database as a replacement for the local `users.json` file system.

## 🚀 Quick Setup

### 1. Create Environment File
Create a `.env.local` file in your project root with your Neon database credentials:

```bash
# Create .env.local file
touch .env.local
```

Add the following content to `.env.local`:
```env
DATABASE_URL=postgres://neondb_owner:npg_4aiyJ8jYPAQN@ep-autumn-forest-adogfgaz-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Test Database Connection
```bash
node test-db-connection.js
```

### 4. Migrate Data from users.json
```bash
node migrate-to-neon.js
```

## 📊 Database Schema

The Neon database uses the following table structure:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  password VARCHAR(255) NOT NULL,
  station_ids TEXT DEFAULT '[]',
  station_titles TEXT DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Field Descriptions:
- **`id`**: Auto-incrementing primary key
- **`username`**: Unique username for login
- **`phone`**: User's phone number
- **`password`**: Hashed password (bcrypt)
- **`station_ids`**: JSON array of assigned station IDs
- **`station_titles`**: JSON object of custom station titles
- **`created_at`**: Timestamp when user was created

## 🔄 Migration Process

### What the Migration Script Does:
1. **Reads** your existing `users.json` file
2. **Creates** the users table in Neon (if it doesn't exist)
3. **Migrates** all user data including:
   - Username, phone, password
   - Station IDs array
   - Station titles object
   - Creation timestamp
4. **Verifies** the migration was successful

### Running Migration:
```bash
node migrate-to-neon.js
```

**⚠️ Important**: The migration script will clear existing data in the Neon database before migrating. If you want to keep existing data, comment out the `DELETE FROM users` line in the migration script.

## 🧪 Testing

### Test Database Connection:
```bash
node test-db-connection.js
```

This script will:
- Test the database connection
- Show the current database time
- Count existing users
- Display table structure

### Expected Output:
```
🔌 Testing Neon database connection...
📡 Connecting to: postgres://***:***@ep-autumn-forest-adogfgaz-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
✅ Database connection successful!
🕐 Current database time: 2025-01-XX XX:XX:XX.XXXXXX+00
📋 Testing users table...
👥 Total users in database: 2
🏗️  Table structure:
  - id: integer (not null) default: nextval('users_id_seq'::regclass)
  - username: character varying (not null)
  - phone: character varying (not null)
  - password: character varying (not null)
  - station_ids: text (nullable) default: '[]'
  - station_titles: text (nullable) default: '{}'
  - created_at: timestamp without time zone (nullable) default: CURRENT_TIMESTAMP
🎉 Database connection test completed successfully!
```

## 🔧 Configuration

### Environment Variables:
- **`DATABASE_URL`**: Primary connection string (with connection pooling)
- **`DATABASE_URL_UNPOOLED`**: Direct connection without pooling
- **`NODE_ENV`**: Set to `production` for Vercel deployment

### Vercel Deployment:
For Vercel deployment, add these environment variables in your Vercel dashboard:
- `DATABASE_URL`: Your Neon connection string
- `NODE_ENV`: `production`

## 📁 File Structure

```
CUUB_Dashboard/
├── .env.local                 # Database credentials (create this)
├── database.js               # Database interface (updated)
├── migrate-to-neon.js        # Migration script
├── test-db-connection.js     # Connection test script
├── data/
│   └── users.json           # Original data (will be migrated)
└── NEON_DATABASE_SETUP.md   # This guide
```

## 🚨 Troubleshooting

### Common Issues:

#### 1. "DATABASE_URL not found"
- Ensure `.env.local` file exists in project root
- Check that `DATABASE_URL` is properly set
- Verify file permissions

#### 2. "Connection failed"
- Check your Neon database is running
- Verify credentials in `.env.local`
- Ensure your IP is whitelisted in Neon

#### 3. "Table doesn't exist"
- Run the migration script: `node migrate-to-neon.js`
- Check migration script output for errors

#### 4. "Permission denied"
- Verify database user has proper permissions
- Check if database exists and is accessible

### Debug Commands:
```bash
# Check environment variables
node -e "require('dotenv').config({ path: '.env.local' }); console.log(process.env.DATABASE_URL)"

# Test database connection
node test-db-connection.js

# Check current data
node -e "const db = require('./database'); db.getAllUsers().then(users => console.log(users))"
```

## 🔄 Switching Between Database Types

The system automatically detects which database to use:

- **With `DATABASE_URL`**: Uses Neon PostgreSQL
- **Without `DATABASE_URL`**: Falls back to local JSON files

### For Development:
- Use JSON files for quick testing
- Use Neon for production-like testing

### For Production:
- Always use Neon PostgreSQL
- Set `DATABASE_URL` in environment variables

## 📈 Performance Benefits

### Neon PostgreSQL Advantages:
- **Scalability**: Handles multiple concurrent users
- **Reliability**: Built-in backups and failover
- **Performance**: Optimized for read/write operations
- **Security**: SSL connections and access controls
- **Monitoring**: Built-in performance metrics

### Connection Pooling:
- Uses `ep-autumn-forest-adogfgaz-pooler.c-2.us-east-1.aws.neon.tech`
- Optimized for serverless environments (Vercel)
- Automatic connection management

## 🎯 Next Steps

After successful migration:

1. **Test your application** with the new database
2. **Verify all functionality** works as expected
3. **Deploy to Vercel** with the new database
4. **Monitor performance** and database usage
5. **Consider backing up** your Neon database regularly

## 📞 Support

For issues with:
- **Neon Database**: Check [Neon documentation](https://neon.tech/docs)
- **Migration**: Review migration script output
- **Connection**: Use test-db-connection.js script
- **Application**: Check server logs and database queries

---

**Happy Database Migration! 🎉**
