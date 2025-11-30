# Server.js Function Analysis - Unused & Duplicated Code

## 📊 Summary

- **Total Functions Defined:** 5 functions
- **Unused Functions:** 0 (all functions are used)
- **Duplicated Code Patterns:** 6 patterns found
- **Undefined Variables:** 1 bug found
- **Estimated Lines to Save:** ~50-70 lines

---

## ✅ All Functions Are Used

### 1. `updateStationData()` (Line 27)
- **Status:** ✅ USED
- **Used by:** 
  - Line 44: Initial call on server start
  - Line 47: `setInterval(updateStationData, 60000)`
- **Action:** KEEP

### 2. `performTokenTest()` (Line 67)
- **Status:** ✅ USED
- **Used by:**
  - Line 175: Initial call on server start
  - Line 178: `setInterval(performTokenTest, ...)`
  - Line 255: Manual trigger endpoint `/api/test-token-now`
- **Action:** KEEP

### 3. `verifyToken()` (Line 196)
- **Status:** ✅ USED
- **Used by:**
  - Line 296: `GET /home` route
  - Line 472: `GET /me` route
  - Line 770: `GET /api/stations` route
  - Line 1018: `POST /api/dispense-battery` route
- **Action:** KEEP

### 4. `readStations()` (Line 579)
- **Status:** ✅ USED
- **Used by:**
  - Line 608: `GET /api/admin/stations`
  - Line 636: `POST /api/admin/stations`
  - Line 688: `PUT /api/admin/stations/:id`
  - Line 729: `DELETE /api/admin/stations/:id`
- **Action:** KEEP

### 5. `writeStations()` (Line 592)
- **Status:** ✅ USED
- **Used by:**
  - Line 655: `POST /api/admin/stations`
  - Line 703: `PUT /api/admin/stations/:id`
  - Line 742: `DELETE /api/admin/stations/:id`
- **Action:** KEEP

---

## 🔄 Duplicated Code Patterns

### 1. **Station ID Parsing** (3 occurrences)
**Pattern:** `stationIds.split(',').map(id => id.trim()).filter(id => id)`

**Locations:**
- Line 376: `POST /signup` route
- Line 427: `POST /newuser` route  
- Line 524: `POST /admin/update-user-stations` route

**Code:**
```javascript
// Line 376
const stationIdsArray = stationIds ? stationIds.split(',').map(id => id.trim()).filter(id => id) : [];

// Line 427
const stationIdsArray = stationIds ? stationIds.split(',').map(id => id.trim()).filter(id => id) : [];

// Line 524
const stationIdsArray = stationIds.split(',').map(id => id.trim()).filter(id => id);
```

**Recommendation:** Extract to helper function:
```javascript
function parseStationIds(stationIds) {
  if (!stationIds) return [];
  if (typeof stationIds === 'string') {
    return stationIds.split(',').map(id => id.trim()).filter(id => id);
  }
  return Array.isArray(stationIds) ? stationIds : [];
}
```

**Lines Saved:** ~6 lines

---

### 2. **Password Hashing** (2 occurrences)
**Pattern:** `bcrypt.hashSync(password, 10)`

**Locations:**
- Line 374: `POST /signup` route
- Line 425: `POST /newuser` route

**Code:**
```javascript
// Line 374
const hash = bcrypt.hashSync(password, 10);

// Line 425
const hash = bcrypt.hashSync(password, 10);
```

**Recommendation:** Extract to helper function:
```javascript
function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}
```

**Lines Saved:** ~2 lines

---

### 3. **JWT Token Creation** (2 occurrences)
**Pattern:** `jwt.sign({ username, userType }, JWT_SECRET, { expiresIn: '24h' })`

**Locations:**
- Line 380: `POST /signup` route (without userType)
- Line 452: `POST /login` route (with userType)

**Code:**
```javascript
// Line 380 (signup)
const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });

// Line 452 (login)
const token = jwt.sign({ username, userType: user.userType }, JWT_SECRET, { expiresIn: '24h' });
```

**Recommendation:** Extract to helper function:
```javascript
function createAuthToken(username, userType = null) {
  const payload = { username };
  if (userType) payload.userType = userType;
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}
```

**Lines Saved:** ~4 lines

---

### 4. **Cookie Setting for JWT** (2 occurrences)
**Pattern:** Setting JWT token cookie with same options

**Locations:**
- Lines 383-389: `POST /signup` route
- Lines 455-461: `POST /login` route

**Code:**
```javascript
// Lines 383-389 (signup)
res.cookie('token', token, {
  httpOnly: true,
  secure: false, // Set to true for HTTPS
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  sameSite: 'lax',
  path: '/'
});

// Lines 455-461 (login) - IDENTICAL
res.cookie('token', token, {
  httpOnly: true,
  secure: false, // Set to true for HTTPS
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  sameSite: 'lax',
  path: '/'
});
```

**Recommendation:** Extract to helper function:
```javascript
function setAuthCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax',
    path: '/'
  });
}
```

**Lines Saved:** ~14 lines

---

### 5. **Date Range Calculation** (2 occurrences)
**Pattern:** Setting start/end of day and converting to API format

**Locations:**
- Lines 902-911: `GET /api/stations` route (default date range)
- Lines 893-900: `GET /api/stations` route (custom date range)

**Code:**
```javascript
// Lines 893-900 (custom date range)
const startDate = new Date(queryStartDate + 'T00:00:00');
const endDate = new Date(queryEndDate + 'T23:59:59');
sTime = startDate.toISOString().slice(0, 19).replace('T', ' ');
eTime = endDate.toISOString().slice(0, 19).replace('T', ' ');

// Lines 902-911 (default date range)
const endDate = new Date();
const startDate = new Date();
startDate.setDate(1);
startDate.setHours(0, 0, 0, 0);
endDate.setHours(23, 59, 59, 999);
sTime = startDate.toISOString().slice(0, 19).replace('T', ' ');
eTime = endDate.toISOString().slice(0, 19).replace('T', ' ');
```

