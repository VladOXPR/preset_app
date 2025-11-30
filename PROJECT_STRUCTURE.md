# CUUB Dashboard - Complete Project Structure Documentation

This document provides a comprehensive overview of every file in the CUUB Dashboard project, including function breakdowns and usage patterns.

## 📋 Quick Summary

- **Total Files:** 30+ files
- **JavaScript Files:** 11 files
- **HTML Files:** 7 files
- **CSS Files:** 2 files
- **Configuration Files:** 3 files
- **Data Files:** 2 JSON files
- **Documentation Files:** 5 markdown files

### Key Statistics:
- **server.js:** 2,284 lines (needs refactoring)
- **Total Routes:** 46 HTTP routes
- **Production Routes:** 30 routes
- **Debug Routes:** 16 routes (should be removed/gated)
- **JavaScript Functions:** 80+ functions documented

### Main Entry Points:
- **Server:** `server.js` (Express app)
- **Database:** `database.js` (JSON-based)
- **API Wrapper:** `chargenow-api.js` (ChargeNow integration)
- **Client Entry:** `public/html/home.html` (main dashboard)

---

## 📁 Project Directory Structure

```
CUUB_Dashboard/
├── Root Files
│   ├── server.js                    # Main Express server (2,284 lines)
│   ├── database.js                  # JSON database operations
│   ├── chargenow-api.js             # ChargeNow API wrapper module
│   ├── testapi.js                   # API token testing script
│   ├── package.json                 # Node.js dependencies
│   ├── vercel.json                  # Vercel deployment config
│   └── vercel-build.sh              # Build script
│
├── data/
│   ├── db-manager.js                # CLI database management tool
│   ├── users.json                   # User data storage
│   ├── stations.json                # Station data storage
│   └── app.db                       # (Legacy SQLite - not used)
│
├── public/
│   ├── html/                        # HTML page templates
│   ├── js/                          # Client-side JavaScript
│   ├── css/                         # Stylesheets
│   └── icons/                       # Favicons and images
│
└── Documentation/
    ├── README.md
    ├── SERVER_ANALYSIS.md
    ├── VERCEL_DEPLOYMENT.md
    ├── JSON_DATABASE_README.md
    └── NEW_SUPPLIER_API_REQUIREMENTS.md
```

---

## 🔧 Root Level JavaScript Files

### 1. `server.js` (2,284 lines)
**Location:** `/CUUB_Dashboard/server.js`  
**Purpose:** Main Express.js server - handles all HTTP routes, authentication, API endpoints, and business logic

#### **Global Variables:**
- `latestStationData` - Cached station data from ChargeNow API
- `lastFetchTime` - Timestamp of last data fetch
- `tokenTestResults` - Background API token testing results
- `app` - Express application instance
- `PORT` - Server port (3000 or from env)
- `JWT_SECRET` - JWT signing secret

#### **Background Services:**
1. **`updateStationData()`** (Line 27)
   - Fetches station data from ChargeNow API every 60 seconds
   - Updates `latestStationData` global variable
   - **Used by:** Scheduled interval, manual refresh endpoint

2. **`performTokenTest()`** (Line 67)
   - Tests ChargeNow API token validity
   - Runs every 60 seconds in background
   - Stores results in `tokenTestResults` object
   - **Used by:** Background interval, manual test endpoint

#### **Middleware Functions:**
1. **`verifyToken(req, res, next)`** (Line 196)
   - Validates JWT tokens from cookies or Authorization header
   - Sets `req.user` with decoded token data
   - **Used by:** Protected routes (GET /home, GET /api/stations, etc.)

2. **`escapeHtml(text)`** (Line 352)
   - Escapes HTML characters to prevent XSS
   - **Used by:** Login/signup page routes

#### **Helper Functions:**
1. **`readStations()`** (Line 1060)
   - Reads stations from `data/stations.json`
   - **Used by:** Station management routes

