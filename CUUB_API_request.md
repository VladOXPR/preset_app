# ChargeNow API Requests Documentation

Here are the APIs we need:

## 1. Get All Devices/Stations
We need an API request that gets us all available charging stations and their information including station IDs, locations, and status.

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

## 2. Get Order List (Battery Rental Information)
We need an API request that gets us battery rental orders and transaction history with pagination support.

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

## 3. Get Station Availability
We need an API request that gets us real-time availability status of a specific charging station including battery slots and their status.

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

## 4. Dispense Battery (Repair Mode)
We need an API request that dispenses batteries from a specific station slot for maintenance/repair purposes (Distributor users only).

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

## 5. Get Order List with Date Range and Station Filter
We need an API request that gets us battery rental orders filtered by date range and specific station ID.

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

---

## Authentication
All ChargeNow API requests require Basic Authentication with the following credentials:
- **Authorization Header**: `Basic VmxhZFZhbGNoa292OlZWMTIxMg==`
- **Content-Type**: `application/json` (for POST requests)
