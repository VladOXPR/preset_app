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
app.use(session({
  secret: 'preset_secret',
  resave: false,
  saveUninitialized: false
}));

// Health check endpoint for Vercel
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
    const { phone, username, password, password2 } = req.body;
    if (!phone || !username || !password || !password2 || password !== password2) {
      return res.redirect('/signup?error=invalid');
    }
    
    // Check if user already exists
    const existingUser = await db.getUserByUsername(username);
    if (existingUser) {
      return res.redirect('/signup?error=exists');
    }
    
    const hash = bcrypt.hashSync(password, 10);
    await db.createUser(username, phone, hash);
    req.session.user = { username };
    res.redirect('/welcome');
  } catch (error) {
    console.error('Signup error:', error);
    res.redirect('/signup?error=server');
  }
});

// Admin user creation - handles new user creation from admin panel
app.post('/newuser', async (req, res) => {
  try {
    const { phone, username, password, password2 } = req.body;
    if (!phone || !username || !password || !password2 || password !== password2) {
      return res.redirect('/newuser?error=invalid');
    }
    
    // Check if user already exists
    const existingUser = await db.getUserByUsername(username);
    if (existingUser) {
      return res.redirect('/newuser?error=exists');
    }
    
    const hash = bcrypt.hashSync(password, 10);
    await db.createUser(username, phone, hash);
    res.redirect('/admin');
  } catch (error) {
    console.error('New user creation error:', error);
    res.redirect('/newuser?error=server');
  }
});

// User login - authenticates existing users
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await db.getUserByUsername(username);
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.redirect('/login?error=invalid');
    }
    
    req.session.user = { username };
    res.redirect('/welcome');
  } catch (error) {
    console.error('Login error:', error);
    res.redirect('/login?error=server');
  }
});

// API endpoints for frontend data
app.get('/me', async (req, res) => {
  try {
    console.log('Session:', req.session);
    if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
    const user = await db.getUserByUsername(req.session.user.username);
    console.log('User from DB:', user);
    res.json({ username: user.username, phone: user.phone });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get list of all users (for welcome page)
app.get('/users', async (req, res) => {
  try {
    if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
    const users = await db.getAllUsers();
    const filteredUsers = users.filter(u => u.username !== req.session.user.username);
    res.json(filteredUsers);
  } catch (error) {
    console.error('Get users error:', error);
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