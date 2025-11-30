# Server.js - Complete Function Rundown

This document provides a comprehensive overview of every function in `server.js`, organized by category.

---

## 📊 Summary

- **Total Functions:** 11 functions
- **Total Routes:** 27 HTTP routes
- **Background Services:** 2 functions
- **Helper Functions:** 6 functions
- **Middleware Functions:** 1 function
- **File Operations:** 2 functions

---

## 🔄 Background Service Functions

### 1. `updateStationData()` (Line 27)
**Type:** Async function  
**Purpose:** Fetches and caches station data from ChargeNow API

**Parameters:** None

**Returns:** `Promise<void>`

**What it does:**
- Calls `chargenowAPI.fetchChargeNowStations()` to get latest station data
- Updates global variables `latestStationData` and `lastFetchTime`
- Logs success/failure to console
- Keeps previous data if update fails

**Used by:**
- Line 44: Initial call on server start
- Line 47: `setInterval(updateStationData, 60000)` - runs every 60 seconds

**Global variables modified:**
- `latestStationData` - Stores cached station data
- `lastFetchTime` - Stores timestamp of last successful fetch

---

### 2. `performTokenTest()` (Line 67)
**Type:** Async function  
**Purpose:** Tests ChargeNow API token validity in the background

**Parameters:** None

**Returns:** `Promise<void>`

**What it does:**
- Makes HTTP request to ChargeNow API with hardcoded token
- Checks if token is valid (200 OK response)
- Updates `tokenTestResults` object with success/failure stats
- Logs test results to console
- Keeps last 100 log entries in memory

**Used by:**
- Line 175: Initial call on server start
- Line 178: `setInterval(performTokenTest, ...)` - runs every 60 seconds
- Line 335: Manual trigger via `POST /api/test-token-now`

**Global variables modified:**
- `tokenTestResults` - Stores test statistics and logs

**Token being tested:**
- Hardcoded in function (Line 78)
- Should be moved to environment variable

---

## 🛠️ Helper Functions

### 3. `parseStationIds(stationIds)` (Line 202)
**Type:** Synchronous function  
**Purpose:** Parses station IDs from various input formats

**Parameters:**
- `stationIds` - Can be `string`, `array`, `null`, or `undefined`

**Returns:** `Array<string>` - Array of trimmed station ID strings

**What it does:**
- If input is a comma-separated string: splits, trims, and filters empty values
- If input is an array: returns as-is
- If input is null/undefined: returns empty array

**Used by:**
- Line 454: `POST /signup` - Parse station IDs from form
- Line 497: `POST /newuser` - Parse station IDs from form
- Line 588: `POST /admin/update-user-stations` - Parse legacy string format

**Example:**
```javascript
parseStationIds("ST001, ST002, ST003") // Returns: ["ST001", "ST002", "ST003"]
parseStationIds(["ST001", "ST002"])   // Returns: ["ST001", "ST002"]
parseStationIds(null)                 // Returns: []
```

---

### 4. `hashPassword(password)` (Line 213)
**Type:** Synchronous function  
**Purpose:** Hashes a password using bcrypt

**Parameters:**
- `password` - Plain text password string

**Returns:** `string` - Hashed password

**What it does:**
- Uses `bcrypt.hashSync()` with salt rounds of 10
- Returns the hashed password for storage

**Used by:**
- Line 453: `POST /signup` - Hash password before creating user
- Line 496: `POST /newuser` - Hash password before creating user

**Security:** Uses bcrypt with 10 salt rounds (industry standard)

---

### 5. `createAuthToken(username, userType = null)` (Line 220)
**Type:** Synchronous function  
**Purpose:** Creates a JWT authentication token

**Parameters:**
- `username` - User's username (required)
- `userType` - User type: "Host" or "Distributor" (optional, defaults to null)

**Returns:** `string` - JWT token

**What it does:**
- Creates JWT payload with username (and userType if provided)
- Signs token with `JWT_SECRET`
- Sets expiration to 24 hours

**Used by:**
- Line 458: `POST /signup` - Create token for new user (no userType)
- Line 522: `POST /login` - Create token for existing user (with userType)

