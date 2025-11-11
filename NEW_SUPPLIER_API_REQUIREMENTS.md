# New Supplier API Requirements

## Overview
This document lists ALL the API endpoints you need from your new supplier to replace ChargeNow functionality in the CUUB Dashboard.

---

## 🔑 Authentication Requirements

### What You Need:
- **Authentication method** (Bearer token, API key, Basic auth, etc.)
- **Credentials** (API key, username/password, token)
- **Header format** (how to pass credentials in requests)

### Current ChargeNow Setup:
```
Method: Basic Authentication
Credentials: Base64 encoded username:password
Header: "Authorization: Basic VmxhZFZhbGNoa292OlZWMTIxMg=="
```

---

## 📋 Required API Endpoints

### 1. **Get All Stations/Devices** ⭐ CRITICAL

**Current ChargeNow**:
```
GET https://developer.chargenow.top/cdb-open-api/v1/cabinet/getAllDevice
```

**What You Need From New Supplier**:
- **Endpoint URL**: `GET /api/???`
- **Purpose**: Fetch all battery stations/cabinets
- **Authentication**: Required headers
- **Response Format**: What does it return?

**Expected Response Structure** (ask supplier for):
```json
{
  "code": 0,
  "msg": "success",
  "data": [
    {
      "id": "STATION_ID",
      "pCabinetid": "CABINET_ID",
      "stationName": "Station Name",
      "location": "Address",
      "emptySlots": 5,
      "busySlots": 3,
      "totalSlots": 8,
      // ... other fields
    }
  ]
}
```

**Dashboard Uses This For**:
- Displaying all stations on the home page
- Checking which stations exist
- Getting station status (online/offline)
- Getting battery availability counts

---

new supplier link:

GET https://backend.energo.vip/api/cabinet?sort=isOnline,asc&sort=id,desc&page=0&size=10&leaseFilter=false&posFilter=false&AdsFilter=false&_t=1761080946213

**Example response**
```json
{
    "content": [
        {
            "serviceType": "Emq",
            "oInfo": {
                "name": "cubUSA",
                "avatar": "",
                "id": 3526
            },
            "appPolicyId": 2258,
            "cabinetId": "RL3T062411030004",
            "bindVenueTime": 1748422130520,
            "batteryNum": 6,
            "adsAppInfo": {
                "adsName": "",
                "adsResolutionType": "1280 x 800",
                "adsDeviceType": "S06",
                "adsSn": "RL3T062411030004"
            },
            "shopName": "深圳市睿联通信技术有限公司",
            "supportAds": 1,
            "isOnline": 2,
            "oid": 3526,
            "sid": 3531,
            "faultInfo": {
                "positionNum": 0,
                "batteryNum": 0,
                "faultSign": 1
            },
            "connectKey": "RL3T062411030004",
            "password": "RL3T062411030004",
            "subAddress": "",
            "price": "",
            "onlineTime": 1756491309182,
            "offlineTime": 1756615529709,
            "id": 9991,
            "serviceId": 155,
            "hardware": {
                "apnMnc": "",
                "atServiceNetworkType": 1,
                "atServiceWifiState": 3,
                "apnName": "",
                "signalStrength": 4,
                "connectIp": "",
                "connectPort": "",
                "oid": 3526,
                "apnMcc": "",
                "iccid": "OR: SIM not inserted",
                "isOpenAtServiceInitialize": 2,
                "rlSinr": 0,
                "rlRsrp": 0,
                "atServiceMobileDataEnabled": false,
                "apnUser": "",
                "firmwareVersion": "RL3.TM.06.M18",
                "atServiceVersion": "QC213",
                "signal": "0",
                "apn": "",
                "apnPass": ""
            },
            "posCardPolicyId": 2259,
            "qrcodeUrl": "https://backend.energo.vip/scan/3526/RL3T062411030004",
            "userName": "RL3T062411030004",
            "supportPos": 1,
            "posAppInfo": {
                "posConnectType": 3,
                "posRegisterTime": 0,
                "posStateUpdateTime": 0,
                "adsConnectType": 0,
                "posCustomServiceUrl": "https://backend.energo.vip/",
                "appUnderlyingBoard": "",
                "posSupportLanguage": "en,nl,pt,de,es,fr,it,ko,ru,zh",
                "appScreenSubState": 0,
                "posCustomName": "Energo",
                "appModel": "",
                "posSupportWhatsapp": "",
                "readerState": 0,
                "locationId": "tml_GNVe8gpHH0gn9j",
                "appTimeZone": "",
                "posCustomSupportInfo": "energo@mail.com",
                "appSubNetworkType": 0,
                "posCustomUpdateTime": 1752127936348,
                "posSerialNumber": "STRM26214022175",
                "appAvailableSpace": 0,
                "posName": "3",
                "posAppVersionName": "L.8in.SC806.25.2043",
                "appTotalSpace": 0,
                "appScreenState": 0,
                "appInitializeTime": 1756283680199,
                "posCustomCode": "ZCC",
                "readerPower": 0.00,
                "appDisplayId": "",
                "posResources": "[{\"value\":\"https://cms7723.oss-cn-hangzhou.aliyuncs.com/2025/07/10/e882c9e7215c4f368b0aa1811e61cdb2cuub_logo.jpg\",\"key\":\"logo\"}]",
                "posModel": "",
                "posTheme": "[{\"value\":4294967295,\"key\":\"background\"}]",
                "readerScreenState": 0,
                "appScreenSubAction": 0,
                "appNetworkType": 0,
                "appAndroidVersion": "",
                "posCustomWebsocketUrl": "ws://backend.energo.vip:8093/",
                "posDefaultLanguage": "en",
                "posSupportPhone": "",
                "appIsInteractive": false,
                "posCustomVersion": "2027"
            },
            "devicenum": 6,
            "trafficInfo": {
                "threeDayCount": 0,
                "sevenDayCount": 0,
                "oneDayCount": 0
            },
            "offlineInfo": {
                "threeDayCount": 0,
                "sevenDayCount": 0,
                "oneDayCount": 0
            },
            "slotErrNum": 0,
            "chainId": 0,
            "createTime": 1748422115971,
            "positionInfo": {
                "returnNum": 0,
                "totalNum": 6,
                "borrowNum": 6,
                "rentNum": 8
            },
            "policyInfo": {
                "posCardPolicy": {
                    "priceUnit": 2,
                    "amount": 1.00,
                    "maxRentDay": 0,
                    "parameter9": "",
                    "parameter10": "",
                    "currencySymbol": "$",
                    "freeMinute": 10,
                    "dailyMaxAmount": 10.00,
                    "oid": 3526,
                    "chargePolicyType": 1,
                    "buyAmount": 0.00,
                    "parameter8": "",
                    "deposit": 50.00,
                    "parameter7": "",
                    "parameter6": "",
                    "id": 2259,
                    "parameter5": "",
                    "parameter4": "",
                    "currencyCode": "USD",
                    "parameter3": "",
                    "priceTime": 30,
                    "parameter2": "",
                    "parameter1": ""
                },
                "appPolicy": {
                    "priceUnit": 2,
                    "amount": 1.00,
                    "maxRentDay": 0,
                    "parameter9": "",
                    "parameter10": "",
                    "currencySymbol": "$",
                    "freeMinute": 10,
                    "dailyMaxAmount": 10.00,
                    "oid": 3526,
                    "chargePolicyType": 1,
                    "buyAmount": 0.00,
                    "parameter8": "",
                    "deposit": 50.00,
                    "parameter7": "",
                    "parameter6": "",
                    "id": 2258,
                    "parameter5": "",
                    "parameter4": "",
                    "currencyCode": "USD",
                    "parameter3": "",
                    "priceTime": 30,
                    "parameter2": "",
                    "parameter1": ""
                },
                "posWalletPolicy": {
                    "priceUnit": 1,
                    "amount": 3.00,
                    "maxRentDay": 0,
                    "parameter9": "",
                    "parameter10": "",
                    "currencySymbol": "$",
                    "freeMinute": 3,
                    "dailyMaxAmount": 3.00,
                    "oid": 3526,
                    "chargePolicyType": 1,
                    "buyAmount": 0.00,
                    "parameter8": "",
                    "deposit": 3.00,
                    "parameter7": "",
                    "parameter6": "",
                    "id": 2580,
                    "parameter5": "",
                    "parameter4": "",
                    "currencyCode": "USD",
                    "parameter3": "",
                    "priceTime": 1,
                    "parameter2": "",
                    "parameter1": ""
                }
            },
            "isCustom": 2,
            "posWalletPolicyId": 2580,
            "aid": 0,
            "staffId": 0,
            "status": 1
        }
    ],
    "totalElements": 1
}
```

### 2. **Get Station Availability** ⭐ CRITICAL

**Current ChargeNow**:
```
GET https://developer.chargenow.top/cdb-open-api/v1/rent/cabinet/query?deviceId={stationId}
```

**What You Need From New Supplier**:
- **Endpoint URL**: `GET /api/station/availability/{stationId}` or similar
- **Parameters**: Station/device ID
- **Purpose**: Get real-time battery availability for a specific station

**Expected Response** (ask supplier for):
```json
{
  "code": 0,
  "data": {
    "cabinet": {
      "emptySlots": 5,      // Available batteries
      "busySlots": 3,       // Batteries in use
      "totalSlots": 8,      // Total capacity
      "cabinetId": "STATION_ID"
    }
  }
}
```

**Dashboard Uses This For**:
- Showing "To Take" count (available batteries)
- Showing "To Return" count (occupied slots)
- Real-time station status

---

new supplier link

GET https://backend.energo.vip/api/cabinet/getDetail?id=9991&_t=1761086583460