2. **`writeStations(stations)`** (Line 1073)
   - Writes stations to `data/stations.json`
   - **Used by:** Station CRUD operations

#### **HTTP Routes (46 total routes):**

**Page Routes (8 routes):**
- `GET /` (Line 347) - Redirects to `/login`
- `GET /login` (Line 363) - Serves login page HTML
- `GET /signup` (Line 427) - Serves signup page HTML
- `GET /home` (Line 489) - Serves dashboard (requires auth via verifyToken)
- `GET /admin-password` (Line 605) - Serves admin password page
- `GET /admin` (Line 615) - Serves admin panel (requires admin auth)
- `GET /newuser` (Line 676) - Serves new user creation page
- `GET /testapi` (Line 610) - Serves API token test UI

**Authentication Routes (4 routes):**
- `POST /login` (Line 817) - Handles user login, sets JWT cookie
- `POST /signup` (Line 733) - Creates new user account
- `POST /newuser` (Line 777) - Admin creates new user
- `GET /logout` (Line 727) - Clears JWT cookie, redirects to login

**Admin Authentication Routes (2 routes):**
- `POST /api/validate-admin-password` (Line 580) - Validates admin password
- `POST /api/logout-admin` (Line 598) - Clears admin session

**Admin User Management Routes (4 routes):**
- `GET /admin/users` (Line 958) - Gets all users (no passwords)
- `GET /admin/users-full` (Line 973) - Gets all users (with passwords)
- `POST /admin/update-user-stations` (Line 988) - Updates user station assignments
- `POST /admin/delete-user` (Line 1026) - Deletes a user

**Station Management Routes (4 routes):**
- `GET /api/admin/stations` (Line 1086) - Gets all stations
- `POST /api/admin/stations` (Line 1101) - Creates new station
- `PUT /api/admin/stations/:id` (Line 1156) - Updates station
- `DELETE /api/admin/stations/:id` (Line 1204) - Deletes station

**Main API Routes (8 routes):**
- `GET /api/health` (Line 214) - Health check for Vercel
- `GET /api/test-token-status` (Line 219) - Gets background token test results
- `POST /api/test-token-now` (Line 252) - Triggers immediate token test
- `GET /me` (Line 915) - Returns current user info (requires verifyToken)
- `GET /users` (Line 935) - Returns all users (requires verifyToken)
- `GET /api/stations` (Line 1251) - **MAIN ROUTE** - Gets stations with revenue data (requires verifyToken)
- `GET /api/take-home` (Line 1559) - Calculates take-home amount for CUUB user
- `POST /api/dispense-battery` (Line 1934) - Dispenses battery from station (requires verifyToken)
- `POST /api/refresh-stations` (Line 2032) - Manually refreshes station data
- `GET /api/generate-login-link` (Line 2056) - Generates onboarding link

**Debug/Test Routes (16 routes - should be removed or gated in production):**
- `GET /api/test-db` (Line 282) - Tests database connection
- `GET /api/check-schema` (Line 304) - Checks database schema
- `GET /api/session` (Line 849) - Debug session info
- `GET /api/debug-vercel` (Line 859) - Debug Vercel environment
- `GET /api/test-auth` (Line 874) - Tests authentication
- `GET /api/token` (Line 894) - Gets token info
- `GET /api/debug-stations` (Line 1499) - Debug station data
- `GET /api/debug-user/:username` (Line 1537) - Debug user data
- `GET /api/test-orders/:stationId` (Line 1799) - Test order data
- `GET /api/test-chargenow` (Line 1908) - Test ChargeNow API
- `GET /api/station-cache-status` (Line 2011) - Check station cache status
- `GET /api/battery-rentals` (Line 2092) - Gets battery rental info
- `GET /api/station-availability/:stationId` (Line 2136) - Gets single station availability
- `GET /api/stations-availability` (Line 2209) - Gets multiple stations availability