**Token payload:**
```javascript
{ username: "john", userType: "Host" } // or just { username: "john" }
```

---

### 6. `setAuthCookie(res, token)` (Line 229)
**Type:** Synchronous function  
**Purpose:** Sets authentication cookie with standard security options

**Parameters:**
- `res` - Express response object
- `token` - JWT token string

**Returns:** `void` (modifies response object)

**What it does:**
- Sets HTTP-only cookie named "token"
- Configures cookie options:
  - `httpOnly: true` - Prevents JavaScript access
  - `secure: true` in production, `false` in development
  - `maxAge: 24 hours`
  - `sameSite: 'lax'` - CSRF protection
  - `path: '/'` - Available site-wide

**Used by:**
- Line 461: `POST /signup` - Set cookie after user creation
- Line 525: `POST /login` - Set cookie after login

**Security:** Automatically uses secure cookies in production

---

### 7. `getDateRange(startDateStr, endDateStr)` (Line 245)
**Type:** Synchronous function  
**Purpose:** Calculates date range in API format (sTime, eTime)

**Parameters:**
- `startDateStr` - Optional start date string (YYYY-MM-DD format)
- `endDateStr` - Optional end date string (YYYY-MM-DD format)

**Returns:** `Object` - `{ sTime: string, eTime: string }`

**What it does:**
- If both dates provided: Uses custom date range
- If not provided: Uses default (first day of current month to today)
- Sets start time to 00:00:00 and end time to 23:59:59
- Converts to API format: "YYYY-MM-DD HH:mm:ss"

**Used by:**
- Line 954: `GET /api/stations` - Get date range for order queries

**Example:**
```javascript
getDateRange("2025-01-01", "2025-01-15")
// Returns: { sTime: "2025-01-01 00:00:00", eTime: "2025-01-15 23:59:59" }

getDateRange()
// Returns: { sTime: "2025-01-01 00:00:00", eTime: "2025-01-15 23:59:59" } (current month)
```

---

### 8. `checkUserExists(username)` (Line 270)
**Type:** Async function  
**Purpose:** Checks if a user already exists in the database

**Parameters:**
- `username` - Username to check

**Returns:** `Promise<boolean>` - `true` if user exists, `false` otherwise

**What it does:**
- Queries database for user by username
- Returns boolean indicating existence

**Used by:**
- Line 447: `POST /signup` - Check before creating new user
- Line 490: `POST /newuser` - Check before creating new user

**Note:** Prevents duplicate usernames

---

## 🔐 Middleware Functions

### 9. `verifyToken(req, res, next)` (Line 276)
**Type:** Express middleware function  
**Purpose:** Verifies JWT token from cookies or Authorization header

**Parameters:**
- `req` - Express request object
- `res` - Express response object
- `next` - Express next middleware function

**Returns:** Calls `next()` if valid, or sends 401 error if invalid

**What it does:**
- Extracts token from `req.cookies.token` or `Authorization` header
- Verifies token using `JWT_SECRET`
- Sets `req.user` with decoded token data
- Calls `next()` if valid, returns 401 if invalid/missing

**Used by:**
- Line 376: `GET /home` - Protect dashboard route
- Line 536: `GET /me` - Protect user info route
- Line 834: `GET /api/stations` - Protect main API route
- Line 1061: `POST /api/dispense-battery` - Protect battery dispense route

**Sets on request:**
- `req.user` - Object with `{ username, userType }` from token

---

## 📁 File Operation Functions

### 10. `readStations()` (Line 643)
**Type:** Async function  
**Purpose:** Reads station metadata from JSON file

**Parameters:** None

**Returns:** `Promise<Array>` - Array of station objects

**What it does:**
- Reads `data/stations.json` file
- Parses JSON and returns array
- Returns empty array on error

**Used by:**
- Line 672: `GET /api/admin/stations` - Get all stations
- Line 700: `POST /api/admin/stations` - Read before adding
- Line 752: `PUT /api/admin/stations/:id` - Read before updating
- Line 793: `DELETE /api/admin/stations/:id` - Read before deleting

**File path:** `data/stations.json`

---