expected response:
```json
{
    "devicenum": 6,
    "cabinetId": "RL3T062411030004",
    "isUpdateOta": 1,
    "isUpdateCert": 1,
    "updateTime": 1761086583545,
    "detail": [
        {
            "batteryBorrowStatus": false,
            "batteryid": "",
            "lastBatteryid": "RL3D52000068",
            "damageRentStatus": 1,
            "stockStatue": true,
            "powerPercent": "0%",
            "batteryPowerStatus": false,
            "slotStatus": 2,
            "batteryStatus": 3,
            "createTime": 0,
            "powerTemp": "0℃",
            "profitInfo": {
                "totalRentTime": 0,
                "totalRentCount": 0,
                "lastOrder": "",
                "totalRevenue": "0"
            },
            "rlSlot": 1,
            "slotBorrowStatus": false,
            "power": 0,
            "healthInfo": {
                "rstNum": 0,
                "read": 0,
                "chipNum": 0,
                "vddOvNum": 0,
                "ospNum": 0,
                "health": 0,
                "updateTime": 0,
                "vBusOvNum": 0,
                "ntcNum": 0,
                "curCapacity": "0",
                "temperature": "0",
                "uvoINum": 0,
                "batOvNum": 0,
                "cycleCount": 0,
                "cotNum": 0
            },
            "powerVolume": "0mWh"
        },
        {
            "batteryBorrowStatus": false,
            "batteryid": "",
            "lastBatteryid": "RL3D52000006",
            "damageRentStatus": 1,
            "stockStatue": true,
            "powerPercent": "0%",
            "batteryPowerStatus": false,
            "slotStatus": 2,
            "batteryStatus": 3,
            "createTime": 0,
            "powerTemp": "0℃",
            "profitInfo": {
                "totalRentTime": 0,
                "totalRentCount": 0,
                "lastOrder": "",
                "totalRevenue": "0"
            },
            "rlSlot": 2,
            "slotBorrowStatus": false,
            "power": 0,
            "healthInfo": {
                "rstNum": 0,
                "read": 0,
                "chipNum": 0,
                "vddOvNum": 0,
                "ospNum": 0,
                "health": 0,
                "updateTime": 0,
                "vBusOvNum": 0,
                "ntcNum": 0,
                "curCapacity": "0",
                "temperature": "0",
                "uvoINum": 0,
                "batOvNum": 0,
                "cycleCount": 0,
                "cotNum": 0
            },
            "powerVolume": "0mWh"
        },
        {
            "batteryBorrowStatus": false,
            "batteryid": "",
            "lastBatteryid": "RL3D52000012",
            "damageRentStatus": 1,
            "stockStatue": true,
            "powerPercent": "0%",
            "batteryPowerStatus": false,
            "slotStatus": 2,
            "batteryStatus": 3,
            "createTime": 0,
            "powerTemp": "0℃",
            "profitInfo": {
                "totalRentTime": 0,
                "totalRentCount": 0,
                "lastOrder": "",
                "totalRevenue": "0"
            },
            "rlSlot": 3,
            "slotBorrowStatus": false,
            "power": 0,
            "healthInfo": {
                "rstNum": 0,
                "read": 0,
                "chipNum": 0,
                "vddOvNum": 0,
                "ospNum": 0,
                "health": 0,
                "updateTime": 0,
                "vBusOvNum": 0,
                "ntcNum": 0,
                "curCapacity": "0",
                "temperature": "0",
                "uvoINum": 0,
                "batOvNum": 0,
                "cycleCount": 0,
                "cotNum": 0
            },
            "powerVolume": "0mWh"
        },
        {
            "batteryBorrowStatus": false,
            "batteryid": "",
            "lastBatteryid": "RL3H47000887",
            "damageRentStatus": 1,
            "stockStatue": true,
            "powerPercent": "0%",
            "batteryPowerStatus": false,
            "slotStatus": 2,
            "batteryStatus": 3,
            "createTime": 0,
            "powerTemp": "0℃",
            "profitInfo": {
                "totalRentTime": 0,
                "totalRentCount": 0,
                "lastOrder": "",
                "totalRevenue": "0"
            },
            "rlSlot": 4,
            "slotBorrowStatus": false,
            "power": 0,
            "healthInfo": {
                "rstNum": 0,
                "read": 0,
                "chipNum": 0,
                "vddOvNum": 0,
                "ospNum": 0,
                "health": 0,
                "updateTime": 0,
                "vBusOvNum": 0,
                "ntcNum": 0,
                "curCapacity": "0",
                "temperature": "0",
                "uvoINum": 0,
                "batOvNum": 0,
                "cycleCount": 0,
                "cotNum": 0
            },
            "powerVolume": "0mWh"
        },
        {
            "batteryBorrowStatus": false,
            "batteryid": "",
            "lastBatteryid": "RL3H47000897",
            "damageRentStatus": 1,
            "stockStatue": true,
            "powerPercent": "0%",
            "batteryPowerStatus": false,
            "slotStatus": 2,
            "batteryStatus": 3,
            "createTime": 0,
            "powerTemp": "0℃",
            "profitInfo": {
                "totalRentTime": 0,
                "totalRentCount": 0,
                "lastOrder": "",
                "totalRevenue": "0"
            },
            "rlSlot": 5,
            "slotBorrowStatus": false,
            "power": 0,
            "healthInfo": {
                "rstNum": 0,
                "read": 0,
                "chipNum": 0,
                "vddOvNum": 0,
                "ospNum": 0,
                "health": 0,
                "updateTime": 0,
                "vBusOvNum": 0,
                "ntcNum": 0,
                "curCapacity": "0",
                "temperature": "0",
                "uvoINum": 0,
                "batOvNum": 0,
                "cycleCount": 0,
                "cotNum": 0
            },
            "powerVolume": "0mWh"
        },
        {
            "batteryBorrowStatus": false,
            "batteryid": "",
            "lastBatteryid": "RL3H47000930",
            "damageRentStatus": 1,
            "stockStatue": true,
            "powerPercent": "0%",
            "batteryPowerStatus": false,
            "slotStatus": 2,
            "batteryStatus": 3,
            "createTime": 0,
            "powerTemp": "0℃",
            "profitInfo": {
                "totalRentTime": 0,
                "totalRentCount": 0,
                "lastOrder": "",
                "totalRevenue": "0"
            },
            "rlSlot": 6,
            "slotBorrowStatus": false,
            "power": 0,
            "healthInfo": {
                "rstNum": 0,
                "read": 0,
                "chipNum": 0,
                "vddOvNum": 0,
                "ospNum": 0,
                "health": 0,
                "updateTime": 0,
                "vBusOvNum": 0,
                "ntcNum": 0,
                "curCapacity": "0",
                "temperature": "0",
                "uvoINum": 0,
                "batOvNum": 0,
                "cycleCount": 0,
                "cotNum": 0
            },
            "powerVolume": "0mWh"
        }
    ],
    "qrcodeUrl": "https://backend.energo.vip/scan/3526/RL3T062411030004"
}
```

### 3. **Get Battery Rental Orders** ⭐ CRITICAL

**Current ChargeNow**:
```
GET https://developer.chargenow.top/cdb-open-api/v1/order/list?page={page}&limit={limit}
```

**What You Need From New Supplier**:
- **Endpoint URL**: `GET /api/orders` or `/api/rentals`
- **Parameters**:
  - `page` - Page number for pagination
  - `limit` - Number of records per page
  - **CRITICAL**: Ability to filter by date range and station

**Expected Response** (ask supplier for):
```json
{
  "code": 0,
  "page": {
    "total": 150,           // Total number of orders
    "current": 1,           // Current page
    "size": 100,            // Page size
    "records": [
      {
        "orderId": "ORDER_123",
        "batteryId": "BATT_456",
        "cabinetId": "STATION_ID",
        "settledAmount": 5.50,  // Revenue amount
        "borrowTime": "2025-10-15 10:30:00",
        "returnTime": "2025-10-15 14:45:00",
        "duration": 255,        // Minutes
        "status": "completed"
      }
      // ... more orders
    ]
  }
}
```

**Dashboard Uses This For**:
- Calculating total revenue per station
- Counting total rentals
- Displaying rental history

---

GET https://backend.energo.vip/api/order?page=0&size=10&sort=id%2Cdesc&_t=1761086995186