**Exports:**
- `module.exports = app` (Line 2268) - Exports Express app for Vercel

---

### 2. `database.js` (231 lines)
**Location:** `/CUUB_Dashboard/database.js`  
**Purpose:** JSON-based database operations for user management

#### **Functions:**

1. **`initJsonFiles()`** (Line 15)
   - Creates `data/users.json` if it doesn't exist
   - **Used by:** Module initialization

2. **`readJsonFile(filePath)`** (Line 22)
   - Reads and parses JSON file
   - Returns empty array on error
   - **Used by:** All database read operations

3. **`writeJsonFile(filePath, data)`** (Line 32)
   - Writes data to JSON file with formatting
   - **Used by:** All database write operations

4. **`initDatabase()`** (Line 45)
   - Initializes database on module load
   - **Used by:** Module initialization

5. **`createUser(username, phone, password, stationIds, stationTitles)`** (Line 56)
   - Creates new user in JSON database
   - Hashes password with bcrypt
   - **Used by:** `server.js` signup/newuser routes

6. **`getUserByUsername(username)`** (Line 90)
   - Finds user by username
   - Returns user object or null
   - **Used by:** `server.js` login route, user lookup

7. **`getAllUsers()`** (Line 106)
   - Returns all users without passwords
   - **Used by:** `server.js` GET /users route

8. **`getAllUsersWithPasswords()`** (Line 124)
   - Returns all users including passwords (admin only)
   - **Used by:** `server.js` GET /admin/users-full route

9. **`getUserById(id)`** (Line 143)
   - Finds user by ID
   - **Used by:** `server.js` user update/delete operations

10. **`updateUserStations(userId, stationIds)`** (Line 160)
    - Updates user's station assignments
    - Handles both dictionary and array formats
    - **Used by:** `server.js` POST /admin/update-user-stations

11. **`deleteUser(userId)`** (Line 194)
    - Deletes user from database
    - **Used by:** `server.js` POST /admin/delete-user

**Exports:**
```javascript
{
  createUser,
  getUserByUsername,
  getAllUsers,
  getAllUsersWithPasswords,
  getUserById,
  updateUserStations,
  deleteUser
}
```

---

### 3. `chargenow-api.js` (324 lines)
**Location:** `/CUUB_Dashboard/chargenow-api.js`  
**Purpose:** Wrapper module for ChargeNow API interactions - isolated for easy supplier switching

#### **Configuration:**
- `CHARGENOW_CONFIG` (Line 23) - Base URL and credentials

#### **Core API Functions:**

1. **`fetchChargeNowStations()`** (Line 36)
   - Fetches all devices/stations from ChargeNow
   - Returns: JSON string
   - **Used by:** `server.js` updateStationData(), background service

2. **`fetchBatteryRentalInfo(page, limit)`** (Line 60)
   - Fetches battery rental information
   - Returns: `{ response, result }`
   - **Used by:** `server.js` GET /api/battery-rentals

3. **`fetchStationAvailability(stationId)`** (Line 86)
   - Gets availability for single station
   - Returns: `{ response, result }`
   - **Used by:** `server.js` GET /api/station-availability/:id

4. **`fetchStationRentalHistory(stationId, sTime, eTime, page, limit)`** (Line 116)
   - Gets rental history for station within date range
   - Returns: `{ response, result }`
   - **Used by:** `server.js` GET /api/stations (main route)

5. **`dispenseBattery(stationId)`** (Line 152)
   - Dispenses all batteries from station (popAll endpoint)
   - Returns: `{ response, result }`
   - **Used by:** `server.js` POST /api/dispense-battery

6. **`ejectBatteryByRepair(stationId, slotNum)`** (Line 186)
   - Ejects battery using repair mode
   - Returns: `{ response, result }`
   - **Used by:** Not currently used (available for future)

#### **Helper Functions:**