### 11. `writeStations(stations)` (Line 656)
**Type:** Async function  
**Purpose:** Writes station metadata to JSON file

**Parameters:**
- `stations` - Array of station objects to write

**Returns:** `Promise<boolean>` - `true` if successful, `false` on error

**What it does:**
- Writes stations array to `data/stations.json`
- Formats JSON with 2-space indentation
- Returns success/failure status

**Used by:**
- Line 719: `POST /api/admin/stations` - Save after adding
- Line 767: `PUT /api/admin/stations/:id` - Save after updating
- Line 806: `DELETE /api/admin/stations/:id` - Save after deleting

**File path:** `data/stations.json`

---

## 🌐 HTTP Route Handlers (27 routes)

### Page Routes (8 routes)

#### `GET /` (Line 364)
**Purpose:** Root route - redirects to login  
**Auth:** None  
**Returns:** Redirect to `/login`

---

#### `GET /login` (Line 368)
**Purpose:** Serves login page HTML  
**Auth:** None  
**Returns:** Sends `public/html/login.html` file

---

#### `GET /signup` (Line 372)
**Purpose:** Serves signup page HTML  
**Auth:** None  
**Returns:** Sends `public/html/signup.html` file

---

#### `GET /home` (Line 376)
**Purpose:** Serves dashboard page HTML  
**Auth:** ✅ Required (`verifyToken` middleware)  
**Returns:** Sends `public/html/home.html` file

---

#### `GET /admin-password` (Line 406)
**Purpose:** Serves admin password entry page  
**Auth:** None  
**Returns:** Sends `public/html/admin-password.html` file

---

#### `GET /admin` (Line 416)
**Purpose:** Serves admin panel page  
**Auth:** Cookie-based (`admin_authenticated` cookie)  
**Returns:** Sends `public/html/admin.html` file or redirects to `/admin-password`

---

#### `GET /newuser` (Line 425)
**Purpose:** Serves new user creation page  
**Auth:** None (should be protected)  
**Returns:** Sends `public/html/newuser.html` file

---

#### `GET /testapi` (Line 411)
**Purpose:** Serves API token testing UI page  
**Auth:** None  
**Returns:** Sends `public/html/testapi.html` file

---

### Authentication Routes (4 routes)

#### `POST /signup` (Line 436)
**Purpose:** Creates new user account  
**Auth:** None  
**Request Body:** `{ phone, username, password, password2, stationIds }`  
**Returns:** Redirects to `/home` on success, `/signup?error=...` on failure

**Process:**
1. Validates input (phone, username, password match)
2. Checks if user exists using `checkUserExists()`
3. Hashes password using `hashPassword()`
4. Parses station IDs using `parseStationIds()`
5. Creates user via `db.createUser()`
6. Creates token using `createAuthToken()`
7. Sets cookie using `setAuthCookie()`
8. Redirects to `/home`

---

#### `POST /newuser` (Line 472)
**Purpose:** Admin creates new user account  
**Auth:** None (should be protected)  
**Request Body:** `{ phone, username, password, password2, stationIds }`  
**Returns:** Redirects to `/admin` on success, `/newuser?error=...` on failure

**Process:**
1. Validates input
2. Checks if user exists using `checkUserExists()`
3. Hashes password using `hashPassword()`
4. Parses station IDs using `parseStationIds()`
5. Creates user via `db.createUser()`
6. Redirects to `/admin` (no auto-login)

---

#### `POST /login` (Line 510)
**Purpose:** Authenticates existing user  
**Auth:** None  
**Request Body:** `{ username, password }`  
**Returns:** Redirects to `/home` on success, `/login?error=invalid` on failure

**Process:**
1. Gets user from database
2. Compares password using `bcrypt.compareSync()`
3. Creates token using `createAuthToken(username, user.userType)`
4. Sets cookie using `setAuthCookie()`
5. Redirects to `/home`

---

#### `GET /logout` (Line 430)
**Purpose:** Logs out user by clearing token cookie  
**Auth:** None  
**Returns:** Redirects to `/login`

---

### Admin Authentication Routes (2 routes)