Expected response:
```json
{
    "content": [
        {
            "oInfo": {
                "name": "",
                "avatar": "",
                "id": 0
            },
            "starttime": 1759028294139,
            "userRemarkName": "",
            "complaintRefundStatus": 0,
            "operator": "",
            "payType": 5,
            "returnAuthAmount": 0,
            "totalPay": 0,
            "id": 485717,
            "overdueTime": 0,
            "buyoutTime": 0,
            "orderNo": "50120250928025814",
            "cabinetid": "RL3T062401000005",
            "operateId": 0,
            "selectTime": 0,
            "returnShopName": "深圳市睿联通信技术有限公司",
            "returnTime": 1759028297550,
            "transactionId": "pi_3SCAoEA8g0pGPYQd0OWkqklM",
            "prepAmount": 0.00,
            "chainId": 0,
            "buyoutRent": 0.00,
            "returnRent": 0.00,
            "balanceRentUserInfo": {
                "balanceBefore": 0,
                "userBalance": 0,
                "isNewUser": 2
            },
            "aid": 0,
            "returnSid": 3531,
            "status": 2,
            "extraAmount": 0.00,
            "billingtime": 1,
            "totalRefund": 0,
            "rentType": 2,
            "shopName": "深圳市睿联通信技术有限公司",
            "oid": 3526,
            "endStatus": 3,
            "sid": 3531,
            "realAmount": 0.00,
            "returnCabinetid": "RL3T062401000005",
            "uid": 44244,
            "perPrice": 3.00,
            "isDeduction": 0,
            "orderName": "Rent 深圳市睿联通信技术有限公司s battery",
            "amount": 3.00,
            "subsAmount": 0,
            "currencySymbol": "$",
            "endtime": 1759028297550,
            "authAmount": 0,
            "updateTime": 1759028297606,
            "balanceAmount": 0,
            "overdueRent": 0.00,
            "userName": "RL3T062401000005",
            "deviceid": "RL1H13102567",
            "returnBalanceAmount": 0,
            "returnSubAmount": 0,
            "billingunit": 1,
            "borrowStatus": 1,
            "policyId": 2580,
            "createTime": 1759028287052,
            "subOfflineAmount": 0,
            "policyInfo": {
                "priceUnit": 1,
                "amount": 3.00,
                "maxRentDay": 0,
                "parameter9": "",
                "parameter10": "",
                "currencySymbol": "$",
                "freeMinute": 3,
                "dailyMaxAmount": 3.00,
                "oid": 3526,
                "chargePolicyType": 1,
                "buyAmount": 0.00,
                "parameter8": "",
                "deposit": 3.00,
                "parameter7": "",
                "parameter6": "",
                "id": 2580,
                "parameter5": "",
                "parameter4": "",
                "currencyCode": "USD",
                "parameter3": "",
                "priceTime": 1,
                "parameter2": "",
                "parameter1": ""
            },
            "staffId": 0
        },
        {
            "oInfo": {
                "name": "",
                "avatar": "",
                "id": 0
            },
            "starttime": 1756491291603,
            "userRemarkName": "",
            "complaintRefundStatus": 0,
            "operator": "",
            "payType": 5,
            "returnAuthAmount": 0,
            "totalPay": 0,
            "id": 434054,
            "overdueTime": 0,
            "buyoutTime": 0,
            "orderNo": "50120250829181451",
            "cabinetid": "RL3T062411030004",
            "operateId": 0,
            "selectTime": 0,
            "returnShopName": "深圳市睿联通信技术有限公司",
            "returnTime": 1756491309165,
            "transactionId": "pi_3S1WovA8g0pGPYQd1Lkf2JDg",
            "prepAmount": 0.00,
            "chainId": 0,
            "buyoutRent": 0.00,
            "returnRent": 0.00,
            "balanceRentUserInfo": {
                "balanceBefore": 0,
                "userBalance": 0,
                "isNewUser": 2
            },
            "aid": 0,
            "returnSid": 3531,
            "status": 2,
            "extraAmount": 0.00,
            "billingtime": 1,
            "totalRefund": 0,
            "rentType": 2,
            "shopName": "深圳市睿联通信技术有限公司",
            "oid": 3526,
            "endStatus": 3,
            "sid": 3531,
            "realAmount": 0.00,
            "returnCabinetid": "RL3T062411030004",
            "uid": 24870,
            "perPrice": 3.00,
            "isDeduction": 0,
            "orderName": "Rent 深圳市睿联通信技术有限公司s battery",
            "amount": 3.00,
            "subsAmount": 0,
            "currencySymbol": "$",
            "endtime": 1756491309165,
            "authAmount": 0,
            "updateTime": 1756491309215,
            "balanceAmount": 0,
            "overdueRent": 0.00,
            "userName": "RL3T062411030004",
            "deviceid": "RL3D52000012",
            "returnBalanceAmount": 0,
            "returnSubAmount": 0,
            "billingunit": 1,
            "borrowStatus": 1,
            "policyId": 2580,
            "createTime": 1756491285885,
            "subOfflineAmount": 0,
            "policyInfo": {
                "priceUnit": 1,
                "amount": 3.00,
                "maxRentDay": 0,
                "parameter9": "",
                "parameter10": "",
                "currencySymbol": "$",
                "freeMinute": 3,
                "dailyMaxAmount": 3.00,
                "oid": 3526,
                "chargePolicyType": 1,
                "buyAmount": 0.00,
                "parameter8": "",
                "deposit": 3.00,
                "parameter7": "",
                "parameter6": "",
                "id": 2580,
                "parameter5": "",
                "parameter4": "",
                "currencyCode": "USD",
                "parameter3": "",
                "priceTime": 1,
                "parameter2": "",
                "parameter1": ""
            },
            "staffId": 0
        },
        {
            "oInfo": {
                "name": "",
                "avatar": "",
                "id": 0
            },
            "starttime": 1755110858371,
            "userRemarkName": "",
            "complaintRefundStatus": 0,
            "operator": "",
            "payType": 5,
            "returnAuthAmount": 0,
            "totalPay": 0,
            "id": 405658,
            "overdueTime": 0,
            "buyoutTime": 0,
            "orderNo": "50120250813184738",
            "cabinetid": "RL3T062411030004",
            "operateId": 0,
            "selectTime": 0,
            "returnShopName": "深圳市睿联通信技术有限公司",
            "returnTime": 1755110865975,
            "transactionId": "pi_3RvjhrA8g0pGPYQd0G6IekYO",
            "prepAmount": 0.00,
            "chainId": 0,
            "buyoutRent": 0.00,
            "returnRent": 0.00,
            "balanceRentUserInfo": {
                "balanceBefore": 0,
                "userBalance": 0,
                "isNewUser": 2
            },
            "aid": 0,
            "returnSid": 3531,
            "status": 2,
            "extraAmount": 0.00,
            "billingtime": 1,
            "totalRefund": 0,
            "rentType": 2,
            "shopName": "深圳市睿联通信技术有限公司",
            "oid": 3526,
            "endStatus": 3,
            "sid": 3531,
            "realAmount": 0.00,
            "returnCabinetid": "RL3T062411030004",
            "uid": 24870,
            "perPrice": 3.00,
            "isDeduction": 0,
            "orderName": "Rent 深圳市睿联通信技术有限公司s battery",
            "amount": 3.00,
            "subsAmount": 0,
            "currencySymbol": "$",
            "endtime": 1755110865975,
            "authAmount": 0,
            "updateTime": 1755110866030,
            "balanceAmount": 0,
            "overdueRent": 0.00,
            "userName": "RL3T062411030004",
            "deviceid": "RL3D52000006",
            "returnBalanceAmount": 0,
            "returnSubAmount": 0,
            "billingunit": 1,
            "borrowStatus": 1,
            "policyId": 2580,
            "createTime": 1755110852642,
            "subOfflineAmount": 0,
            "policyInfo": {
                "priceUnit": 1,
                "amount": 3.00,
                "maxRentDay": 0,
                "parameter9": "",
                "parameter10": "",
                "currencySymbol": "$",
                "freeMinute": 3,
                "dailyMaxAmount": 3.00,
                "oid": 3526,
                "chargePolicyType": 1,
                "buyAmount": 0.00,
                "parameter8": "",
                "deposit": 3.00,
                "parameter7": "",
                "parameter6": "",
                "id": 2580,
                "parameter5": "",
                "parameter4": "",
                "currencyCode": "USD",
                "parameter3": "",
                "priceTime": 1,
                "parameter2": "",
                "parameter1": ""
            },
            "staffId": 0
        },
        {
            "oInfo": {
                "name": "",
                "avatar": "",
                "id": 0
            },
            "starttime": 1754674341313,
            "userRemarkName": "",
            "complaintRefundStatus": 0,
            "operator": "",
            "payType": 5,
            "returnAuthAmount": 0,
            "totalPay": 0,
            "id": 396064,
            "overdueTime": 0,
            "buyoutTime": 0,
            "orderNo": "50120250808173221",
            "cabinetid": "RL3T062411030004",
            "operateId": 0,
            "selectTime": 0,
            "returnShopName": "深圳市睿联通信技术有限公司",
            "returnTime": 1754674358983,
            "transactionId": "pi_3Rtu9HA8g0pGPYQd1qL36irL",
            "prepAmount": 0.00,
            "chainId": 0,
            "buyoutRent": 0.00,
            "returnRent": 0.00,
            "balanceRentUserInfo": {
                "balanceBefore": 0,
                "userBalance": 0,
                "isNewUser": 2
            },
            "aid": 0,
            "returnSid": 3531,
            "status": 2,
            "extraAmount": 0.00,
            "billingtime": 1,
            "totalRefund": 0,
            "rentType": 2,
            "shopName": "深圳市睿联通信技术有限公司",
            "oid": 3526,
            "endStatus": 3,
            "sid": 3531,
            "realAmount": 0.00,
            "returnCabinetid": "RL3T062411030004",
            "uid": 24870,
            "perPrice": 3.00,
            "isDeduction": 0,
            "orderName": "Rent 深圳市睿联通信技术有限公司s battery",
            "amount": 3.00,
            "subsAmount": 0,
            "currencySymbol": "$",
            "endtime": 1754674358983,
            "authAmount": 0,
            "updateTime": 1754674359032,
            "balanceAmount": 0,
            "overdueRent": 0.00,
            "userName": "RL3T062411030004",
            "deviceid": "RL3H47000930",
            "returnBalanceAmount": 0,
            "returnSubAmount": 0,
            "billingunit": 1,
            "borrowStatus": 1,
            "policyId": 2580,
            "createTime": 1754674335601,
            "subOfflineAmount": 0,
            "policyInfo": {
                "priceUnit": 1,
                "amount": 3.00,
                "maxRentDay": 0,
                "parameter9": "",
                "parameter10": "",
                "currencySymbol": "$",
                "freeMinute": 3,
                "dailyMaxAmount": 3.00,
                "oid": 3526,
                "chargePolicyType": 1,
                "buyAmount": 0.00,
                "parameter8": "",
                "deposit": 3.00,
                "parameter7": "",
                "parameter6": "",
                "id": 2580,
                "parameter5": "",
                "parameter4": "",
                "currencyCode": "USD",
                "parameter3": "",
                "priceTime": 1,
                "parameter2": "",
                "parameter1": ""
            },
            "staffId": 0
        },
        {
            "oInfo": {
                "name": "",
                "avatar": "",
                "id": 0
            },
            "starttime": 1754631254748,
            "userRemarkName": "",
            "complaintRefundStatus": 0,
            "operator": "",
            "payType": 5,
            "returnAuthAmount": 0,
            "totalPay": 0,
            "id": 395218,
            "overdueTime": 0,
            "buyoutTime": 0,
            "orderNo": "50120250808053414",
            "cabinetid": "RL3T062411030004",
            "operateId": 0,
            "selectTime": 0,
            "returnShopName": "深圳市睿联通信技术有限公司",
            "returnTime": 1754631304194,
            "transactionId": "pi_3RtivmA8g0pGPYQd1Q1vDmsp",
            "prepAmount": 0.00,
            "chainId": 0,
            "buyoutRent": 0.00,
            "returnRent": 0.00,
            "balanceRentUserInfo": {
                "balanceBefore": 0,
                "userBalance": 0,
                "isNewUser": 2
            },
            "aid": 0,
            "returnSid": 3531,
            "status": 2,
            "extraAmount": 0.00,
            "billingtime": 1,
            "totalRefund": 0,
            "rentType": 2,
            "shopName": "深圳市睿联通信技术有限公司",
            "oid": 3526,
            "endStatus": 3,
            "sid": 3531,
            "realAmount": 0.00,
            "returnCabinetid": "RL3T062411030004",
            "uid": 24870,
            "perPrice": 3.00,
            "isDeduction": 0,
            "orderName": "Rent 深圳市睿联通信技术有限公司s battery",
            "amount": 3.00,
            "subsAmount": 0,
            "currencySymbol": "$",
            "endtime": 1754631304194,
            "authAmount": 0,
            "updateTime": 1754631304252,
            "balanceAmount": 0,
            "overdueRent": 0.00,
            "userName": "RL3T062411030004",
            "deviceid": "RL3H47000897",
            "returnBalanceAmount": 0,
            "returnSubAmount": 0,
            "billingunit": 1,
            "borrowStatus": 1,
            "policyId": 2580,
            "createTime": 1754631242506,
            "subOfflineAmount": 0,
            "policyInfo": {
                "priceUnit": 1,
                "amount": 3.00,
                "maxRentDay": 0,
                "parameter9": "",
                "parameter10": "",
                "currencySymbol": "$",
                "freeMinute": 3,
                "dailyMaxAmount": 3.00,
                "oid": 3526,
                "chargePolicyType": 1,
                "buyAmount": 0.00,
                "parameter8": "",
                "deposit": 3.00,
                "parameter7": "",
                "parameter6": "",
                "id": 2580,
                "parameter5": "",
                "parameter4": "",
                "currencyCode": "USD",
                "parameter3": "",
                "priceTime": 1,
                "parameter2": "",
                "parameter1": ""
            },
            "staffId": 0
        },
        {
            "oInfo": {
                "name": "",
                "avatar": "",
                "id": 0
            },
            "starttime": 1752413995196,
            "userRemarkName": "",
            "complaintRefundStatus": 0,
            "operator": "",
            "payType": 5,
            "returnAuthAmount": 0,
            "totalPay": 0,
            "id": 355336,
            "overdueTime": 0,
            "buyoutTime": 0,
            "orderNo": "50120250713133955",
            "cabinetid": "RL3T062411030004",
            "operateId": 0,
            "selectTime": 0,
            "returnShopName": "深圳市睿联通信技术有限公司",
            "returnTime": 1752414009188,
            "transactionId": "pi_3RkQ7lA8g0pGPYQd0sKFpNWL",
            "prepAmount": 0.00,
            "chainId": 0,
            "buyoutRent": 0.00,
            "returnRent": 0.00,
            "balanceRentUserInfo": {
                "balanceBefore": 0,
                "userBalance": 0,
                "isNewUser": 2
            },
            "aid": 0,
            "returnSid": 3531,
            "status": 2,
            "extraAmount": 0.00,
            "billingtime": 1,
            "totalRefund": 0,
            "rentType": 2,
            "shopName": "深圳市睿联通信技术有限公司",
            "oid": 3526,
            "endStatus": 3,
            "sid": 3531,
            "realAmount": 0.00,
            "returnCabinetid": "RL3T062411030004",
            "uid": 24870,
            "perPrice": 3.00,
            "isDeduction": 0,
            "orderName": "Rent 深圳市睿联通信技术有限公司s battery",
            "amount": 3.00,
            "subsAmount": 0,
            "currencySymbol": "$",
            "endtime": 1752414009188,
            "authAmount": 0,
            "updateTime": 1752414009228,
            "balanceAmount": 0,
            "overdueRent": 0.00,
            "userName": "RL3T062411030004",
            "deviceid": "RL3H47000887",
            "returnBalanceAmount": 0,
            "returnSubAmount": 0,
            "billingunit": 1,
            "borrowStatus": 1,
            "policyId": 2580,
            "createTime": 1752413990034,
            "subOfflineAmount": 0,
            "policyInfo": {
                "priceUnit": 1,
                "amount": 3.00,
                "maxRentDay": 0,
                "parameter9": "",
                "parameter10": "",
                "currencySymbol": "$",
                "freeMinute": 3,
                "dailyMaxAmount": 3.00,
                "oid": 3526,
                "chargePolicyType": 1,
                "buyAmount": 0.00,
                "parameter8": "",
                "deposit": 3.00,
                "parameter7": "",
                "parameter6": "",
                "id": 2580,
                "parameter5": "",
                "parameter4": "",
                "currencyCode": "USD",
                "parameter3": "",
                "priceTime": 1,
                "parameter2": "",
                "parameter1": ""
            },
            "staffId": 0
        },
        {
            "oInfo": {
                "name": "",
                "avatar": "",
                "id": 0
            },
            "starttime": 1752339418107,
            "userRemarkName": "",
            "complaintRefundStatus": 0,
            "operator": "",
            "payType": 5,
            "returnAuthAmount": 0,
            "totalPay": 0,
            "id": 352987,
            "overdueTime": 0,
            "buyoutTime": 0,
            "orderNo": "50120250712165658",
            "cabinetid": "RL3T062411030004",
            "operateId": 0,
            "selectTime": 0,
            "returnShopName": "深圳市睿联通信技术有限公司",
            "returnTime": 1752339420302,
            "transactionId": "pi_3Rk6jFA8g0pGPYQd0j9z27f0",
            "prepAmount": 0.00,
            "chainId": 0,
            "buyoutRent": 0.00,
            "returnRent": 0.00,
            "balanceRentUserInfo": {
                "balanceBefore": 0,
                "userBalance": 0,
                "isNewUser": 2
            },
            "aid": 0,
            "returnSid": 3531,
            "status": 2,
            "extraAmount": 0.00,
            "billingtime": 1,
            "totalRefund": 0,
            "rentType": 2,
            "shopName": "深圳市睿联通信技术有限公司",
            "oid": 3526,
            "endStatus": 3,
            "sid": 3531,
            "realAmount": 0.00,
            "returnCabinetid": "RL3T062411030004",
            "uid": 24870,
            "perPrice": 3.00,
            "isDeduction": 0,
            "orderName": "Rent 深圳市睿联通信技术有限公司s battery",
            "amount": 3.00,
            "subsAmount": 0,
            "currencySymbol": "$",
            "endtime": 1752339420302,
            "authAmount": 0,
            "updateTime": 1752339420419,
            "balanceAmount": 0,
            "overdueRent": 0.00,
            "userName": "RL3T062411030004",
            "deviceid": "RL3D52000068",
            "returnBalanceAmount": 0,
            "returnSubAmount": 0,
            "billingunit": 1,
            "borrowStatus": 1,
            "policyId": 2580,
            "createTime": 1752339413042,
            "subOfflineAmount": 0,
            "policyInfo": {
                "priceUnit": 1,
                "amount": 3.00,
                "maxRentDay": 0,
                "parameter9": "",
                "parameter10": "",
                "currencySymbol": "$",
                "freeMinute": 3,
                "dailyMaxAmount": 3.00,
                "oid": 3526,
                "chargePolicyType": 1,
                "buyAmount": 0.00,
                "parameter8": "",
                "deposit": 3.00,
                "parameter7": "",
                "parameter6": "",
                "id": 2580,
                "parameter5": "",
                "parameter4": "",
                "currencyCode": "USD",
                "parameter3": "",
                "priceTime": 1,
                "parameter2": "",
                "parameter1": ""
            },
            "staffId": 0
        },
        {
            "oInfo": {
                "name": "",
                "avatar": "",
                "id": 0
            },
            "starttime": 1752339344010,
            "userRemarkName": "",
            "complaintRefundStatus": 0,
            "operator": "",
            "payType": 5,
            "returnAuthAmount": 0,
            "totalPay": 0,
            "id": 352981,
            "overdueTime": 0,
            "buyoutTime": 0,
            "orderNo": "50120250712165544",
            "cabinetid": "RL3T062411030004",
            "operateId": 0,
            "selectTime": 0,
            "returnShopName": "深圳市睿联通信技术有限公司",
            "returnTime": 1752339428105,
            "transactionId": "pi_3Rk6i2A8g0pGPYQd0fzLZRu6",
            "prepAmount": 0.00,
            "chainId": 0,
            "buyoutRent": 0.00,
            "returnRent": 0.00,
            "balanceRentUserInfo": {
                "balanceBefore": 0,
                "userBalance": 0,
                "isNewUser": 2
            },
            "aid": 0,
            "returnSid": 3531,
            "status": 2,
            "extraAmount": 0.00,
            "billingtime": 1,
            "totalRefund": 0,
            "rentType": 2,
            "shopName": "深圳市睿联通信技术有限公司",
            "oid": 3526,
            "endStatus": 3,
            "sid": 3531,
            "realAmount": 0.00,
            "returnCabinetid": "RL3T062411030004",
            "uid": 24870,
            "perPrice": 3.00,
            "isDeduction": 0,
            "orderName": "Rent 深圳市睿联通信技术有限公司s battery",
            "amount": 3.00,
            "subsAmount": 0,
            "currencySymbol": "$",
            "endtime": 1752339428105,
            "authAmount": 0,
            "updateTime": 1752339428141,
            "balanceAmount": 0,
            "overdueRent": 0.00,
            "userName": "RL3T062411030004",
            "deviceid": "RL3D52000012",
            "returnBalanceAmount": 0,
            "returnSubAmount": 0,
            "billingunit": 1,
            "borrowStatus": 1,
            "policyId": 2580,
            "createTime": 1752339339016,
            "subOfflineAmount": 0,
            "policyInfo": {
                "priceUnit": 1,
                "amount": 3.00,
                "maxRentDay": 0,
                "parameter9": "",
                "parameter10": "",
                "currencySymbol": "$",
                "freeMinute": 3,
                "dailyMaxAmount": 3.00,
                "oid": 3526,
                "chargePolicyType": 1,
                "buyAmount": 0.00,
                "parameter8": "",
                "deposit": 3.00,
                "parameter7": "",
                "parameter6": "",
                "id": 2580,
                "parameter5": "",
                "parameter4": "",
                "currencyCode": "USD",
                "parameter3": "",
                "priceTime": 1,
                "parameter2": "",
                "parameter1": ""
            },
            "staffId": 0
        },
        {
            "oInfo": {
                "name": "",
                "avatar": "",
                "id": 0
            },
            "starttime": 1752160877717,
            "userRemarkName": "",
            "complaintRefundStatus": 0,
            "operator": "",
            "payType": 5,
            "returnAuthAmount": 0,
            "totalPay": 0,
            "id": 348356,
            "overdueTime": 0,
            "buyoutTime": 0,
            "orderNo": "50120250710152117",
            "cabinetid": "RL3T062411030004",
            "operateId": 0,
            "selectTime": 0,
            "returnShopName": "深圳市睿联通信技术有限公司",
            "returnTime": 1752160887942,
            "transactionId": "pi_3RjMHYA8g0pGPYQd0PfrWxMj",
            "prepAmount": 0.00,
            "chainId": 0,
            "buyoutRent": 0.00,
            "returnRent": 0.00,
            "balanceRentUserInfo": {
                "balanceBefore": 0,
                "userBalance": 0,
                "isNewUser": 2
            },
            "aid": 0,
            "returnSid": 3531,
            "status": 2,
            "extraAmount": 0.00,
            "billingtime": 1,
            "totalRefund": 0,
            "rentType": 2,
            "shopName": "深圳市睿联通信技术有限公司",
            "oid": 3526,
            "endStatus": 3,
            "sid": 3531,
            "realAmount": 0.00,
            "returnCabinetid": "RL3T062411030004",
            "uid": 24870,
            "perPrice": 3.00,
            "isDeduction": 0,
            "orderName": "Rent 深圳市睿联通信技术有限公司s battery",
            "amount": 3.00,
            "subsAmount": 0,
            "currencySymbol": "$",
            "endtime": 1752160887942,
            "authAmount": 0,
            "updateTime": 1752160887989,
            "balanceAmount": 0,
            "overdueRent": 0.00,
            "userName": "RL3T062411030004",
            "deviceid": "RL3D52000006",
            "returnBalanceAmount": 0,
            "returnSubAmount": 0,
            "billingunit": 1,
            "borrowStatus": 1,
            "policyId": 2580,
            "createTime": 1752160872720,
            "subOfflineAmount": 0,
            "policyInfo": {
                "priceUnit": 1,
                "amount": 3.00,
                "maxRentDay": 0,
                "parameter9": "",
                "parameter10": "",
                "currencySymbol": "$",
                "freeMinute": 3,
                "dailyMaxAmount": 3.00,
                "oid": 3526,
                "chargePolicyType": 1,
                "buyAmount": 0.00,
                "parameter8": "",
                "deposit": 3.00,
                "parameter7": "",
                "parameter6": "",
                "id": 2580,
                "parameter5": "",
                "parameter4": "",
                "currencyCode": "USD",
                "parameter3": "",
                "priceTime": 1,
                "parameter2": "",
                "parameter1": ""
            },
            "staffId": 0
        }
    ],
    "totalElements": 9
}
```

