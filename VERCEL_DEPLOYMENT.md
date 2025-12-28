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

**How to set environment variables in Vercel:**
1. Go to your project in Vercel dashboard
2. Click on **Settings** tab
3. Click on **Environment Variables** in the sidebar
4. Add each variable with its value:
   - Click **Add New**
   - Enter the variable name (e.g., `OPENAI_API_KEY`)
   - Enter the variable value
   - Select environments (Production, Preview, Development) - check all that apply
   - Click **Save**
5. **Important**: After adding new environment variables, you need to redeploy your project for them to take effect

**Required environment variables:**
```
NODE_ENV=production
OPENAI_API_KEY=sk-proj-your-api-key-here
ENERGO_USERNAME=your_energo_username
ENERGO_PASSWORD=your_energo_password
ENERGO_TOKEN=your_energo_token_here
```

**Note:** `ENERGO_TOKEN` is the Energo API authorization token. The application reads from this environment variable first (Priority 1), then falls back to the file for local development. To update the token in production, update the `ENERGO_TOKEN` environment variable in Vercel dashboard.

**Optional environment variables (if used):**
```
JWT_SECRET=your_jwt_secret_here
DATABASE_URL=your_database_url_here
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_MESSAGING_SERVICE_SID=your_twilio_service_sid
TWILIO_ALERT_PHONE=your_phone_number
TWILIO_PHONE_NUMBER=your_twilio_phone
CALENDAR_LINK=your_calendar_link
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
