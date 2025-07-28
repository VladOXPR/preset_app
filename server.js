// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const db = require('./database');

// Initialize Express app and configuration
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));

// Session configuration for Vercel
app.use(session({
  secret: 'preset_secret_key_very_long_and_secure',
  resave: true,
  saveUninitialized: true,
  cookie: {
    secure: false, // Set to false for HTTP, true for HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  },
  name: 'preset_session'
}));

// Session debugging middleware
app.use((req, res, next) => {
  console.log('Session ID:', req.sessionID);
  console.log('Session data:', req.session);
  next();
});

// Health check endpoint for Vercel
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Explicit static file routes for Vercel
app.get('/style.css', (req, res) => {
  res.setHeader('Content-Type', 'text/css');
  res.sendFile(path.join(__dirname, 'public', 'style.css'));
});

app.get('/welcome.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, 'public', 'welcome.js'));
});

app.get('/chat.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, 'public', 'chat.js'));
});

app.get('/admin.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, 'public', 'admin.js'));
});

// Static page routes - serve HTML files
app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.get('/welcome', (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    console.log('Unauthorized access to welcome page, redirecting to login');
    return res.redirect('/login');
  }
  console.log('User accessing welcome page:', req.session.user.username);
  res.sendFile(path.join(__dirname, 'public', 'welcome.html'));
});

app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/newuser', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'newuser.html'));
});

// Authentication routes
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// User registration - handles new user signup
app.post('/signup', async (req, res) => {
  try {
    console.log('Signup attempt:', req.body);
    const { phone, username, password, password2 } = req.body;
    
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
    await db.createUser(username, phone, hash);
    
    console.log('User created successfully, setting session');
    req.session.user = { username };
    
    // Force session save and then redirect
    req.session.save((err) => {
      if (err) {
        console.error('Session save error during signup:', err);
        return res.redirect('/signup?error=server');
      }
      console.log('Session saved successfully during signup, redirecting to welcome');
      // Use a small delay to ensure session is saved
      setTimeout(() => {
        res.redirect('/welcome');
      }, 100);
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.redirect('/signup?error=server');
  }
});

// Admin user creation - handles new user creation from admin panel
app.post('/newuser', async (req, res) => {
  try {
    console.log('Admin user creation request:', req.body);
    const { phone, username, password, password2 } = req.body;
    
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
    const newUser = await db.createUser(username, phone, hash);
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
    req.session.user = { username };
    
    // Force session save and then redirect
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.redirect('/login?error=server');
      }
      console.log('Session saved successfully during login, redirecting to welcome');
      // Use a small delay to ensure session is saved
      setTimeout(() => {
        res.redirect('/welcome');
      }, 100);
    });
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
  if (req.session.user) {
    res.json({ 
      loggedIn: true, 
      username: req.session.user.username,
      sessionID: req.sessionID 
    });
  } else {
    res.json({ loggedIn: false });
  }
});

// API endpoints for frontend data
app.get('/me', async (req, res) => {
  try {
    console.log('GET /me - Session ID:', req.sessionID);
    console.log('GET /me - Session data:', req.session);
    console.log('GET /me - Session user:', req.session.user);
    
    if (!req.session.user) {
      console.log('GET /me - No session user, returning 401');
      return res.status(401).json({ error: 'Not logged in' });
    }
    
    const user = await db.getUserByUsername(req.session.user.username);
    console.log('GET /me - User from DB:', user);
    
    if (!user) {
      console.log('GET /me - User not found in DB, clearing session');
      req.session.destroy();
      return res.status(401).json({ error: 'User not found' });
    }
    
    res.json({ username: user.username, phone: user.phone });
  } catch (error) {
    console.error('GET /me - Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get list of all users (for welcome page)
app.get('/users', async (req, res) => {
  try {
    console.log('GET /users - Session ID:', req.sessionID);
    console.log('GET /users - Session data:', req.session);
    console.log('GET /users - Session user:', req.session.user);
    
    if (!req.session.user) {
      console.log('GET /users - No session user, returning 401');
      return res.status(401).json({ error: 'Not logged in' });
    }
    
    const users = await db.getAllUsers();
    console.log('GET /users - All users from DB:', users);
    
    const filteredUsers = users.filter(u => u.username !== req.session.user.username);
    console.log('GET /users - Filtered users:', filteredUsers);
    
    res.json(filteredUsers);
  } catch (error) {
    console.error('GET /users - Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Chat functionality - send new message
app.post('/chat/send', async (req, res) => {
  try {
    console.log('Session in send:', req.session);
    if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
    const { to, text } = req.body;
    if (!to || !text) return res.status(400).json({ error: 'Missing fields' });
    
    const from = req.session.user.username;
    console.log('Sending message from:', from, 'to:', to);
    await db.saveMessage(from, to, text);
    res.json({ success: true });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Chat functionality - get chat history between two users
app.get('/chat/history', async (req, res) => {
  try {
    console.log('Session in history:', req.session);
    if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
    const { user } = req.query;
    if (!user) return res.status(400).json({ error: 'Missing user' });
    
    const me = req.session.user.username;
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
    const users = await db.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/admin/delete-user', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username required' });
    
    await db.deleteUser(username);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
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