### 4. **Get Station-Specific Rental History** ⭐ CRITICAL

**Current ChargeNow**:
```
GET https://developer.chargenow.top/cdb-open-api/v1/order/list?pCabinetid={stationId}&sTime={startTime}&eTime={endTime}&page={page}&limit={limit}
```

**What You Need From New Supplier**:
- **Endpoint URL**: `GET /api/orders/by-station` or similar
- **Parameters**:
  - `stationId` - Filter by specific station
  - `startDate` or `sTime` - Start of date range
  - `endDate` or `eTime` - End of date range
  - `page` - Page number
  - `limit` - Records per page

**Date Format** (ask supplier):
- ChargeNow uses: `"2025-10-01 00:00:00"` (YYYY-MM-DD HH:mm:ss)
- What does new supplier use?

**Expected Response**: Same as #3 above, but filtered

**Dashboard Uses This For**:
- **Revenue calculation** per station for specific date range
- **Rental count** per station for specific date range
- User-selected date filtering
- Take-home payment calculations

**New Supplier API**
```
GET https://backend.energo.vip/api/order?page=0&size=10&cabinetid={stationId}&sort=id%2Cdesc&_t=1761087453406
```
Example response:
```json
{
    "content": [
        {
            "oInfo": {
                "name": "",
                "avatar": "",
                "id": 0
            },
            "starttime": 1756491291603,
            "userRemarkName": "",
            "complaintRefundStatus": 0,
            "operator": "",
            "payType": 5,
            "returnAuthAmount": 0,
            "totalPay": 0,
            "id": 434054,
            "overdueTime": 0,
            "buyoutTime": 0,
            "orderNo": "50120250829181451",
            "cabinetid": "RL3T062411030004",
            "operateId": 0,
            "selectTime": 0,
            "returnShopName": "深圳市睿联通信技术有限公司",
            "returnTime": 1756491309165,
            "transactionId": "pi_3S1WovA8g0pGPYQd1Lkf2JDg",
            "prepAmount": 0.00,
            "chainId": 0,
            "buyoutRent": 0.00,
            "returnRent": 0.00,
            "balanceRentUserInfo": {
                "balanceBefore": 0,
                "userBalance": 0,
                "isNewUser": 2
            },
            "aid": 0,
            "returnSid": 3531,
            "status": 2,
            "extraAmount": 0.00,
            "billingtime": 1,
            "totalRefund": 0,
            "rentType": 2,
            "shopName": "深圳市睿联通信技术有限公司",
            "oid": 3526,
            "endStatus": 3,
            "sid": 3531,
            "realAmount": 0.00,
            "returnCabinetid": "RL3T062411030004",
            "uid": 24870,
            "perPrice": 3.00,
            "isDeduction": 0,
            "orderName": "Rent 深圳市睿联通信技术有限公司s battery",
            "amount": 3.00,
            "subsAmount": 0,
            "currencySymbol": "$",
            "endtime": 1756491309165,
            "authAmount": 0,
            "updateTime": 1756491309215,
            "balanceAmount": 0,
            "overdueRent": 0.00,
            "userName": "RL3T062411030004",
            "deviceid": "RL3D52000012",
            "returnBalanceAmount": 0,
            "returnSubAmount": 0,
            "billingunit": 1,
            "borrowStatus": 1,
            "policyId": 2580,
            "createTime": 1756491285885,
            "subOfflineAmount": 0,
            "policyInfo": {
                "priceUnit": 1,
                "amount": 3.00,
                "maxRentDay": 0,
                "parameter9": "",
                "parameter10": "",
                "currencySymbol": "$",
                "freeMinute": 3,
                "dailyMaxAmount": 3.00,
                "oid": 3526,
                "chargePolicyType": 1,
                "buyAmount": 0.00,
                "parameter8": "",
                "deposit": 3.00,
                "parameter7": "",
                "parameter6": "",
                "id": 2580,
                "parameter5": "",
                "parameter4": "",
                "currencyCode": "USD",
                "parameter3": "",
                "priceTime": 1,
                "parameter2": "",
                "parameter1": ""
            },
            "staffId": 0
        },
        {
            "oInfo": {
                "name": "",
                "avatar": "",
                "id": 0
            },
            "starttime": 1755110858371,
            "userRemarkName": "",
            "complaintRefundStatus": 0,
            "operator": "",
            "payType": 5,
            "returnAuthAmount": 0,
            "totalPay": 0,
            "id": 405658,
            "overdueTime": 0,
            "buyoutTime": 0,
            "orderNo": "50120250813184738",
            "cabinetid": "RL3T062411030004",
            "operateId": 0,
            "selectTime": 0,
            "returnShopName": "深圳市睿联通信技术有限公司",
            "returnTime": 1755110865975,
            "transactionId": "pi_3RvjhrA8g0pGPYQd0G6IekYO",
            "prepAmount": 0.00,
            "chainId": 0,
            "buyoutRent": 0.00,
            "returnRent": 0.00,
            "balanceRentUserInfo": {
                "balanceBefore": 0,
                "userBalance": 0,
                "isNewUser": 2
            },
            "aid": 0,
            "returnSid": 3531,
            "status": 2,
            "extraAmount": 0.00,
            "billingtime": 1,
            "totalRefund": 0,
            "rentType": 2,
            "shopName": "深圳市睿联通信技术有限公司",
            "oid": 3526,
            "endStatus": 3,
            "sid": 3531,
            "realAmount": 0.00,
            "returnCabinetid": "RL3T062411030004",
            "uid": 24870,
            "perPrice": 3.00,
            "isDeduction": 0,
            "orderName": "Rent 深圳市睿联通信技术有限公司s battery",
            "amount": 3.00,
            "subsAmount": 0,
            "currencySymbol": "$",
            "endtime": 1755110865975,
            "authAmount": 0,
            "updateTime": 1755110866030,
            "balanceAmount": 0,
            "overdueRent": 0.00,
            "userName": "RL3T062411030004",
            "deviceid": "RL3D52000006",
            "returnBalanceAmount": 0,
            "returnSubAmount": 0,
            "billingunit": 1,
            "borrowStatus": 1,
            "policyId": 2580,
            "createTime": 1755110852642,
            "subOfflineAmount": 0,
            "policyInfo": {
                "priceUnit": 1,
                "amount": 3.00,
                "maxRentDay": 0,
                "parameter9": "",
                "parameter10": "",
                "currencySymbol": "$",
                "freeMinute": 3,
                "dailyMaxAmount": 3.00,
                "oid": 3526,
                "chargePolicyType": 1,
                "buyAmount": 0.00,
                "parameter8": "",
                "deposit": 3.00,
                "parameter7": "",
                "parameter6": "",
                "id": 2580,
                "parameter5": "",
                "parameter4": "",
                "currencyCode": "USD",
                "parameter3": "",
                "priceTime": 1,
                "parameter2": "",
                "parameter1": ""
            },
            "staffId": 0
        },
        {
            "oInfo": {
                "name": "",
                "avatar": "",
                "id": 0
            },
            "starttime": 1754674341313,
            "userRemarkName": "",
            "complaintRefundStatus": 0,
            "operator": "",
            "payType": 5,
            "returnAuthAmount": 0,
            "totalPay": 0,
            "id": 396064,
            "overdueTime": 0,
            "buyoutTime": 0,
            "orderNo": "50120250808173221",
            "cabinetid": "RL3T062411030004",
            "operateId": 0,
            "selectTime": 0,
            "returnShopName": "深圳市睿联通信技术有限公司",
            "returnTime": 1754674358983,
            "transactionId": "pi_3Rtu9HA8g0pGPYQd1qL36irL",
            "prepAmount": 0.00,
            "chainId": 0,
            "buyoutRent": 0.00,
            "returnRent": 0.00,
            "balanceRentUserInfo": {
                "balanceBefore": 0,
                "userBalance": 0,
                "isNewUser": 2
            },
            "aid": 0,
            "returnSid": 3531,
            "status": 2,
            "extraAmount": 0.00,
            "billingtime": 1,
            "totalRefund": 0,
            "rentType": 2,
            "shopName": "深圳市睿联通信技术有限公司",
            "oid": 3526,
            "endStatus": 3,
            "sid": 3531,
            "realAmount": 0.00,
            "returnCabinetid": "RL3T062411030004",
            "uid": 24870,
            "perPrice": 3.00,
            "isDeduction": 0,
            "orderName": "Rent 深圳市睿联通信技术有限公司s battery",
            "amount": 3.00,
            "subsAmount": 0,
            "currencySymbol": "$",
            "endtime": 1754674358983,
            "authAmount": 0,
            "updateTime": 1754674359032,
            "balanceAmount": 0,
            "overdueRent": 0.00,
            "userName": "RL3T062411030004",
            "deviceid": "RL3H47000930",
            "returnBalanceAmount": 0,
            "returnSubAmount": 0,
            "billingunit": 1,
            "borrowStatus": 1,
            "policyId": 2580,
            "createTime": 1754674335601,
            "subOfflineAmount": 0,
            "policyInfo": {
                "priceUnit": 1,
                "amount": 3.00,
                "maxRentDay": 0,
                "parameter9": "",
                "parameter10": "",
                "currencySymbol": "$",
                "freeMinute": 3,
                "dailyMaxAmount": 3.00,
                "oid": 3526,
                "chargePolicyType": 1,
                "buyAmount": 0.00,
                "parameter8": "",
                "deposit": 3.00,
                "parameter7": "",
                "parameter6": "",
                "id": 2580,
                "parameter5": "",
                "parameter4": "",
                "currencyCode": "USD",
                "parameter3": "",
                "priceTime": 1,
                "parameter2": "",
                "parameter1": ""
            },
            "staffId": 0
        },
        {
            "oInfo": {
                "name": "",
                "avatar": "",
                "id": 0
            },
            "starttime": 1754631254748,
            "userRemarkName": "",
            "complaintRefundStatus": 0,
            "operator": "",
            "payType": 5,
            "returnAuthAmount": 0,
            "totalPay": 0,
            "id": 395218,
            "overdueTime": 0,
            "buyoutTime": 0,
            "orderNo": "50120250808053414",
            "cabinetid": "RL3T062411030004",
            "operateId": 0,
            "selectTime": 0,
            "returnShopName": "深圳市睿联通信技术有限公司",
            "returnTime": 1754631304194,
            "transactionId": "pi_3RtivmA8g0pGPYQd1Q1vDmsp",
            "prepAmount": 0.00,
            "chainId": 0,
            "buyoutRent": 0.00,
            "returnRent": 0.00,
            "balanceRentUserInfo": {
                "balanceBefore": 0,
                "userBalance": 0,
                "isNewUser": 2
            },
            "aid": 0,
            "returnSid": 3531,
            "status": 2,
            "extraAmount": 0.00,
            "billingtime": 1,
            "totalRefund": 0,
            "rentType": 2,
            "shopName": "深圳市睿联通信技术有限公司",
            "oid": 3526,
            "endStatus": 3,
            "sid": 3531,
            "realAmount": 0.00,
            "returnCabinetid": "RL3T062411030004",
            "uid": 24870,
            "perPrice": 3.00,
            "isDeduction": 0,
            "orderName": "Rent 深圳市睿联通信技术有限公司s battery",
            "amount": 3.00,
            "subsAmount": 0,
            "currencySymbol": "$",
            "endtime": 1754631304194,
            "authAmount": 0,
            "updateTime": 1754631304252,
            "balanceAmount": 0,
            "overdueRent": 0.00,
            "userName": "RL3T062411030004",
            "deviceid": "RL3H47000897",
            "returnBalanceAmount": 0,
            "returnSubAmount": 0,
            "billingunit": 1,
            "borrowStatus": 1,
            "policyId": 2580,
            "createTime": 1754631242506,
            "subOfflineAmount": 0,
            "policyInfo": {
                "priceUnit": 1,
                "amount": 3.00,
                "maxRentDay": 0,
                "parameter9": "",
                "parameter10": "",
                "currencySymbol": "$",
                "freeMinute": 3,
                "dailyMaxAmount": 3.00,
                "oid": 3526,
                "chargePolicyType": 1,
                "buyAmount": 0.00,
                "parameter8": "",
                "deposit": 3.00,
                "parameter7": "",
                "parameter6": "",
                "id": 2580,
                "parameter5": "",
                "parameter4": "",
                "currencyCode": "USD",
                "parameter3": "",
                "priceTime": 1,
                "parameter2": "",
                "parameter1": ""
            },
            "staffId": 0
        },
        {
            "oInfo": {
                "name": "",
                "avatar": "",
                "id": 0
            },
            "starttime": 1752413995196,
            "userRemarkName": "",
            "complaintRefundStatus": 0,
            "operator": "",
            "payType": 5,
            "returnAuthAmount": 0,
            "totalPay": 0,
            "id": 355336,
            "overdueTime": 0,
            "buyoutTime": 0,
            "orderNo": "50120250713133955",
            "cabinetid": "RL3T062411030004",
            "operateId": 0,
            "selectTime": 0,
            "returnShopName": "深圳市睿联通信技术有限公司",
            "returnTime": 1752414009188,
            "transactionId": "pi_3RkQ7lA8g0pGPYQd0sKFpNWL",
            "prepAmount": 0.00,
            "chainId": 0,
            "buyoutRent": 0.00,
            "returnRent": 0.00,
            "balanceRentUserInfo": {
                "balanceBefore": 0,
                "userBalance": 0,
                "isNewUser": 2
            },
            "aid": 0,
            "returnSid": 3531,
            "status": 2,
            "extraAmount": 0.00,
            "billingtime": 1,
            "totalRefund": 0,
            "rentType": 2,
            "shopName": "深圳市睿联通信技术有限公司",
            "oid": 3526,
            "endStatus": 3,
            "sid": 3531,
            "realAmount": 0.00,
            "returnCabinetid": "RL3T062411030004",
            "uid": 24870,
            "perPrice": 3.00,
            "isDeduction": 0,
            "orderName": "Rent 深圳市睿联通信技术有限公司s battery",
            "amount": 3.00,
            "subsAmount": 0,
            "currencySymbol": "$",
            "endtime": 1752414009188,
            "authAmount": 0,
            "updateTime": 1752414009228,
            "balanceAmount": 0,
            "overdueRent": 0.00,
            "userName": "RL3T062411030004",
            "deviceid": "RL3H47000887",
            "returnBalanceAmount": 0,
            "returnSubAmount": 0,
            "billingunit": 1,
            "borrowStatus": 1,
            "policyId": 2580,
            "createTime": 1752413990034,
            "subOfflineAmount": 0,
            "policyInfo": {
                "priceUnit": 1,
                "amount": 3.00,
                "maxRentDay": 0,
                "parameter9": "",
                "parameter10": "",
                "currencySymbol": "$",
                "freeMinute": 3,
                "dailyMaxAmount": 3.00,
                "oid": 3526,
                "chargePolicyType": 1,
                "buyAmount": 0.00,
                "parameter8": "",
                "deposit": 3.00,
                "parameter7": "",
                "parameter6": "",
                "id": 2580,
                "parameter5": "",
                "parameter4": "",
                "currencyCode": "USD",
                "parameter3": "",
                "priceTime": 1,
                "parameter2": "",
                "parameter1": ""
            },
            "staffId": 0
        },
        {
            "oInfo": {
                "name": "",
                "avatar": "",
                "id": 0
            },
            "starttime": 1752339418107,
            "userRemarkName": "",
            "complaintRefundStatus": 0,
            "operator": "",
            "payType": 5,
            "returnAuthAmount": 0,
            "totalPay": 0,
            "id": 352987,
            "overdueTime": 0,
            "buyoutTime": 0,
            "orderNo": "50120250712165658",
            "cabinetid": "RL3T062411030004",
            "operateId": 0,
            "selectTime": 0,
            "returnShopName": "深圳市睿联通信技术有限公司",
            "returnTime": 1752339420302,
            "transactionId": "pi_3Rk6jFA8g0pGPYQd0j9z27f0",
            "prepAmount": 0.00,
            "chainId": 0,
            "buyoutRent": 0.00,
            "returnRent": 0.00,
            "balanceRentUserInfo": {
                "balanceBefore": 0,
                "userBalance": 0,
                "isNewUser": 2
            },
            "aid": 0,
            "returnSid": 3531,
            "status": 2,
            "extraAmount": 0.00,
            "billingtime": 1,
            "totalRefund": 0,
            "rentType": 2,
            "shopName": "深圳市睿联通信技术有限公司",
            "oid": 3526,
            "endStatus": 3,
            "sid": 3531,
            "realAmount": 0.00,
            "returnCabinetid": "RL3T062411030004",
            "uid": 24870,
            "perPrice": 3.00,
            "isDeduction": 0,
            "orderName": "Rent 深圳市睿联通信技术有限公司s battery",
            "amount": 3.00,
            "subsAmount": 0,
            "currencySymbol": "$",
            "endtime": 1752339420302,
            "authAmount": 0,
            "updateTime": 1752339420419,
            "balanceAmount": 0,
            "overdueRent": 0.00,
            "userName": "RL3T062411030004",
            "deviceid": "RL3D52000068",
            "returnBalanceAmount": 0,
            "returnSubAmount": 0,
            "billingunit": 1,
            "borrowStatus": 1,
            "policyId": 2580,
            "createTime": 1752339413042,
            "subOfflineAmount": 0,
            "policyInfo": {
                "priceUnit": 1,
                "amount": 3.00,
                "maxRentDay": 0,
                "parameter9": "",
                "parameter10": "",
                "currencySymbol": "$",
                "freeMinute": 3,
                "dailyMaxAmount": 3.00,
                "oid": 3526,
                "chargePolicyType": 1,
                "buyAmount": 0.00,
                "parameter8": "",
                "deposit": 3.00,
                "parameter7": "",
                "parameter6": "",
                "id": 2580,
                "parameter5": "",
                "parameter4": "",
                "currencyCode": "USD",
                "parameter3": "",
                "priceTime": 1,
                "parameter2": "",
                "parameter1": ""
            },
            "staffId": 0
        },
        {
            "oInfo": {
                "name": "",
                "avatar": "",
                "id": 0
            },
            "starttime": 1752339344010,
            "userRemarkName": "",
            "complaintRefundStatus": 0,
            "operator": "",
            "payType": 5,
            "returnAuthAmount": 0,
            "totalPay": 0,
            "id": 352981,
            "overdueTime": 0,
            "buyoutTime": 0,
            "orderNo": "50120250712165544",
            "cabinetid": "RL3T062411030004",
            "operateId": 0,
            "selectTime": 0,
            "returnShopName": "深圳市睿联通信技术有限公司",
            "returnTime": 1752339428105,
            "transactionId": "pi_3Rk6i2A8g0pGPYQd0fzLZRu6",
            "prepAmount": 0.00,
            "chainId": 0,
            "buyoutRent": 0.00,
            "returnRent": 0.00,
            "balanceRentUserInfo": {
                "balanceBefore": 0,
                "userBalance": 0,
                "isNewUser": 2
            },
            "aid": 0,
            "returnSid": 3531,
            "status": 2,
            "extraAmount": 0.00,
            "billingtime": 1,
            "totalRefund": 0,
            "rentType": 2,
            "shopName": "深圳市睿联通信技术有限公司",
            "oid": 3526,
            "endStatus": 3,
            "sid": 3531,
            "realAmount": 0.00,
            "returnCabinetid": "RL3T062411030004",
            "uid": 24870,
            "perPrice": 3.00,
            "isDeduction": 0,
            "orderName": "Rent 深圳市睿联通信技术有限公司s battery",
            "amount": 3.00,
            "subsAmount": 0,
            "currencySymbol": "$",
            "endtime": 1752339428105,
            "authAmount": 0,
            "updateTime": 1752339428141,
            "balanceAmount": 0,
            "overdueRent": 0.00,
            "userName": "RL3T062411030004",
            "deviceid": "RL3D52000012",
            "returnBalanceAmount": 0,
            "returnSubAmount": 0,
            "billingunit": 1,
            "borrowStatus": 1,
            "policyId": 2580,
            "createTime": 1752339339016,
            "subOfflineAmount": 0,
            "policyInfo": {
                "priceUnit": 1,
                "amount": 3.00,
                "maxRentDay": 0,
                "parameter9": "",
                "parameter10": "",
                "currencySymbol": "$",
                "freeMinute": 3,
                "dailyMaxAmount": 3.00,
                "oid": 3526,
                "chargePolicyType": 1,
                "buyAmount": 0.00,
                "parameter8": "",
                "deposit": 3.00,
                "parameter7": "",
                "parameter6": "",
                "id": 2580,
                "parameter5": "",
                "parameter4": "",
                "currencyCode": "USD",
                "parameter3": "",
                "priceTime": 1,
                "parameter2": "",
                "parameter1": ""
            },
            "staffId": 0
        },
        {
            "oInfo": {
                "name": "",
                "avatar": "",
                "id": 0
            },
            "starttime": 1752160877717,
            "userRemarkName": "",
            "complaintRefundStatus": 0,
            "operator": "",
            "payType": 5,
            "returnAuthAmount": 0,
            "totalPay": 0,
            "id": 348356,
            "overdueTime": 0,
            "buyoutTime": 0,
            "orderNo": "50120250710152117",
            "cabinetid": "RL3T062411030004",
            "operateId": 0,
            "selectTime": 0,
            "returnShopName": "深圳市睿联通信技术有限公司",
            "returnTime": 1752160887942,
            "transactionId": "pi_3RjMHYA8g0pGPYQd0PfrWxMj",
            "prepAmount": 0.00,
            "chainId": 0,
            "buyoutRent": 0.00,
            "returnRent": 0.00,
            "balanceRentUserInfo": {
                "balanceBefore": 0,
                "userBalance": 0,
                "isNewUser": 2
            },
            "aid": 0,
            "returnSid": 3531,
            "status": 2,
            "extraAmount": 0.00,
            "billingtime": 1,
            "totalRefund": 0,
            "rentType": 2,
            "shopName": "深圳市睿联通信技术有限公司",
            "oid": 3526,
            "endStatus": 3,
            "sid": 3531,
            "realAmount": 0.00,
            "returnCabinetid": "RL3T062411030004",
            "uid": 24870,
            "perPrice": 3.00,
            "isDeduction": 0,
            "orderName": "Rent 深圳市睿联通信技术有限公司s battery",
            "amount": 3.00,
            "subsAmount": 0,
            "currencySymbol": "$",
            "endtime": 1752160887942,
            "authAmount": 0,
            "updateTime": 1752160887989,
            "balanceAmount": 0,
            "overdueRent": 0.00,
            "userName": "RL3T062411030004",
            "deviceid": "RL3D52000006",
            "returnBalanceAmount": 0,
            "returnSubAmount": 0,
            "billingunit": 1,
            "borrowStatus": 1,
            "policyId": 2580,
            "createTime": 1752160872720,
            "subOfflineAmount": 0,
            "policyInfo": {
                "priceUnit": 1,
                "amount": 3.00,
                "maxRentDay": 0,
                "parameter9": "",
                "parameter10": "",
                "currencySymbol": "$",
                "freeMinute": 3,
                "dailyMaxAmount": 3.00,
                "oid": 3526,
                "chargePolicyType": 1,
                "buyAmount": 0.00,
                "parameter8": "",
                "deposit": 3.00,
                "parameter7": "",
                "parameter6": "",
                "id": 2580,
                "parameter5": "",
                "parameter4": "",
                "currencyCode": "USD",
                "parameter3": "",
                "priceTime": 1,
                "parameter2": "",
                "parameter1": ""
            },
            "staffId": 0
        }
    ],
    "totalElements": 8
}
```

