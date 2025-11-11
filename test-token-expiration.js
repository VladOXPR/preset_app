const API_URL = 'https://backend.energo.vip/api/cabinet?sort=isOnline,asc&sort=id,desc&page=0&size=10&leaseFilter=false&posFilter=false&AdsFilter=false';
const AUTH_TOKEN = 'Bearer eyJhbGciOiJIUzUxMiJ9.eyJqdGkiOiJkNDVhMjkzNWY3M2Y0ZjQ1OWU4MzdjM2E1YzBmOTgyMCIsInVzZXIiOiJjdWJVU0EyMDI1IiwiaXNBcGlUb2tlbiI6ZmFsc2UsInN1YiI6ImN1YlVTQTIwMjUiLCJBUElLRVkiOiJidXpOTEQyMDI0IiwiZXhwIjoxNzY1NDc5MDI1fQ.e8cSdnd-EQQZbkNf-qZCMn_0dBk1x8R9vYSkQNVObvp_f6PHcndXJTI5YBddl8WzUFAiMHLfM17zZV5ppmZ7Pw';

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
console.log('⏱️  Request interval: 60 seconds (1 minute)');
console.log('🔑 Using provided Bearer token');
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
    
    console.log('\n👋 Test stopped by user');
    clearInterval(interval);
    process.exit(0);
});