**Recommendation:** Extract to helper function:
```javascript
function getDateRange(startDateStr, endDateStr) {
  let startDate, endDate;
  
  if (startDateStr && endDateStr) {
    // Custom date range
    startDate = new Date(startDateStr + 'T00:00:00');
    endDate = new Date(endDateStr + 'T23:59:59');
  } else {
    // Default: first day of current month to today
    endDate = new Date();
    startDate = new Date();
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
  }
  
  return {
    sTime: startDate.toISOString().slice(0, 19).replace('T', ' '),
    eTime: endDate.toISOString().slice(0, 19).replace('T', ' ')
  };
}
```

**Lines Saved:** ~18 lines

---

### 6. **User Validation Logic** (2 occurrences)
**Pattern:** Checking if user exists and password validation

**Locations:**
- Lines 367-371: `POST /signup` route
- Lines 418-422: `POST /newuser` route

**Code:**
```javascript
// Lines 367-371 (signup)
const existingUser = await db.getUserByUsername(username);
if (existingUser) {
  console.log('Signup failed - user already exists:', username);
  return res.redirect('/signup?error=exists');
}

// Lines 418-422 (newuser)
const existingUser = await db.getUserByUsername(username);
if (existingUser) {
  console.log('User already exists:', username);
  return res.redirect('/newuser?error=exists');
}
```

**Recommendation:** Extract to helper function:
```javascript
async function checkUserExists(username) {
  const existingUser = await db.getUserByUsername(username);
  return !!existingUser;
}
```

**Lines Saved:** ~4 lines

---

## 🐛 Bugs Found

### 1. **Undefined Variable: `dispenseUrl`** (Line 1069)
**Location:** `POST /api/dispense-battery` route

**Issue:**
```javascript
// Line 1069
url: dispenseUrl,  // ❌ Variable never defined!
```

**Fix:** Remove this line or define the variable:
```javascript
// Option 1: Remove (recommended)
const responseData = {
  success: isSuccessful,
  stationId: stationId,
  // url: dispenseUrl,  // Remove this line
  status: response.status,
  // ...
};

// Option 2: Define it
const dispenseUrl = `https://developer.chargenow.top/cdb-open-api/v1/rent/cabinet/popAll?deviceId=${stationId}`;
```

**Action:** REMOVE the undefined variable

---

## 📝 Additional Observations

### Excessive Console Logging
**Issue:** Too many `console.log` statements, especially in `/api/stations` route (lines 780-994)

**Examples:**
- Lines 780-797: Extensive debug logging for station filtering
- Lines 823-844: Multiple structure checks
- Lines 980-994: Debug totals calculation

**Recommendation:** 
- Remove debug logs in production
- Use a logging library with log levels
- Keep only essential error logs

**Estimated Lines:** ~50-80 lines of debug logs

---

### Repeated Error Handling Pattern
**Pattern:** Similar try-catch blocks with similar error responses

**Locations:** Multiple routes have identical error handling:
```javascript
catch (error) {
  console.error('Error message:', error);
  res.status(500).json({ error: 'Server error' });
}
```

**Recommendation:** Create error handler middleware:
```javascript
function handleError(error, req, res, next) {
  console.error('Error:', error);
  res.status(500).json({ error: 'Server error' });
}
```

---

## 🎯 Refactoring Priority

### High Priority (Do First):
1. **Fix undefined `dispenseUrl` variable** - Bug fix
2. **Extract cookie setting function** - 14 lines saved, used 2x
3. **Extract date range calculation** - 18 lines saved, used 2x

### Medium Priority:
4. **Extract station ID parsing** - 6 lines saved, used 3x
5. **Extract JWT token creation** - 4 lines saved, used 2x
6. **Extract password hashing** - 2 lines saved, used 2x

### Low Priority (Nice to Have):
7. **Remove excessive debug logging** - 50-80 lines (but useful for debugging)
8. **Extract user validation** - 4 lines saved, used 2x

---

## 📊 Total Potential Savings

- **Duplicated code extraction:** ~50-70 lines
- **Bug fix:** 1 line (remove undefined variable)
- **Total:** ~51-71 lines reduction

**Current file size:** 1,112 lines  
**After refactoring:** ~1,040-1,060 lines  
**Reduction:** ~5-6%

---

## ✅ Recommended Helper Functions to Create

```javascript
// Helper functions to add to server.js

function parseStationIds(stationIds) {
  if (!stationIds) return [];
  if (typeof stationIds === 'string') {
    return stationIds.split(',').map(id => id.trim()).filter(id => id);
  }
  return Array.isArray(stationIds) ? stationIds : [];
}

function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

function createAuthToken(username, userType = null) {
  const payload = { username };
  if (userType) payload.userType = userType;
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

function setAuthCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax',
    path: '/'
  });
}

function getDateRange(startDateStr, endDateStr) {
  let startDate, endDate;
  
  if (startDateStr && endDateStr) {
    startDate = new Date(startDateStr + 'T00:00:00');
    endDate = new Date(endDateStr + 'T23:59:59');
  } else {
    endDate = new Date();
    startDate = new Date();
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
  }
  
  return {
    sTime: startDate.toISOString().slice(0, 19).replace('T', ' '),
    eTime: endDate.toISOString().slice(0, 19).replace('T', ' ')
  };
}

async function checkUserExists(username) {
  const existingUser = await db.getUserByUsername(username);
  return !!existingUser;
}
```

---

**Last Updated:** 2025-01-15  
**Analysis Method:** Code pattern matching and usage tracking