7. **`generateDemoStationData()`** (Line 224)
   - Generates fake station data for testing
   - Returns: JSON string
   - **Used by:** `server.js` demo user mode

8. **`calculateOrderStats(orders)`** (Line 284)
   - Calculates total revenue and record count from orders
   - Returns: `{ totalRevenue, totalRecords }`
   - **Used by:** `server.js` GET /api/stations route

**Exports:**
```javascript
{
  fetchChargeNowStations,
  fetchBatteryRentalInfo,
  fetchStationAvailability,
  fetchStationRentalHistory,
  dispenseBattery,
  ejectBatteryByRepair,
  generateDemoStationData,
  calculateOrderStats,
  CHARGENOW_CONFIG
}
```

---

### 4. `testapi.js` (249 lines)
**Location:** `/CUUB_Dashboard/testapi.js`  
**Purpose:** Standalone script to test ChargeNow API token expiration

#### **Functions:**

1. **`getTokenExpiration(token)`** (Line 8)
   - Decodes JWT token and extracts expiration info
   - Returns: `{ expirationDate, hoursUntilExpiry, isExpired, tokenData }`
   - **Used by:** Startup display, test warnings, final summary

2. **`testAPIToken()`** (Line 61)
   - Makes API request to test token validity
   - Logs success/failure with detailed stats
   - Checks token expiration status
   - **Used by:** Interval timer (every 5 seconds)

**Global Variables:**
- `requestCount` - Total requests made
- `successCount` - Successful requests
- `failureCount` - Failed requests
- `lastSuccessTime` - Timestamp of last success
- `firstFailureTime` - Timestamp of first failure

**Usage:**
```bash
node testapi.js
```

---

## 📂 Data Directory

### 5. `data/db-manager.js` (180 lines)
**Location:** `/CUUB_Dashboard/data/db-manager.js`  
**Purpose:** CLI tool for database management operations

#### **Functions:**

1. **`addUser(username, phone, password, userType, stationIds)`** (Line 14)
   - Adds new user via command line
   - Hashes password with bcrypt
   - **Used by:** CLI command `add-user`

2. **`deleteUser(userId)`** (Line 39)
   - Deletes user by ID
   - **Used by:** CLI command `delete-user`

3. **`updateUserPassword(username, newPassword)`** (Line 57)
   - Updates user password
   - **Used by:** CLI command `update-password`

4. **`showStats()`** (Line 73)
   - Displays database statistics
   - Shows user count and type distribution
   - **Used by:** CLI command `stats`

5. **`readJsonFile(filePath)`** (Line 100)
   - Helper to read JSON files
   - **Used by:** All CLI functions

6. **`writeJsonFile(filePath, data)`** (Line 110)
   - Helper to write JSON files
   - **Used by:** All CLI functions

**CLI Commands:**
```bash
node data/db-manager.js stats
node data/db-manager.js add-user <username> <phone> <password> [userType] [stationIds]
node data/db-manager.js delete-user <userId>
node data/db-manager.js update-password <username> <newPassword>
```

---

## 🌐 Public Directory - JavaScript Files

### 6. `public/js/home.js` (367 lines)
**Location:** `/CUUB_Dashboard/public/js/home.js`  
**Purpose:** Client-side logic for the main dashboard (home page)

#### **Functions:**

1. **`window.onload`** (Line 1)
   - Initializes page on load
   - Fetches user info, sets up date inputs, fetches stations
   - **Used by:** Browser on page load

2. **`initializeDateInputs()`** (Line 37)
   - Sets default date range (first of month to today)
   - Uses local date formatting to avoid timezone issues
   - **Used by:** Page initialization

3. **`getSelectedDateRange()`** (Line 49)
   - Gets selected dates from date inputs
   - Converts to API format (sTime, eTime)
   - **Used by:** `fetchStations()`

4. **`fetchStations()`** (Line 75)
   - Fetches station data from `/api/stations`
   - Includes date range in query params
   - **Used by:** Page load, date change events

