# MongoDB Atlas Setup Guide

## Step 1: Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Sign up for a free account
3. Create a new cluster (choose the free tier)

## Step 2: Get Connection String
1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your database password
5. Replace `<dbname>` with `preset_app`

## Step 3: Set Environment Variable
1. Go to your Vercel dashboard
2. Navigate to your project settings
3. Go to "Environment Variables"
4. Add a new variable:
   - **Name**: `MONGODB_URI`
   - **Value**: Your MongoDB connection string
5. Deploy the changes

## Example Connection String:
```
mongodb+srv://username:password@cluster.mongodb.net/preset_app?retryWrites=true&w=majority
```

## Step 4: Test
After setting the environment variable, your app will use MongoDB for persistent storage instead of in-memory storage.

## Benefits:
- ✅ Data persists between serverless function restarts
- ✅ No more lost users after login/signup
- ✅ Scalable and reliable
- ✅ Free tier available 