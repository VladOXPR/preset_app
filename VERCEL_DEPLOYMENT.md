# 🚀 Vercel Deployment Guide for CUUB Dashboard

## Prerequisites
- [Vercel CLI](https://vercel.com/cli) installed
- GitHub repository connected to Vercel
- Node.js 18+ environment

## Quick Deployment

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy from your project directory
```bash
cd CUUB_Dashboard
vercel
```

### 4. Follow the prompts:
- Set up and deploy: `Y`
- Which scope: Select your account
- Link to existing project: `N`
- Project name: `cuub-dashboard` (or your preferred name)
- Directory: `./` (current directory)
- Override settings: `N`

## Manual Deployment Steps

### 1. Connect Repository
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository: `VladOXPR/preset_app`
4. Select the repository

### 2. Configure Project Settings
- **Framework Preset**: Node.js
- **Root Directory**: `./`
- **Build Command**: `npm run build`
- **Output Directory**: `./`
- **Install Command**: `npm install`

### 3. Environment Variables
Add these environment variables in Vercel dashboard:
```
NODE_ENV=production
JWT_SECRET=your_jwt_secret_here
DATABASE_URL=your_database_url_here
```

### 4. Deploy
Click "Deploy" and wait for the build to complete.

## Configuration Files

### vercel.json
- Routes all API calls to `server.js`
- Serves static files from `public/` directory
- Sets function timeout to 30 seconds
- Configures environment variables

### .vercelignore
- Excludes `node_modules/`, `.env` files, and other unnecessary files
- Optimizes deployment size and security

### server.js
- Exports Express app for Vercel serverless functions
- Includes health check endpoint: `/api/health`
- Compatible with both local development and Vercel

## Post-Deployment

### 1. Verify Deployment
- Check your Vercel dashboard for deployment status
- Test the health endpoint: `https://your-app.vercel.app/api/health`

### 2. Test Functionality
- Login page: `https://your-app.vercel.app/login`
- Home dashboard: `https://your-app.vercel.app/home`
- Admin panel: `https://your-app.vercel.app/admin`

### 3. Monitor Logs
- Use Vercel dashboard to monitor function logs
- Check for any runtime errors

## Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Check build logs in Vercel dashboard
# Ensure all dependencies are in package.json
npm install --production
```

#### 2. Function Timeouts
- Increase `maxDuration` in vercel.json
- Optimize database queries
- Use connection pooling for database

#### 3. Static File Issues
- Verify file paths in vercel.json routes
- Check .vercelignore exclusions
- Ensure files exist in public/ directory

#### 4. Database Connection
- Verify DATABASE_URL environment variable
- Check database accessibility from Vercel
- Use connection pooling for better performance

### Debug Commands
```bash
# Local testing
npm run dev

# Check Vercel configuration
vercel --version

# View deployment logs
vercel logs

# Redeploy
vercel --prod
```

## Performance Optimization

### 1. Function Optimization
- Keep functions lightweight
- Use connection pooling for database
- Implement proper error handling

### 2. Static Assets
- Optimize images and CSS
- Use CDN for large files
- Implement caching strategies

### 3. Database
- Use connection pooling
- Implement query optimization
- Consider read replicas for heavy traffic

## Security Considerations

### 1. Environment Variables
- Never commit sensitive data
- Use Vercel's environment variable system
- Rotate secrets regularly

### 2. API Security
- Implement rate limiting
- Use HTTPS only
- Validate all inputs

### 3. Authentication
- Secure JWT implementation
- Implement proper session management
- Use secure cookies

## Support

For issues with:
- **Vercel**: Check [Vercel documentation](https://vercel.com/docs)
- **CUUB Dashboard**: Check project README
- **Deployment**: Review build logs in Vercel dashboard

---

**Happy Deploying! 🎉**
