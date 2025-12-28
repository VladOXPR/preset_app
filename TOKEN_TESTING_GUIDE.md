# Testing Token Extraction and Update in Deployment

This guide explains how to test if the automatic Energo token extraction and update functionality works properly in your Vercel deployment.

## Prerequisites

Make sure you have:
- ✅ `ENERGO_USERNAME` environment variable set in Vercel
- ✅ `ENERGO_PASSWORD` environment variable set in Vercel  
- ✅ `OPENAI_API_KEY` environment variable set in Vercel (for captcha solving)
- ✅ `ENERGO_TOKEN` environment variable set in Vercel (initial token)
- ✅ (Optional) `VERCEL_TOKEN` and `VERCEL_PROJECT_ID` for automatic env var updates

## Testing Methods

### Method 1: Monitor Logs During Normal Operation

1. **Open Vercel Dashboard Logs**
   - Go to your project in Vercel
   - Navigate to **Deployments** → Click on latest deployment → **Functions** tab
   - Click on any function invocation to see logs

2. **Trigger an Energo API Call**
   - Use your application normally (e.g., view stations that use Energo API)
   - Watch the logs for:
     - `🔄 Refreshing Energo authorization token...`
     - `✅ Successfully refreshed Energo token`
     - `✅ Energo token updated via Vercel API and cached` (if Vercel API credentials are set)

### Method 2: Force Token Refresh by Using Invalid Token

1. **Set an Invalid Token**
   - Go to `/key` page in your deployed app
   - Enter an invalid token (e.g., `"invalid_token_test"`)
   - Click Save
   - This will cache the invalid token

2. **Trigger an Energo API Call**
   - Make any API call that uses Energo (e.g., fetch station data for an Energo station)
   - The API will fail with 401/403
   - Automatic token refresh should trigger

3. **Check Logs**
   - Look for these log messages:
     ```
     🔐 Auth error detected: HTTP status 401
     ⚠️  Energo API request failed with auth error, refreshing token...
     🔄 Refreshing Energo authorization token...
     ✅ Successfully refreshed Energo token
     ✅ Energo token updated via Vercel API and cached
     🔄 Retrying Energo API request with new token...
     ```

4. **Verify Token Update**
   - Go back to `/key` page
   - The token should now show the newly extracted token
   - Check Vercel environment variables (if auto-update is enabled)

### Method 3: Check Current Token Status

1. **Via `/key` Page**
   - Navigate to `https://your-app.vercel.app/key`
   - Check what token is displayed
   - This shows the token from cache → env var → file (in priority order)

2. **Via API Endpoint**
   - Call `GET https://your-app.vercel.app/api/energo-token`
   - Response will show:
     ```json
     {
       "token": "...",
       "source": "cache" | "environment" | "file"
     }
     ```

### Method 4: Test Token Refresh Endpoint Directly (Manual)

If you want to manually trigger a token refresh:

1. **Create a Test Endpoint** (temporary)
   - Add to `server.js`:
     ```javascript
     app.post('/api/test-refresh-token', async (req, res) => {
       try {
         const newToken = await supplierAPI.refreshEnergoToken();
         res.json({ success: true, token: newToken });
       } catch (error) {
         res.status(500).json({ error: error.message });
       }
     });
     ```

2. **Call the Endpoint**
   - `POST https://your-app.vercel.app/api/test-refresh-token`
   - Check logs for token refresh process
   - Verify token was updated

## What to Look For in Logs

### Successful Token Refresh:
```
🔄 Refreshing Energo authorization token...
Navigating to login page...
Extracting captcha image...
Solving captcha with OpenAI...
OpenAI solved captcha: [answer]
✅ Successfully refreshed Energo token
✅ Energo token updated via Vercel API and cached
```

### If Vercel API Update Fails (but cache works):
```
✅ Successfully refreshed Energo token
⚠️  Could not update token via Vercel API: [error]
✅ Energo token updated in cache (file write not available on Vercel)
```

### If Token Refresh Fails:
```
❌ Error refreshing Energo token: [error message]
```

## Verifying Vercel Environment Variable Update

If you have `VERCEL_TOKEN` and `VERCEL_PROJECT_ID` set:

1. **After Token Refresh**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Check if `ENERGO_TOKEN` value was updated
   - Note: It may take a few seconds to propagate

2. **After Next Deployment**
   - The new token from env var will be used
   - Verify it matches the token that was refreshed

## Troubleshooting

### Token Refresh Not Happening:
- ✅ Check if `ENERGO_USERNAME` and `ENERGO_PASSWORD` are set correctly
- ✅ Check if `OPENAI_API_KEY` is set (required for captcha solving)
- ✅ Check logs for errors during login process

### Token Updated But Not Persisting:
- ✅ Check if `VERCEL_TOKEN` and `VERCEL_PROJECT_ID` are set
- ✅ Verify Vercel API token has correct permissions
- ✅ Check logs for Vercel API update errors

### Token Refresh Takes Too Long:
- ✅ Puppeteer login + captcha solving can take 30-60 seconds
- ✅ This is normal behavior
- ✅ Consider increasing function timeout in Vercel settings if needed

## Expected Behavior

**With Vercel API credentials set:**
1. Token is refreshed via Puppeteer
2. Token is cached immediately
3. Token is updated in Vercel environment variable automatically
4. Token persists after redeployment

**Without Vercel API credentials:**
1. Token is refreshed via Puppeteer  
2. Token is cached immediately
3. Token works until function instance is recycled
4. Need to manually update `ENERGO_TOKEN` env var for persistence

