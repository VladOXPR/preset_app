console.log('🔧 Script loaded successfully!');
console.log('Node.js version:', process.version);

const API_URL = 'https://backend.energo.vip/api/cabinet?sort=isOnline,asc&sort=id,desc&page=0&size=10&leaseFilter=false&posFilter=false&AdsFilter=false';
const AUTH_TOKEN = 'Bearer eyJhbGciOiJIUzUxMiJ9.eyJqdGkiOiI3ZmEwYzg2ODYyYmI0MWRlYjJiMjAwZDAxMGI1ZjllMiIsInVzZXIiOiJjdWJVU0EyMDI1IiwiaXNBcGlUb2tlbiI6ZmFsc2UsInN1YiI6ImN1YlVTQTIwMjUiLCJBUElLRVkiOiJidXpOTEQyMDI0IiwiZXhwIjoxNzY1NzI0ODM5fQ.sNGtVbT55jbqEsgF80hkiolMgAaxc47KsMQom00GRNKpKs7amRv8N_ZOaRzjRp7Hh6djniQN6i7TihNoHcqiBA';

// Function to decode JWT token and get expiration
function getTokenExpiration(token) {
    try {
        // Remove 'Bearer ' prefix if present
        const tokenWithoutBearer = token.replace('Bearer ', '');
        
        // JWT has 3 parts separated by dots: header.payload.signature
        const parts = tokenWithoutBearer.split('.');
        if (parts.length !== 3) {
            return null;
        }
        
        // Decode the payload (second part)
        const payload = parts[1];
        
        // Add padding if needed (base64url may not have padding)
        const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
        
        // Decode from base64url
        const decoded = Buffer.from(paddedPayload, 'base64').toString('utf-8');
        const tokenData = JSON.parse(decoded);
        
        if (tokenData.exp) {
            const expirationDate = new Date(tokenData.exp * 1000); // Convert Unix timestamp to Date
            const now = new Date();
            const timeUntilExpiry = expirationDate - now;
            const hoursUntilExpiry = timeUntilExpiry / (1000 * 60 * 60);
            const daysUntilExpiry = hoursUntilExpiry / 24;
            
            return {
                expirationDate,
                expirationTimestamp: tokenData.exp,
                timeUntilExpiry,
                hoursUntilExpiry,
                daysUntilExpiry,
                isExpired: timeUntilExpiry < 0,
                tokenData
            };
        }
        
        return null;
    } catch (error) {
        console.error('Error decoding token:', error.message);
        return null;
    }
}

let requestCount = 0;
let successCount = 0;
let failureCount = 0;
let lastSuccessTime = null;
let firstFailureTime = null;


async function testAPIToken() {
   requestCount++;
   const timestamp = new Date().toISOString();
  
   console.log(`\n${'='.repeat(80)}`);
   console.log(`Request #${requestCount} - ${timestamp}`);
   console.log('='.repeat(80));
  
   try {
       // Add dynamic timestamp to prevent caching
       const urlWithTimestamp = `${API_URL}&_t=${Date.now()}`;
      
       const response = await fetch(urlWithTimestamp, {
           method: 'GET',
           headers: {
               'Authorization': AUTH_TOKEN,
               'Accept': 'application/json, text/plain, */*',
               'Content-Type': 'application/json',
               'language': 'en-US',
               'oid': '3526',
               'Referer': 'https://backend.energo.vip/device/list',
               'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:144.0) Gecko/20100101 Firefox/144.0'
           }
       });
      
       console.log(`Status Code: ${response.status} ${response.statusText}`);
      
       if (response.ok) {
           const data = await response.json();
          
           // Check token expiration status
           const currentTokenInfo = getTokenExpiration(AUTH_TOKEN);
           if (currentTokenInfo) {
               if (currentTokenInfo.isExpired) {
                   console.log('⚠️  WARNING: Token has EXPIRED but request still succeeded!');
                   console.log(`   Token expired: ${currentTokenInfo.expirationDate.toLocaleString()}`);
               } else if (currentTokenInfo.hoursUntilExpiry < 24) {
                   const hours = currentTokenInfo.hoursUntilExpiry;
                   const minutes = hours * 60;
                   console.log(`⚠️  WARNING: Token expires soon! (${hours.toFixed(1)} hours / ${minutes.toFixed(0)} minutes remaining)`);
               }
           }
          
           // Validate response structure
           if (data && data.content && Array.isArray(data.content)) {
               successCount++;
               lastSuccessTime = timestamp;
              
               console.log('✅ SUCCESS - Valid response received');
               console.log(`   - Total stations: ${data.totalElements}`);
               console.log(`   - Stations in response: ${data.content.length}`);
               console.log(`   - Success rate: ${successCount}/${requestCount} (${((successCount/requestCount)*100).toFixed(2)}%)`);
               
               // Show first station ID as sample
               if (data.content.length > 0) {
                   console.log(`   - Sample Station ID: ${data.content[0].cabinetId}`);
               }
           } else {
               console.log('⚠️  WARNING - Unexpected response structure');
               console.log('Response:', JSON.stringify(data, null, 2));
           }
       } else {
           failureCount++;
           if (!firstFailureTime) {
               firstFailureTime = timestamp;
           }
          
           const errorText = await response.text();
           console.log('❌ FAILURE - Invalid response');
           console.log(`   - Status: ${response.status}`);
           console.log(`   - Error: ${errorText}`);
           console.log(`   - Failure count: ${failureCount}`);
          
           if (response.status === 401 || response.status === 403) {
               console.log('\n🔒 TOKEN EXPIRED OR UNAUTHORIZED!');
               console.log(`   - Last successful request: ${lastSuccessTime || 'Never'}`);
               console.log(`   - First failure: ${firstFailureTime}`);
               console.log(`   - Token was valid for: ${successCount} requests`);
           }
       }
      
   } catch (error) {
       failureCount++;
       if (!firstFailureTime) {
           firstFailureTime = timestamp;
       }
      
       console.log('❌ ERROR - Request failed');
       console.log(`   - Error type: ${error.name}`);
       console.log(`   - Message: ${error.message}`);
       console.log(`   - Failure count: ${failureCount}`);
   }
  
   console.log('\nStatistics:');
   console.log(`   - Total requests: ${requestCount}`);
   console.log(`   - Successful: ${successCount}`);
   console.log(`   - Failed: ${failureCount}`);
  
   if (requestCount > 0) {
       const uptime = ((successCount / requestCount) * 100).toFixed(2);
       console.log(`   - Success rate: ${uptime}%`);
   }
}


