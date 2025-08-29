# 🚀 Vercel Deployment Guide with Neon Database

## 🎯 **Current Issue**
Your Vercel deployment is failing because it doesn't have access to the Neon database credentials. The admin panel shows no users because database queries are failing.

## 🔧 **Solution: Set Environment Variables in Vercel**

### 1. **Access Vercel Dashboard**
- Go to [vercel.com](https://vercel.com)
- Sign in and select your project (`preset_app`)

### 2. **Set Environment Variables**
Navigate to: **Settings** → **Environment Variables**

Add these variables:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `DATABASE_URL` | `postgres://neondb_owner:npg_4aiyJ8jYPAQN@ep-autumn-forest-adogfgaz-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require` | **Production** |
| `JWT_SECRET` | `preset_jwt_secret_key_very_long_and_secure` | **Production** |
| `NODE_ENV` | `production` | **Production** |

**⚠️ Important**: Make sure to select **Production** environment for all variables.

### 3. **Redeploy After Changes**
- After setting environment variables, redeploy your project
- Go to **Deployments** → **Redeploy** (three dots menu)

## 🗄️ **Database Migration for Vercel**

### Option 1: Run Migration Locally (Recommended)
```bash
# 1. Update your .env.local with real credentials
# 2. Run migration
node migrate-to-neon.js
# 3. Deploy to Vercel
```

### Option 2: Create Migration Endpoint (Temporary)
Add this to your server.js for one-time migration:

```javascript
// TEMPORARY: Migration endpoint (remove after use)
app.post('/admin/migrate-to-neon', async (req, res) => {
  try {
    // Read users.json and migrate to Neon
    const fs = require('fs');
    const users = JSON.parse(fs.readFileSync('./data/users.json', 'utf8'));
    
    // Migrate each user to Neon
    for (const user of users) {
      await db.createUser(
        user.username, 
        user.phone, 
        user.password, 
        user.station_ids || [],
        user.station_titles || {}
      );
    }
    
    res.json({ success: true, message: `Migrated ${users.length} users` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 🔍 **Troubleshooting Vercel Issues**

### 1. **Check Environment Variables**
```bash
# In Vercel dashboard, verify:
# - DATABASE_URL is set correctly
# - NODE_ENV is set to 'production'
# - All variables are in Production environment
```

### 2. **Check Vercel Logs**
- Go to **Deployments** → **Latest deployment** → **Functions** → **server.js**
- Look for database connection errors

### 3. **Test Database Connection**
Add this debug endpoint to your server.js:

```javascript
// Debug endpoint for Vercel
app.get('/api/debug-vercel', async (req, res) => {
  try {
    res.json({
      environment: process.env.NODE_ENV,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 📋 **Complete Vercel Setup Checklist**

- [ ] **Environment Variables Set** in Vercel dashboard
- [ ] **Database Migrated** to Neon (locally or via endpoint)
- [ ] **Project Redeployed** after environment changes
- [ ] **Database Connection Tested** via debug endpoint
- [ ] **Admin Panel Working** (shows users)
- [ ] **Login Functioning** properly

## 🚨 **Common Vercel Issues**

### Issue: "Database connection failed"
**Solution**: Check `DATABASE_URL` in Vercel environment variables

### Issue: "Cannot find module '@neondatabase/serverless'"
**Solution**: Ensure `@neondatabase/serverless` is in `package.json` dependencies

### Issue: "Environment variables not loaded"
**Solution**: Verify `NODE_ENV=production` is set in Vercel

### Issue: "Admin panel shows no users"
**Solution**: Database migration not completed or connection failing

## 🔄 **Deployment Workflow**

1. **Local Setup**: Update `.env.local` with real credentials
2. **Local Migration**: Run `node migrate-to-neon.js`
3. **Vercel Setup**: Set environment variables in dashboard
4. **Deploy**: Push code and redeploy
5. **Verify**: Test admin panel and login functionality

## 📞 **Need Help?**

If you're still having issues:
1. Check Vercel deployment logs
2. Verify environment variables are set correctly
3. Ensure database migration completed successfully
4. Test database connection via debug endpoints

---

**🎉 After following this guide, your Vercel deployment should work with the Neon database!**
