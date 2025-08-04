// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const db = require('./database');

// Initialize Express app and configuration
const app = express();
const PORT = process.env.PORT || 3000;

// JWT secret key
const JWT_SECRET = 'preset_jwt_secret_key_very_long_and_secure';

// Middleware setup
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static('public'));

// JWT middleware to verify tokens
function verifyToken(req, res, next) {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Health check endpoint for Vercel
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test database endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    console.log('Testing database connection...');
    const users = await db.getAllUsers();
    console.log('Database test - Users found:', users.length);
    res.json({ 
      status: 'ok', 
      users_count: users.length,
      sample_user: users[0] || null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ 
      status: 'error', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Check database schema endpoint
app.get('/api/check-schema', async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ error: 'DATABASE_URL not found' });
    }

    console.log('🔍 Checking database schema...');
    const { neon } = require('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL);

    // Get all columns from users table
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `;

    console.log('📊 Current users table structure:', columns);
    
    res.json({ 
      status: 'success', 
      table: 'users',
      columns: columns,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Schema check failed:', error);
    res.status(500).json({ 
      status: 'error', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Migrate database endpoint (GET version for browser access)
app.get('/api/migrate', async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ error: 'DATABASE_URL not found' });
    }

    console.log('🔄 Starting Neon database migration...');
    const { neon } = require('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL);

    // Check if bio column exists
    console.log('📋 Checking if bio column exists...');
    const columnCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'bio'
    `;

    if (columnCheck.length > 0) {
      console.log('✅ Bio column already exists in users table.');
      return res.json({ 
        status: 'success', 
        message: 'Bio column already exists',
        timestamp: new Date().toISOString()
      });
    }

    // Add bio column
    console.log('➕ Adding bio column to users table...');
    await sql`
      ALTER TABLE users 
      ADD COLUMN bio TEXT DEFAULT ''
    `;
    
    console.log('✅ Bio column added successfully!');
    
    // Verify the column was added
    const verify = await sql`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'bio'
    `;
    
    if (verify.length > 0) {
      console.log('🔍 Verification successful');
      res.json({ 
        status: 'success', 
        message: 'Bio column added successfully',
        column: verify[0],
        timestamp: new Date().toISOString()
      });
    } else {
      throw new Error('Column verification failed');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    res.status(500).json({ 
      status: 'error', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Explicit static file routes for Vercel
app.get('/style.css', (req, res) => {
  res.setHeader('Content-Type', 'text/css');
  res.sendFile(path.join(__dirname, 'public', 'css', 'style.css'));
});

app.get('/welcome.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, 'public', 'js', 'welcome.js'));
});

app.get('/chat.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, 'public', 'js', 'chat.js'));
});

app.get('/admin.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, 'public', 'js', 'admin.js'));
});

// Static page routes - serve HTML files
app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'login.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'signup.html'));
});

app.get('/welcome', (req, res) => {
  // Check if user has valid JWT token
  const token = req.cookies?.token;
  
  if (!token) {
    console.log('No JWT token found, redirecting to login');
    return res.redirect('/login');
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('User accessing welcome page:', decoded.username);
    res.sendFile(path.join(__dirname, 'public', 'html', 'welcome.html'));
  } catch (error) {
    console.log('Invalid JWT token, redirecting to login');
    res.clearCookie('token');
    res.redirect('/login');
  }
});

app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'chat.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'admin.html'));
});

app.get('/newuser', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'newuser.html'));
});

// Authentication routes
app.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

// User registration - handles new user signup
app.post('/signup', async (req, res) => {
  try {
    console.log('Signup attempt:', req.body);
    const { phone, username, password, password2, bio } = req.body;
    
    if (!phone || !username || !password || !password2 || password !== password2) {
      console.log('Signup validation failed');
      return res.redirect('/signup?error=invalid');
    }
    
    // Check if user already exists
    const existingUser = await db.getUserByUsername(username);
    if (existingUser) {
      console.log('Signup failed - user already exists:', username);
      return res.redirect('/signup?error=exists');
    }
    
    console.log('Creating new user:', username);
    const hash = bcrypt.hashSync(password, 10);
    await db.createUser(username, phone, hash, bio);
    
    console.log('User created successfully, generating JWT token');
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
    
    // Set JWT token as HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // Set to true for HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax',
      path: '/'
    });
    
    console.log('JWT token set, redirecting to welcome');
    res.redirect('/welcome');
  } catch (error) {
    console.error('Signup error:', error);
    res.redirect('/signup?error=server');
  }
});

// Admin user creation - handles new user creation from admin panel
app.post('/newuser', async (req, res) => {
  try {
    console.log('Admin user creation request:', req.body);
    const { phone, username, password, password2, bio } = req.body;
    
    // Validate input
    if (!phone || !username || !password || !password2) {
      console.log('Missing required fields:', { phone, username, password: !!password, password2: !!password2 });
      return res.redirect('/newuser?error=invalid');
    }
    
    if (password !== password2) {
      console.log('Passwords do not match');
      return res.redirect('/newuser?error=invalid');
    }
    
    console.log('Checking if user exists:', username);
    // Check if user already exists
    const existingUser = await db.getUserByUsername(username);
    if (existingUser) {
      console.log('User already exists:', username);
      return res.redirect('/newuser?error=exists');
    }
    
    console.log('Creating new user:', username);
    const hash = bcrypt.hashSync(password, 10);
    const newUser = await db.createUser(username, phone, hash, bio);
    console.log('User created successfully:', newUser);
    
    res.redirect('/admin');
  } catch (error) {
    console.error('New user creation error:', error);
    console.error('Error stack:', error.stack);
    res.redirect('/newuser?error=server');
  }
});