// Run the test immediately
console.log('🚀 Starting API Token Expiration Test');
console.log('📡 Testing endpoint:', API_URL);
console.log('⏱️  Request interval: 5 seconds');
console.log('🔑 Using provided Bearer token');

// Show token expiration prominently
const startupTokenInfo = getTokenExpiration(AUTH_TOKEN);
if (startupTokenInfo) {
    console.log('\n' + '='.repeat(80));
    console.log('🔑 TOKEN EXPIRATION STATUS:');
    console.log('='.repeat(80));
    if (startupTokenInfo.isExpired) {
        const expiredHours = Math.abs(startupTokenInfo.hoursUntilExpiry);
        console.log(`   ⚠️  TOKEN IS EXPIRED!`);
        console.log(`   Expired: ${startupTokenInfo.expirationDate.toLocaleString()}`);
        console.log(`   Expired ${expiredHours.toFixed(2)} hours ago`);
    } else {
        console.log(`   ✅ Token is VALID`);
        console.log(`   Expires: ${startupTokenInfo.expirationDate.toLocaleString()}`);
        if (startupTokenInfo.daysUntilExpiry > 1) {
            console.log(`   Time remaining: ${startupTokenInfo.daysUntilExpiry.toFixed(2)} days (${startupTokenInfo.hoursUntilExpiry.toFixed(2)} hours)`);
        } else if (startupTokenInfo.hoursUntilExpiry > 1) {
            console.log(`   Time remaining: ${startupTokenInfo.hoursUntilExpiry.toFixed(2)} hours`);
        } else {
            const minutes = startupTokenInfo.hoursUntilExpiry * 60;
            console.log(`   ⚠️  WARNING: Only ${minutes.toFixed(0)} minutes remaining!`);
        }
    }
    console.log('='.repeat(80));
}

console.log('\nPress Ctrl+C to stop the test\n');


// Run first test immediately
testAPIToken();


const interval = setInterval(testAPIToken, 5000);


// Handle graceful shutdown
process.on('SIGINT', () => {
   console.log('\n\n📊 Final Test Summary:');
   console.log('='.repeat(80));
   console.log(`Total requests: ${requestCount}`);
   console.log(`Successful: ${successCount}`);
   console.log(`Failed: ${failureCount}`);
   console.log(`Success rate: ${requestCount > 0 ? ((successCount/requestCount)*100).toFixed(2) : 0}%`);
  
   if (lastSuccessTime) {
       console.log(`Last successful request: ${lastSuccessTime}`);
   }
   if (firstFailureTime) {
       console.log(`First failure occurred: ${firstFailureTime}`);
   }
   
   // Show token expiration status
   const finalTokenInfo = getTokenExpiration(AUTH_TOKEN);
   if (finalTokenInfo) {
       console.log('\n🔑 Token Status:');
       if (finalTokenInfo.isExpired) {
           const expiredHours = Math.abs(finalTokenInfo.hoursUntilExpiry);
           console.log(`   ⚠️  TOKEN IS EXPIRED! (Expired ${expiredHours.toFixed(2)} hours ago)`);
           console.log(`   Expiration Date: ${finalTokenInfo.expirationDate.toLocaleString()}`);
       } else {
           if (finalTokenInfo.daysUntilExpiry > 1) {
               console.log(`   ✅ Token expires in ${finalTokenInfo.daysUntilExpiry.toFixed(2)} days`);
           } else if (finalTokenInfo.hoursUntilExpiry > 1) {
               console.log(`   ✅ Token expires in ${finalTokenInfo.hoursUntilExpiry.toFixed(2)} hours`);
           } else {
               const minutes = finalTokenInfo.hoursUntilExpiry * 60;
               console.log(`   ⚠️  Token expires in ${minutes.toFixed(0)} minutes!`);
           }
           console.log(`   Expiration Date: ${finalTokenInfo.expirationDate.toLocaleString()}`);
       }
   }
  
   console.log('\n👋 Test stopped by user');
   clearInterval(interval);
   process.exit(0);
});