5. **`displayStations(stationsData)`** (Line 111)
   - Renders station cards in the UI
   - Handles different data formats
   - Shows revenue, rents, battery counts
   - **Used by:** `fetchStations()`

6. **`updateSummaryStats()`** (Line 202)
   - Calculates and displays total revenue and take-home
   - Host users: 20% of revenue
   - Distributor users: Shows total rents
   - **Used by:** After displaying stations

7. **`initializeMenu()`** (Line 262)
   - Sets up hamburger menu functionality
   - Handles open/close, click outside, Escape key
   - **Used by:** Page initialization

8. **`dispenseBattery(stationId)`** (Line 297)
   - Calls `/api/dispense-battery` endpoint
   - Shows confirmation dialog
   - Updates button state during request
   - **Used by:** "Pop out" button click (Distributor users only)

**Global Variables:**
- Uses `window.API_CONFIG` from `deployment-manager.js` for API URLs

---

### 7. `public/js/admin.js` (707 lines)
**Location:** `/CUUB_Dashboard/public/js/admin.js`  
**Purpose:** Admin panel functionality - user and station management

#### **Functions:**

1. **`window.onload`** (Line 20)
   - Initializes admin panel
   - Loads stations and users
   - Sets up admin controls
   - **Used by:** Browser on page load

2. **`logout()`** (Line 39)
   - Logs out admin user
   - Calls `/api/logout-admin`
   - Redirects to admin password page
   - **Used by:** Logout button click

3. **`setupAdminControls()`** (Line 60)
   - Sets up event listeners for admin buttons
   - Handles "Add User" and "Add Station" buttons
   - **Used by:** Page initialization

4. **`loadUsers()`** (Line 89)
   - Fetches all users from `/admin/users-full`
   - Renders user list
   - **Used by:** Page initialization, after user operations

5. **`renderUserList(users)`** (Line 119)
   - Renders user list in DOM
   - **Used by:** `loadUsers()`

6. **`createUserItem(user)`** (Line 136)
   - Creates DOM element for single user
   - Includes station management section
   - **Used by:** `renderUserList()`

7. **`createStationManagementSection(user)`** (Line 174)
   - Creates station assignment UI for user
   - Shows station ID and title inputs
   - **Used by:** `createUserItem()`

8. **`createStationRow(userId, stationId, title)`** (Line 222)
   - Creates single station row with inputs
   - Auto-saves on blur
   - **Used by:** `createStationManagementSection()`, `addNewStationRow()`

9. **`addNewStationRow(userId)`** (Line 250)
   - Adds new empty station row
   - **Used by:** "Add station" button click

10. **`removeStationRow(button)`** (Line 265)
    - Removes station row from UI
    - Auto-saves after removal
    - **Used by:** Remove button click

11. **`saveUserStations(userId)`** (Line 279)
    - Collects station data from inputs
    - Calls `updateUserStations()`
    - **Used by:** Input blur events, remove station

12. **`updateUserStations(userId, stationIds)`** (Line 304)
    - Sends station update to `/admin/update-user-stations`
    - **Used by:** `saveUserStations()`

13. **`deleteUser(userId)`** (Line 335)
    - Deletes user via `/admin/delete-user`
    - Shows confirmation dialog
    - Reloads user list on success
    - **Used by:** Delete button click

14. **`loadStations()`** (Line 373)
    - Fetches stations from `/api/admin/stations`
    - **Used by:** Page initialization, after station operations

15. **`renderStationList(stations)`** (Line 399)
    - Renders station list in DOM
    - **Used by:** `loadStations()`

16. **`createStationItem(station)`** (Line 420)
    - Creates DOM element for single station
    - **Used by:** `renderStationList()`

17. **`showAddStationForm()`** (Line 456)
    - Shows form to add new station
    - **Used by:** "Add Station" button click