// User login - authenticates existing users
app.post('/login', async (req, res) => {
  try {
    console.log('Login attempt:', req.body);
    const { username, password } = req.body;
    const user = await db.getUserByUsername(username);
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
      console.log('Login failed for username:', username);
      return res.redirect('/login?error=invalid');
    }
    
    console.log('Login successful for username:', username);
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
    
    // Set JWT token as HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // Set to true for HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax',
      path: '/'
    });
    
    console.log('JWT token set, redirecting to welcome');
    res.redirect('/welcome');
  } catch (error) {
    console.error('Login error:', error);
    res.redirect('/login?error=server');
  }
});

// Session check endpoint
app.get('/api/session', (req, res) => {
  res.json({
    sessionID: req.sessionID,
    session: req.session,
    user: req.session.user,
    timestamp: new Date().toISOString()
  });
});

// Test endpoint to check if user is logged in
app.get('/api/test-auth', (req, res) => {
  const token = req.cookies?.token;
  
  if (!token) {
    return res.json({ loggedIn: false });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ 
      loggedIn: true, 
      username: decoded.username
    });
  } catch (error) {
    res.clearCookie('token');
    res.json({ loggedIn: false });
  }
});

// JWT token check endpoint
app.get('/api/token', (req, res) => {
  const token = req.cookies?.token;
  
  if (!token) {
    return res.json({ hasToken: false });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ 
      hasToken: true, 
      username: decoded.username,
      expiresIn: decoded.exp 
    });
  } catch (error) {
    res.clearCookie('token');
    res.json({ hasToken: false, error: 'Invalid token' });
  }
});

// API endpoints for frontend data
app.get('/me', verifyToken, async (req, res) => {
  try {
    console.log('GET /me - User from token:', req.user);
    
    const user = await db.getUserByUsername(req.user.username);
    console.log('GET /me - User from DB:', user);
    
    if (!user) {
      console.log('GET /me - User not found in DB');
      return res.status(401).json({ error: 'User not found' });
    }
    
    res.json({ username: user.username, phone: user.phone });
  } catch (error) {
    console.error('GET /me - Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get list of all users (for welcome page)
app.get('/users', verifyToken, async (req, res) => {
  try {
    console.log('GET /users - User from token:', req.user);
    
    const users = await db.getAllUsers();
    console.log('GET /users - All users from DB:', users);
    console.log('GET /users - Users count:', users.length);
    console.log('GET /users - First user sample:', users[0]);
    
    const filteredUsers = users.filter(u => u.username !== req.user.username);
    console.log('GET /users - Filtered users:', filteredUsers);
    console.log('GET /users - Filtered count:', filteredUsers.length);
    
    res.json(filteredUsers);
  } catch (error) {
    console.error('GET /users - Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Chat functionality - send new message
app.post('/chat/send', verifyToken, async (req, res) => {
  try {
    console.log('Chat send - User from token:', req.user);
    const { to, text } = req.body;
    if (!to || !text) return res.status(400).json({ error: 'Missing fields' });
    
    const from = req.user.username;
    console.log('Sending message from:', from, 'to:', to);
    await db.saveMessage(from, to, text);
    res.json({ success: true });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Chat functionality - get chat history between two users
app.get('/chat/history', verifyToken, async (req, res) => {
  try {
    console.log('Chat history - User from token:', req.user);
    const { user } = req.query;
    if (!user) return res.status(400).json({ error: 'Missing user' });
    
    const me = req.user.username;
    console.log('Getting chat history for:', me, 'with:', user);
    const messages = await db.getChatHistory(me, user);
    console.log('Messages from DB:', messages);
    res.json(messages);
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin panel endpoints
app.get('/admin/users', async (req, res) => {
  try {
    console.log('GET /admin/users - Starting request');
    const users = await db.getAllUsers();
    console.log('GET /admin/users - Users from DB:', users);
    console.log('GET /admin/users - Users count:', users.length);
    console.log('GET /admin/users - First user sample:', users[0]);
    res.json(users);
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin panel endpoints with full user details (including passwords)
app.get('/admin/users-full', async (req, res) => {
  try {
    console.log('GET /admin/users-full - Starting request');
    const users = await db.getAllUsersWithPasswords();
    console.log('GET /admin/users-full - Users from DB:', users);
    console.log('GET /admin/users-full - Users count:', users.length);
    console.log('GET /admin/users-full - First user sample:', users[0]);
    res.json(users);
  } catch (error) {
    console.error('Get admin users full error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/admin/delete-user', async (req, res) => {
  try {
    console.log('Admin delete user request:', req.body);
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    console.log('Deleting user with ID:', userId);
    const deletedUser = await db.deleteUser(userId);
    console.log('User deleted successfully:', deletedUser);
    
    res.json({ success: true, deletedUser });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Check for unread messages from a specific user
app.get('/messages/unread', verifyToken, async (req, res) => {
  try {
    console.log('GET /messages/unread - User from token:', req.user);
    const { from } = req.query;
    if (!from) return res.status(400).json({ error: 'Missing from user' });
    
    const me = req.user.username;
    console.log('Checking unread messages from:', from, 'to:', me);
    
    // Get messages from the other user to me
    const messages = await db.getChatHistory(from, me);
    console.log('Messages from DB:', messages);
    
    // Check if there are any messages from this user
    const hasMessages = messages && messages.length > 0;
    
    res.json({ hasMessages });
  } catch (error) {
    console.error('Get unread messages error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start the server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Error handling for uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});