#### `POST /api/validate-admin-password` (Line 381)
**Purpose:** Validates admin password and sets session cookie  
**Auth:** None  
**Request Body:** `{ password }`  
**Returns:** `{ success: boolean, error?: string }`

**Process:**
- Compares password to hardcoded `'1234'`
- Sets `admin_authenticated` cookie if correct
- Returns success/failure JSON

**Security Issue:** Password is hardcoded (should be in env variable)

---

#### `POST /api/logout-admin` (Line 399)
**Purpose:** Clears admin authentication cookie  
**Auth:** None  
**Returns:** `{ success: true }`

---

### User Management API Routes (3 routes)

#### `GET /me` (Line 536)
**Purpose:** Returns current authenticated user's information  
**Auth:** ✅ Required (`verifyToken` middleware)  
**Returns:** `{ username, phone, userType }`

**Process:**
1. Gets username from `req.user` (set by `verifyToken`)
2. Fetches full user data from database
3. Returns user info without password

---

#### `GET /admin/users-full` (Line 556)
**Purpose:** Returns all users with passwords (admin only)  
**Auth:** None (should be protected)  
**Returns:** Array of all users including password hashes

**Used by:** `admin.js` - `loadUsers()` function

---

#### `POST /admin/update-user-stations` (Line 571)
**Purpose:** Updates a user's station assignments  
**Auth:** None (should be protected)  
**Request Body:** `{ userId, stationIds }`  
**Returns:** `{ success: boolean, updatedUser?: object }`

**Process:**
1. Handles both dictionary format `{ "ST001": "Title" }` and string format `"ST001,ST002"`
2. Converts string format using `parseStationIds()`
3. Updates via `db.updateUserStations()`

---

#### `POST /admin/delete-user` (Line 609)
**Purpose:** Deletes a user from the database  
**Auth:** None (should be protected)  
**Request Body:** `{ userId }`  
**Returns:** `{ success: boolean, deletedUser?: object }`

---

### Station Management API Routes (4 routes)

#### `GET /api/admin/stations` (Line 669)
**Purpose:** Returns all station metadata  
**Auth:** None (should be protected)  
**Returns:** Array of station objects from `data/stations.json`

**Uses:** `readStations()` helper function

---

#### `POST /api/admin/stations` (Line 684)
**Purpose:** Creates a new station  
**Auth:** None (should be protected)  
**Request Body:** `{ id, name, address, coordinates: [longitude, latitude] }`  
**Returns:** `{ message: string, station: object }` or error

**Process:**
1. Validates required fields
2. Validates coordinates array format
3. Reads existing stations using `readStations()`
4. Checks for duplicate ID
5. Adds new station
6. Writes using `writeStations()`

---

#### `PUT /api/admin/stations/:id` (Line 739)
**Purpose:** Updates an existing station  
**Auth:** None (should be protected)  
**Request Params:** `id` - Station ID  
**Request Body:** `{ name?, address?, coordinates? }` (all optional)  
**Returns:** `{ message: string, station: object }` or error

**Process:**
1. Validates coordinates if provided
2. Reads stations using `readStations()`
3. Finds station by ID
4. Updates fields (only provided fields)
5. Writes using `writeStations()`

---

#### `DELETE /api/admin/stations/:id` (Line 787)
**Purpose:** Deletes a station  
**Auth:** None (should be protected)  
**Request Params:** `id` - Station ID  
**Returns:** `{ message: string }` or error

**Process:**
1. Reads stations using `readStations()`
2. Finds station by ID
3. Removes from array
4. Writes using `writeStations()`

---

### Main API Routes (2 routes)

#### `GET /api/stations` (Line 834)
**Purpose:** **MAIN ROUTE** - Returns station data with revenue for authenticated user  
**Auth:** ✅ Required (`verifyToken` middleware)  
**Query Params:** `startDate?`, `endDate?` (optional date range)  
**Returns:** `{ success: boolean, data: Array, debugTotals: object, ... }`

**Process:**
1. Gets user from database
2. Fetches station data (cached or fresh)
3. Filters stations by user permissions
4. For each station, fetches order history using `getDateRange()`
5. Calculates revenue from orders
6. Returns filtered stations with order data