18. **`saveNewStation()`** (Line 503)
    - Saves new station via POST `/api/admin/stations`
    - **Used by:** Add station form submit

19. **`cancelAddStation()`** (Line 551)
    - Hides add station form
    - **Used by:** Cancel button click

20. **`editStation(stationId)`** (Line 563)
    - Fetches station data and shows edit form
    - **Used by:** Edit button click

21. **`showEditStationForm(station)`** (Line 589)
    - Shows edit form with station data
    - **Used by:** `editStation()`

22. **`saveEditedStation(stationId)`** (Line 628)
    - Saves edited station via PUT `/api/admin/stations/:id`
    - **Used by:** Edit form submit

23. **`cancelEditStation(stationId)`** (Line 675)
    - Cancels editing, reloads station list
    - **Used by:** Cancel button click

24. **`deleteStation(stationId)`** (Line 684)
    - Deletes station via DELETE `/api/admin/stations/:id`
    - Shows confirmation dialog
    - **Used by:** Delete button click

---

### 8. `public/js/deployment-manager.js` (94 lines)
**Location:** `/CUUB_Dashboard/public/js/deployment-manager.js`  
**Purpose:** Handles API URL generation for different deployment environments

#### **Functions:**

1. **`getApiUrl(endpoint)`** (Line 49)
   - Generates correct API URL based on environment
   - Local: returns relative URL
   - Production: returns absolute URL
   - **Used by:** All other JS files via `window.API_CONFIG.getApiUrl()`

**Global Export:**
- `window.API_CONFIG` - Contains `baseUrl` and `getApiUrl` function
- **Used by:** `home.js`, `admin.js`, and other client-side files

---

### 9. `public/js/admin-password.js` (124 lines)
**Location:** `/CUUB_Dashboard/public/js/admin-password.js`  
**Purpose:** Handles 4-digit password input for admin authentication

#### **Functions:**

1. **`checkPassword()`** (Line 63)
   - Checks if all 4 inputs are filled
   - Calls `validatePassword()` when complete
   - **Used by:** Input event listeners

2. **`validatePassword(password)`** (Line 73)
   - Sends password to `/api/validate-admin-password`
   - Redirects to `/admin` on success
   - Shows error on failure
   - **Used by:** `checkPassword()`

3. **`showError()`** (Line 105)
   - Shows error state (red borders)
   - Clears inputs and resets after 1 second
   - **Used by:** `validatePassword()` on failure

**Event Listeners:**
- Input events: Auto-advance to next field
- Keydown: Backspace and arrow key navigation
- Paste: Handles pasting 4-digit codes

---

### 10. `public/js/remember-me.js` (84 lines)
**Location:** `/CUUB_Dashboard/public/js/remember-me.js`  
**Purpose:** Saves and loads login credentials in localStorage

#### **Functions:**

1. **`saveCredentials()`** (Line 23)
   - Saves username/password to localStorage
   - Includes timestamp
   - **Used by:** Form submit when "Remember Me" is checked

2. **`loadSavedCredentials()`** (Line 36)
   - Loads credentials from localStorage
   - Checks if credentials are less than 30 days old
   - Auto-fills form if valid
   - **Used by:** Page load

3. **`clearSavedCredentials()`** (Line 70)
   - Removes credentials from localStorage
   - **Used by:** Form submit when unchecked, checkbox change

**Storage Key:** `cuub_credentials`

---

### 11. `public/js/zoom-prevention.js` (57 lines)
**Location:** `/CUUB_Dashboard/public/js/zoom-prevention.js`  
**Purpose:** Prevents zoom and pinch gestures on mobile devices

#### **Event Handlers:**
- `gesturestart`, `gesturechange`, `gestureend` - Prevents pinch zoom
- `touchstart` - Prevents multi-touch zoom
- `focus` on inputs - Prevents iOS zoom on input focus
- `orientationchange` - Resets viewport on iOS
- `touchmove` - Prevents zoom during scroll