---

### 5. **Dispense/Eject Battery** (For Distributor Users)

**Current ChargeNow**:
```
POST https://developer.chargenow.top/cdb-open-api/v1/cabinet/ejectByRepair?cabinetid={stationId}&slotNum=0
```

**What You Need From New Supplier**:
- **Endpoint URL**: `POST /api/battery/dispense` or similar
- **Method**: POST or PUT
- **Parameters**:
  - `stationId` or `cabinetId`
  - `slotNum` (optional - 0 for all, or specific slot number)
- **Purpose**: Remote battery ejection/dispensing

**Expected Response** (ask supplier for):
```json
{
  "code": 0,
  "msg": "Battery dispensed successfully",
  "data": {
    "cabinetId": "STATION_ID",
    "slotNum": 0,
    "success": true
  }
}
```

**Dashboard Uses This For**:
- Distributor users can dispense batteries remotely
- "Pop out" button functionality on home page
- Emergency battery access

---

## 📊 Summary Table

| Feature | ChargeNow Endpoint | What to Ask New Supplier |
|---------|-------------------|--------------------------|
| **Get All Stations** | `/cabinet/getAllDevice` | "How do I get a list of all my stations/cabinets?" |
| **Station Availability** | `/rent/cabinet/query` | "How do I check battery availability for a specific station?" |
| **All Orders** | `/order/list` | "How do I get all battery rental orders with pagination?" |
| **Station Orders** | `/order/list?pCabinetid=X&sTime=Y&eTime=Z` | "How do I get orders for a specific station within a date range?" |
| **Dispense Battery** | `/cabinet/ejectByRepair` | "How do I remotely dispense/eject a battery?" |