**Key Features:**
- Supports demo user with fake data
- Uses cached station data when available
- Handles both array and dictionary station permission formats
- Fetches order data for each station in date range
- Calculates total revenue and rent counts

**Used by:** `home.js` - `fetchStations()` function

---

#### `POST /api/dispense-battery` (Line 1061)
**Purpose:** Dispenses all batteries from a station (Distributor users only)  
**Auth:** ✅ Required (`verifyToken` middleware)  
**Request Body:** `{ stationId }`  
**Returns:** `{ success: boolean, stationId, status, apiCode, apiMessage, ... }`

**Process:**
1. Checks if user is Distributor type
2. Validates stationId
3. Calls `chargenowAPI.ejectBatteryByRepair()` to dispense
4. Returns formatted response with success status

**Used by:** `home.js` - `dispenseBattery()` function

---

### Utility/Health Routes (3 routes)

#### `GET /api/health` (Line 294)
**Purpose:** Health check endpoint for Vercel deployment  
**Auth:** None  
**Returns:** `{ status: 'ok', timestamp: string }`

**Used by:** Vercel for health monitoring

---

#### `GET /api/test-token-status` (Line 299)
**Purpose:** Returns background token test results  
**Auth:** None  
**Returns:** `{ success: boolean, stats: object, recentLogs: Array }`

**Returns:**
- Test statistics (request count, success rate, etc.)
- Last 50 log entries from background testing

**Used by:** `testapi.html` - Displays test results in UI

---

#### `POST /api/test-token-now` (Line 332)
**Purpose:** Triggers immediate token test  
**Auth:** None  
**Returns:** `{ success: boolean, result: object }`

**Process:**
1. Calls `performTokenTest()` immediately
2. Returns latest test result

---

## 📊 Function Usage Summary

### Most Used Functions:
1. **`readStations()`** - Used 4 times (all station CRUD operations)
2. **`writeStations()`** - Used 3 times (create, update, delete stations)
3. **`verifyToken()`** - Used 4 times (protects 4 routes)
4. **`parseStationIds()`** - Used 3 times (signup, newuser, update-stations)
5. **`getDateRange()`** - Used 1 time (main stations route)

### Background Services:
- **`updateStationData()`** - Runs every 60 seconds automatically
- **`performTokenTest()`** - Runs every 60 seconds automatically

---

## 🔗 Function Dependencies

```
Background Services:
├── updateStationData()
│   └── Uses: chargenowAPI.fetchChargeNowStations()
│
└── performTokenTest()
    └── Uses: fetch() (global)

Helper Functions:
├── parseStationIds()
│   └── No dependencies
│
├── hashPassword()
│   └── Uses: bcrypt.hashSync()
│
├── createAuthToken()
│   └── Uses: jwt.sign(), JWT_SECRET
│
├── setAuthCookie()
│   └── Uses: res.cookie() (Express)
│
├── getDateRange()
│   └── Uses: Date object, toISOString()
│
└── checkUserExists()
    └── Uses: db.getUserByUsername()

Middleware:
└── verifyToken()
    └── Uses: jwt.verify(), JWT_SECRET

File Operations:
├── readStations()
│   └── Uses: fs.promises.readFile()
│
└── writeStations()
    └── Uses: fs.promises.writeFile()
```

---

## ⚠️ Security Notes

1. **Hardcoded Admin Password** (Line 383): Should be in environment variable
2. **Hardcoded JWT Secret** (Line 185): Should be in environment variable
3. **Hardcoded API Token** (Line 78): Should be in environment variable
4. **Cookie Security**: Automatically uses `secure: true` in production (good!)

---

## 📝 Code Quality Notes

1. **Excessive Logging**: `/api/stations` route has ~50+ console.log statements
2. **Long Route**: `/api/stations` is 224 lines - could be broken into helper functions
3. **Error Handling**: Most routes use try-catch with similar error responses
4. **Validation**: Some routes lack input validation

---

**Last Updated:** 2025-01-15  
**File Size:** 1,154 lines  
**Total Functions:** 11 functions + 27 routes

