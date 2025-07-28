# Neon Postgres Setup Guide

## Step 1: Create Neon Database
1. Go to your Vercel dashboard
2. Navigate to your project
3. Go to "Storage" tab
4. Click "Create Database"
5. Choose "Postgres" (Neon)
6. Select a region close to you
7. Click "Create"

## Step 2: Get Environment Variables
After creating the Neon database, Vercel will automatically add the `DATABASE_URL` environment variable to your project.

## Step 3: Pull Environment Variables (Optional)
If you want to test locally, run:
```bash
npx vercel env pull .env.development.local
```

## Step 4: Deploy
The environment variables are automatically added to your project. Just deploy and it will work!

## Database Schema
The app will automatically create these tables:
- `users` - stores user accounts
- `messages` - stores chat messages

## Benefits of Neon Postgres:
- ✅ **Built for Vercel**: Works perfectly with serverless functions
- ✅ **Auto-configured**: Environment variables are auto-configured
- ✅ **Persistent**: Data survives cold starts
- ✅ **Reliable**: PostgreSQL is a robust database
- ✅ **SQL**: Standard SQL queries

## That's it!
No complex setup needed. Neon Postgres is the perfect solution for your app! 🎉 