---

## 🔍 Critical Questions to Ask New Supplier

### 1. Station Data
- ❓ What endpoint gives me all my stations?
- ❓ What fields are included in station data?
- ❓ How do I identify each station (ID format)?
- ❓ How do I get battery availability (empty/occupied slots)?

### 2. Order/Rental Data
- ❓ What endpoint gives me rental orders?
- ❓ Can I filter by station ID?
- ❓ Can I filter by date range?
- ❓ What date format do you use? (YYYY-MM-DD HH:mm:ss or ISO8601?)
- ❓ What field contains the revenue amount?
- ❓ How is pagination handled?

### 3. Authentication
- ❓ What authentication method do you use?
- ❓ How do I get my API credentials?
- ❓ Do tokens expire? How do I refresh them?
- ❓ What headers are required?

### 4. Battery Operations
- ❓ Can I remotely dispense batteries?
- ❓ What endpoint handles battery dispensing?
- ❓ Can I dispense from a specific slot or all slots?
- ❓ What permissions are needed?

### 5. Response Format
- ❓ What is your standard response structure?
- ❓ How are errors returned?
- ❓ What status codes do you use?
- ❓ Is data paginated? How?

### 6. Rate Limiting
- ❓ Are there rate limits?
- ❓ How many requests per minute/hour?
- ❓ What happens if I exceed limits?