**No exported functions** - Runs immediately on load

---

## 📄 HTML Files

### 12. `public/html/login.html`
**Location:** `/CUUB_Dashboard/public/html/login.html`  
**Purpose:** User login page

**Scripts:**
- `remember-me.js` - Auto-fill credentials
- `zoom-prevention.js` - Prevent mobile zoom

**Routes:** Served by `GET /login` (also generated inline in server.js)

---

### 13. `public/html/signup.html`
**Location:** `/CUUB_Dashboard/public/html/signup.html`  
**Purpose:** User registration page

**Routes:** Served by `GET /signup` (also generated inline in server.js)

---

### 14. `public/html/home.html`
**Location:** `/CUUB_Dashboard/public/html/home.html`  
**Purpose:** Main dashboard page

**Scripts:**
- `deployment-manager.js` - API URL configuration
- `home.js` - Dashboard functionality

**Routes:** Served by `GET /home` (requires authentication)

---

### 15. `public/html/admin.html`
**Location:** `/CUUB_Dashboard/public/html/admin.html`  
**Purpose:** Admin panel page

**Scripts:**
- `deployment-manager.js` - API URL configuration
- `admin.js` - Admin functionality

**Routes:** Served by `GET /admin` (requires admin authentication)

---

### 16. `public/html/admin-password.html`
**Location:** `/CUUB_Dashboard/public/html/admin-password.html`  
**Purpose:** Admin password entry page

**Scripts:**
- `admin-password.js` - Password input handling
- `zoom-prevention.js` - Prevent mobile zoom

**Routes:** Served by `GET /admin-password`

---

### 17. `public/html/newuser.html`
**Location:** `/CUUB_Dashboard/public/html/newuser.html`  
**Purpose:** Admin page to create new users

**Routes:** Served by `GET /newuser` (requires admin authentication)

---

### 18. `public/html/testapi.html`
**Location:** `/CUUB_Dashboard/public/html/testapi.html`  
**Purpose:** Web UI for API token testing

**Scripts:**
- Fetches from `/api/test-token-status` every 5 seconds
- Displays background test results

**Routes:** Served by `GET /testapi`

---

## 🎨 CSS Files

### 19. `public/css/style.css`
**Location:** `/CUUB_Dashboard/public/css/style.css`  
**Purpose:** Main stylesheet for entire application

**Sections:**
- Global styles and resets
- Login/signup page styles (gradient backgrounds)
- Dashboard styles (station cards, stats)
- Admin panel styles
- Date range picker styles
- Mobile responsive styles
- iOS Safari specific overrides

---

### 20. `public/css/admin-password.css`
**Location:** `/CUUB_Dashboard/public/css/admin-password.css`  
**Purpose:** Styles for admin password input page

**Features:**
- 4-digit input grid
- Focus states
- Error states

---

## 📦 Configuration Files

### 21. `package.json`
**Location:** `/CUUB_Dashboard/package.json`  
**Purpose:** Node.js dependencies and scripts

**Dependencies:**
- `express` - Web framework
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT authentication
- `cookie-parser` - Cookie handling
- `body-parser` - Request body parsing
- `dotenv` - Environment variables

---

### 22. `vercel.json`
**Location:** `/CUUB_Dashboard/vercel.json`  
**Purpose:** Vercel deployment configuration

**Configuration:**
- Builds `server.js` with `@vercel/node`
- Routes all requests to `server.js`
- Static files served by Express middleware

---

### 23. `vercel-build.sh`
**Location:** `/CUUB_Dashboard/vercel-build.sh`  
**Purpose:** Build script for Vercel deployment

---

## 💾 Data Files

### 24. `data/users.json`
**Location:** `/CUUB_Dashboard/data/users.json`  
**Purpose:** JSON storage for user data

