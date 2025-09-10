I created a simple outline of the api 
requests we need and how we use it in 
todays version of our product.

---

1. We need an API request that gets us all available charging stations and their information including station IDs, locations, and status.

**Here is what the link looks like:**
```
https://developer.chargenow.top/cdb-open-api/v1/cabinet/getAllDevice
```

**Here is an example of it being used:**
```javascript
async function fetchChargeNowStations() {
  const myHeaders = new Headers();
  myHeaders.append("Authorization", "Basic VmxhZFZhbGNoa292OlZWMTIxMg==");
  
  const requestOptions = {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow'
  };
  
  const response = await fetch("https://developer.chargenow.top/cdb-open-api/v1/cabinet/getAllDevice", requestOptions);
  const result = await response.text();
  return result;
}
```

---

2. We need an API request that gets us battery rental orders and transaction history with pagination support.

**Here is what the link looks like:**
```
https://developer.chargenow.top/cdb-open-api/v1/order/list?page=${page}&limit=${limit}
```

**Here is an example of it being used:**
```javascript
async function fetchBatteryRentalInfo(page = 1, limit = 100) {
  const myHeaders = new Headers();
  myHeaders.append("Authorization", "Basic VmxhZFZhbGNoa292OlZWMTIxMg==");
  myHeaders.append("Content-Type", "application/json");
  
  const requestOptions = {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow'
  };
  
  const url = `https://developer.chargenow.top/cdb-open-api/v1/order/list?page=${page}&limit=${limit}`;
  const response = await fetch(url, requestOptions);
  const result = await response.json();
  return { response, result };
}
```

---

3. We need an API request that gets us real-time availability status of a specific charging station including battery slots and their status.

**Here is what the link looks like:**
```
https://developer.chargenow.top/cdb-open-api/v1/rent/cabinet/query?deviceId=${stationId}
```

**Here is an example of it being used:**
```javascript
async function fetchStationAvailability(stationId) {
  const myHeaders = new Headers();
  myHeaders.append("Authorization", "Basic VmxhZFZhbGNoa292OlZWMTIxMg==");
  myHeaders.append("Content-Type", "application/json");
  
  const requestOptions = {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow'
  };
  
  const url = `https://developer.chargenow.top/cdb-open-api/v1/rent/cabinet/query?deviceId=${stationId}`;
  const response = await fetch(url, requestOptions);
  const result = await response.json();
  return { response, result };
}
```

---

4. We need an API request that dispenses batteries from a specific station slot for maintenance/repair purposes (Distributor users only).

**Here is what the link looks like:**
```
https://developer.chargenow.top/cdb-open-api/v1/cabinet/ejectByRepair?cabinetid=${stationId}&slotNum=0
```

**Here is an example of it being used:**
```javascript
async function dispenseBattery(stationId) {
  const myHeaders = new Headers();
  myHeaders.append("Authorization", "Basic VmxhZFZhbGNoa292OlZWMTIxMg==");
  myHeaders.append("Content-Type", "application/json");
  
  const requestOptions = {
    method: 'POST',
    headers: myHeaders,
    redirect: 'follow'
  };
  
  const dispenseUrl = `https://developer.chargenow.top/cdb-open-api/v1/cabinet/ejectByRepair?cabinetid=${stationId}&slotNum=0`;
  const response = await fetch(dispenseUrl, requestOptions);
  const result = await response.text();
  return { response, result };
}
```

---

5. We need an API request that gets us battery rental orders filtered by date range and specific station ID.

**Here is what the link looks like:**
```
https://developer.chargenow.top/cdb-open-api/v1/order/list?page=1&limit=100&sTime=${startTime}&eTime=${endTime}&pCabinetid=${stationId}
```

**Here is an example of it being used:**
```javascript
async function fetchStationOrders(stationId) {
  const myHeaders = new Headers();
  myHeaders.append("Authorization", "Basic VmxhZFZhbGNoa292OlZWMTIxMg==");
  
  const requestOptions = {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow'
  };
  
  // Set date range for current month
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(1);
  
  const sTime = startDate.toISOString().slice(0, 19).replace('T', ' ');
  const eTime = endDate.toISOString().slice(0, 19).replace('T', ' ');
  
  const orderListUrl = `https://developer.chargenow.top/cdb-open-api/v1/order/list?page=1&limit=100&sTime=${sTime}&eTime=${eTime}&pCabinetid=${stationId}`;
  
  const response = await fetch(orderListUrl, requestOptions);
  const result = await response.text();
  return result;
}
```

6: we need an api request that gets us battery rental information (rental status, duration, amount paid)

here is what the link looks like:
https://developer.chargenow.top/cdb-open-api/v1/order/list?page=1&limit=100


here is an example of it being used:
```javascript
const response = await fetch("https://developer.chargenow.top/cdb-open-api/v1/order/list?page=1&limit=100", {
   method: 'GET',
   headers: {
       "Authorization": "Basic VmxhZFZhbGNoa292OlZWMTIxMg==",
       "Content-Type": "application/json"
   },
   timeout: 10000
});


const result = await response.json();
const matchingRecord = result.page.records.find(record => record.pBatteryid === realBatteryId);
```


7: We need an api request that gets us station availability data (how many empty slots, how many occupied slots)

here is what the link looks like:
https://developer.chargenow.top/cdb-open-api/v1/rent/cabinet/query?deviceId={stationId}


here is an example of it being used:
```javascript
const stationIds = ['DTN00872', 'DTN00971', 'DTN00970', 'BJH09881', 'BJH09883'];
const stationPromises = stationIds.map(async (id) => {
   const response = await fetch(`https://developer.chargenow.top/cdb-open-api/v1/rent/cabinet/query?deviceId=${id}`, {
       method: 'GET',
       headers: {
           "Authorization": "Basic VmxhZFZhbGNoa292OlZWMTIxMg==",
           "Content-Type": "application/json"
       },
       timeout: 10000
   });
  
   const data = await response.json();
   return {
       id,
       available: data.data?.cabinet?.emptySlots || 0,
       occupied: data.data?.cabinet?.busySlots || 0,
       error: !response.ok
   };
});
```

---

## Authentication
All ChargeNow API requests require Basic Authentication with the following credentials:
- **Authorization Header**: `Basic VmxhZFZhbGNoa292OlZWMTIxMg==`
- **Content-Type**: `application/json` (for POST requests)