---

## 📝 Data Field Mapping

### Station/Cabinet Object
**Fields Dashboard Needs**:

| Dashboard Field | ChargeNow Field | New Supplier Field |
|----------------|-----------------|-------------------|
| Station ID | `pCabinetid` | ??? |
| Station Name | `stationTitle` or derived | ??? |
| Available Batteries | `pBorrow` or `emptySlots` | ??? |
| Occupied Batteries | `pAlso` or `busySlots` | ??? |
| Total Slots | Calculated | ??? |
| Online Status | `isOnline` or derived | ??? |
| Location/Address | `location` or `address` | ??? |

### Order/Rental Object
**Fields Dashboard Needs**:

| Dashboard Field | ChargeNow Field | New Supplier Field |
|----------------|-----------------|-------------------|
| Order ID | `pOrderid` | ??? |
| Battery ID | `pBatteryid` | ??? |
| Station ID | `pCabinetid` | ??? |
| Revenue Amount | `settledAmount` | ??? |
| Borrow Time | `pBorrowtime` | ??? |
| Return Time | `pGhtime` | ??? |
| Duration (minutes) | `billingDuration` | ??? |
| Order Status | `status` | ??? |

---

## 🎯 Minimum Required Endpoints

### MUST HAVE (Critical for dashboard to work):
1. ✅ **Get all stations** - Display stations on home page
2. ✅ **Get station availability** - Show battery counts
3. ✅ **Get orders by station + date range** - Calculate revenue

