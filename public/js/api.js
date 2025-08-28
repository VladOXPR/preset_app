// API functions for ChargeNow integration
const API_BASE_URL = 'https://developer.chargenow.top/cdb-open-api/v1';
const AUTH_TOKEN = 'Basic VmxhZFZhbGNoa292OlZWMTIxMg==';

// Function to get list of devices
function getlist() {
  var myHeaders = new Headers();
  myHeaders.append("Authorization", AUTH_TOKEN);

  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    redirect: 'follow'
  };

  fetch(`${API_BASE_URL}/cabinet/getAllDevice`, requestOptions)
    .then(response => response.text())
    .then(result => console.log(result))
    .catch(error => console.log('error', error));
}

getlist()
// Export function for use in other files
window.getlist = getlist; 