**Structure:**
```json
[
  {
    "id": 1,
    "username": "string",
    "phone": "string",
    "password": "hashed",
    "userType": "Host" | "Distributor",
    "station_ids": { "ST001": "Title", ... },
    "created_at": "ISO timestamp"
  }
]
```

**Used by:** `database.js`, `data/db-manager.js`

---

### 25. `data/stations.json`
**Location:** `/CUUB_Dashboard/data/stations.json`  
**Purpose:** JSON storage for station metadata

**Structure:**
```json
[
  {
    "id": "ST001",
    "name": "Station Name",
    "address": "Full Address",
    "coordinates": [longitude, latitude]
  }
]
```

**Used by:** `server.js` station management routes

---

## 📚 Documentation Files

### 26. `README.md`
**Location:** `/CUUB_Dashboard/README.md`  
**Purpose:** Project overview and setup instructions

---

### 27. `SERVER_ANALYSIS.md`
**Location:** `/CUUB_Dashboard/SERVER_ANALYSIS.md`  
**Purpose:** Analysis of server.js with refactoring recommendations

---

### 28. `VERCEL_DEPLOYMENT.md`
**Location:** `/CUUB_Dashboard/VERCEL_DEPLOYMENT.md`  
**Purpose:** Vercel deployment guide

---

### 29. `JSON_DATABASE_README.md`
**Location:** `/CUUB_Dashboard/JSON_DATABASE_README.md`  
**Purpose:** Documentation for JSON database system

---

### 30. `NEW_SUPPLIER_API_REQUIREMENTS.md`
**Location:** `/CUUB_Dashboard/NEW_SUPPLIER_API_REQUIREMENTS.md`  
**Purpose:** Requirements documentation for supplier API integration

---

## 🔗 Function Dependency Map

### Server-Side Dependencies:
```
server.js
├── database.js (all functions)
├── chargenow-api.js (all functions)
└── Express routes → HTML pages → Client JS files
```

### Client-Side Dependencies:
```
home.html
├── deployment-manager.js (getApiUrl)
└── home.js (all functions)

admin.html
├── deployment-manager.js (getApiUrl)
└── admin.js (all functions)

login.html
├── remember-me.js (save/load credentials)
└── zoom-prevention.js (no functions, runs immediately)
```

---

## 🎯 Key Architectural Patterns

1. **JSON Database:** All data stored in JSON files (no SQLite)
2. **JWT Authentication:** Token-based auth with cookies
3. **API Wrapper Module:** `chargenow-api.js` isolates supplier API
4. **Background Services:** Station data and token testing run continuously
5. **Environment Detection:** `deployment-manager.js` handles local vs production URLs
6. **Modular Client JS:** Each page has its own JS file

---

## ⚠️ Code Quality Issues

1. **server.js is too large** (2,284 lines) - Should be split into route modules
2. **Duplicate HTML generation** - Some routes serve files, others generate inline HTML
3. **Debug routes in production** - 11 debug endpoints should be removed or gated
4. **Global variables** - `latestStationData`, `tokenTestResults` could be better managed
5. **Mixed concerns** - Business logic mixed with route handlers

---

## 🔄 Recommended Refactoring

1. **Split server.js into:**
   - `routes/auth.js` - Authentication routes
   - `routes/admin.js` - Admin routes
   - `routes/stations.js` - Station management
   - `routes/api.js` - Main API endpoints
   - `routes/pages.js` - Page serving routes
   - `routes/debug.js` - Debug routes (dev only)

2. **Extract business logic:**
   - `services/station-service.js` - Station data processing
   - `services/revenue-service.js` - Revenue calculations
   - `middleware/auth.js` - Authentication middleware

3. **Consolidate HTML:**
   - Use file serving for all pages (remove inline HTML generation)

4. **Environment configuration:**
   - Move all config to `.env` file
   - Use config module instead of hardcoded values

---

**Last Updated:** 2025-01-15  
**Total Files Documented:** 30  
**Total JavaScript Functions:** 80+