### NICE TO HAVE (Enhanced features):
4. ⭐ **Dispense battery** - Remote battery ejection
5. ⭐ **Get all orders** - Overall statistics
6. ⭐ **Station status** - Online/offline monitoring

---

## 📨 Email Template for New Supplier

Use this template when contacting your new supplier:

```
Subject: API Documentation Request for Dashboard Integration

Hello [Supplier Name],

I'm integrating your battery rental system into our dashboard and need the following API endpoints:

1. **Get All Stations/Cabinets**
   - Endpoint to retrieve all my battery stations
   - Need: Station ID, name, battery availability, location

2. **Get Station Battery Availability**
   - Check available vs occupied batteries for a specific station
   - Real-time data preferred

3. **Get Rental Orders by Station and Date Range**
   - Filter orders by station ID
   - Filter by date range (start date to end date)
   - Need: Order ID, revenue amount, timestamps, battery ID
   - Pagination support

4. **Dispense/Eject Battery** (if supported)
   - Remote battery dispensing capability
   - Specify station ID and optional slot number

Please provide:
- ✅ Full API documentation
- ✅ Authentication method and credentials
- ✅ Request/response examples
- ✅ Date format specifications
- ✅ Rate limits and restrictions
- ✅ Error response formats

Our current dashboard displays:
- Station list with battery availability
- Revenue per station (filtered by date)
- Total rental counts
- Take-home calculations

Thank you!
```

---

## 🔧 Implementation Checklist

Once you get the new API documentation:

### Phase 1: Preparation
- [ ] Review new supplier API documentation
- [ ] Get API credentials
- [ ] Test API calls using Postman or curl
- [ ] Verify all required endpoints exist

### Phase 2: Implementation
- [ ] Copy `chargenow-api.js` → `newsupplier-api.js`
- [ ] Update `CHARGENOW_CONFIG` with new supplier details
- [ ] Implement each function to match new API
- [ ] Test each function individually

### Phase 3: Integration
- [ ] Change import in `server.js` line 12
- [ ] Test locally with real data
- [ ] Verify all dashboard features work
- [ ] Check revenue calculations
- [ ] Test date filtering

### Phase 4: Deployment
- [ ] Deploy to staging/test environment
- [ ] Run full test suite
- [ ] Verify with real users
- [ ] Deploy to production

---

## 📊 API Endpoint Comparison Template

Fill this out when you get new supplier documentation:

| Function | ChargeNow Endpoint | New Supplier Endpoint | Status |
|----------|-------------------|----------------------|--------|
| Get All Stations | `/cabinet/getAllDevice` | ??? | ⬜ Pending |
| Station Availability | `/rent/cabinet/query` | ??? | ⬜ Pending |
| All Orders | `/order/list` | ??? | ⬜ Pending |
| Station Orders (Date Range) | `/order/list?pCabinetid=X&sTime=Y` | ??? | ⬜ Pending |
| Dispense Battery | `/cabinet/ejectByRepair` | ??? | ⬜ Pending |

---

## 🧪 Testing Checklist

After implementing new supplier API:

### Endpoint Testing
- [ ] Get all stations returns data
- [ ] Can filter stations by ID
- [ ] Can get battery availability
- [ ] Can get orders with pagination
- [ ] Can filter orders by date range
- [ ] Can filter orders by station
- [ ] Battery dispense works (if supported)

### Dashboard Testing
- [ ] Login and see home page
- [ ] Stations display correctly
- [ ] Battery counts are accurate
- [ ] Revenue shows correctly
- [ ] Date filter works
- [ ] Pop out button works (Distributor users)
- [ ] All users see their assigned stations

### Data Accuracy
- [ ] Revenue matches actual rentals
- [ ] Rental counts are correct
- [ ] Date filtering gives expected results
- [ ] Station availability is real-time
- [ ] Take-home calculations are correct

---

## 💡 Tips for API Transition

### 1. Request Documentation First
Don't start coding until you have:
- Complete API documentation
- Authentication details
- Request/response examples
- Error handling information

### 2. Test Before Integrating
Use tools like:
- **Postman** - Test API calls visually
- **curl** - Quick command-line testing
- **Insomnia** - API testing tool

Example curl test:
```bash
curl -X GET "https://api.newsupplier.com/stations" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Map Data Fields
Create a mapping document:
```
ChargeNow "pCabinetid" → New Supplier "station_id"
ChargeNow "settledAmount" → New Supplier "total_amount"
ChargeNow "pBorrowtime" → New Supplier "rental_start"
```

### 4. Handle Different Response Formats
ChargeNow returns:
```json
{
  "code": 0,
  "msg": "success",
  "data": { ... }
}
```

New supplier might return:
```json
{
  "success": true,
  "data": { ... }
}
```

You'll need to adjust parsing in your new module.

---

## 🚨 Critical Data Points

### Revenue Calculation
**Current**: Uses `settledAmount` field from each order
**Need**: What field contains the payment amount?

### Date Range Filtering
**Current**: `sTime` and `eTime` parameters in format "YYYY-MM-DD HH:mm:ss"
**Need**: How does new supplier handle date filtering?

### Station Identification
**Current**: Uses `pCabinetid` field
**Need**: What field identifies each station?

### Battery Counts
**Current**: `pBorrow` (available) and `pAlso` (occupied)
**Need**: How are battery counts represented?

---

## 📞 Questions to Ask New Supplier

Copy and paste these questions when contacting your supplier:

### General
1. What is your base API URL?
2. What authentication method do you use?
3. How do I obtain API credentials?
4. What is your API version/documentation link?

### Stations
5. What endpoint returns all my battery stations?
6. What unique identifier does each station have?
7. How do I get real-time battery availability for a station?
8. What fields indicate available vs occupied batteries?

### Orders/Rentals
9. What endpoint returns battery rental orders?
10. Can I filter orders by station ID? How?
11. Can I filter orders by date range? What format?
12. What field contains the revenue/payment amount?
13. How is pagination handled?

### Operations
14. Can I remotely dispense batteries? What endpoint?
15. What permissions are required for each endpoint?
16. Are there rate limits I should know about?

### Response Format
17. What is your standard response structure?
18. How are errors returned (status codes, error format)?
19. Is data paginated by default?

---

## 📋 Supplier Response Worksheet

| Question | Answer | Notes |
|----------|--------|-------|
| Base API URL | | |
| Auth Method | | Bearer / Basic / API Key |
| Get Stations Endpoint | | |
| Station ID Field | | |
| Get Availability Endpoint | | |
| Available Batteries Field | | |
| Occupied Batteries Field | | |
| Get Orders Endpoint | | |
| Filter by Station Parameter | | |
| Filter by Date Parameters | | |
| Date Format | | |
| Revenue Amount Field | | |
| Dispense Battery Endpoint | | Optional |
| Rate Limit | | Requests/minute |

---

## 🔄 Migration Steps (After Getting Documentation)

### Step 1: Create New Module
```bash
cp chargenow-api.js newsupplier-api.js
```

### Step 2: Update Configuration
```javascript
// In newsupplier-api.js
const SUPPLIER_CONFIG = {
  baseUrl: 'https://api.newsupplier.com/v1',
  credentials: 'Bearer YOUR_API_TOKEN',
  // Add any other config needed
};
```

### Step 3: Implement Functions
Update each function in `newsupplier-api.js`:
- `fetchChargeNowStations()` → Use new supplier's station endpoint
- `fetchStationAvailability()` → Use new supplier's availability endpoint
- `fetchStationRentalHistory()` → Use new supplier's order endpoint with filters
- etc.

### Step 4: Test Functions
```bash
# Create a test file
node -e "const api = require('./newsupplier-api'); api.fetchChargeNowStations().then(console.log);"
```

### Step 5: Switch in Production
```javascript
// In server.js line 12
const chargenowAPI = require('./newsupplier-api');
```

### Step 6: Deploy
```bash
npm start  # Test locally first
# Then deploy to production
```

---

## 📖 Example API Documentation to Request

Ask supplier for documentation similar to this:

```markdown
### Get All Stations
GET /api/v1/stations

Headers:
  Authorization: Bearer {token}
  Content-Type: application/json

Response:
{
  "success": true,
  "data": {
    "stations": [
      {
        "id": "STAT001",
        "name": "Downtown Station",
        "available_batteries": 5,
        "total_batteries": 8
      }
    ]
  }
}
```

---

## ⚠️ Important Notes

1. **Keep ChargeNow Module**: Don't delete `chargenow-api.js` - keep it as reference
2. **Test Thoroughly**: Test new API extensively before going live
3. **Parallel Testing**: You can run both APIs side-by-side during transition
4. **Backup Data**: Export current data before switching
5. **Document Differences**: Note any differences in data structure

---

## 🎯 What to Do Next

1. **Contact new supplier** with questions from this document
2. **Get API documentation** - full details
3. **Get API credentials** - test account first if possible
4. **Test their API** - use Postman or curl
5. **Fill out the worksheet** in this document
6. **Come back** and we'll implement the new module together

---

## 📞 Ready to Implement?

Once you have the new supplier's API documentation, send me:
1. ✅ API base URL
2. ✅ Authentication method and credentials
3. ✅ All endpoint URLs
4. ✅ Request/response examples
5. ✅ Any special headers or parameters

And I'll create the new supplier module for you! 🚀

---

**Status**: Ready for new supplier information  
**Next Step**: Get API documentation from new supplier  
**Estimated Time**: 1-2 hours to implement once documentation received

