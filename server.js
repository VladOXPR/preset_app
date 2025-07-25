const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 4000;
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const MESSAGES_FILE = path.join(__dirname, 'data', 'messages.json');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(session({
  secret: 'preset_secret',
  resave: false,
  saveUninitialized: false
}));

app.get('/', (req, res) => {
  res.redirect('/login.html');
});

function loadUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function loadMessages() {
  if (!fs.existsSync(MESSAGES_FILE)) return [];
  return JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
}

function saveMessages(messages) {
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
}

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login.html');
  });
});

app.post('/signup', (req, res) => {
  const { phone, username, password, password2 } = req.body;
  if (!phone || !username || !password || !password2 || password !== password2) {
    return res.redirect('/signup.html?error=invalid');
  }
  let users = loadUsers();
  if (users.find(u => u.username === username)) {
    return res.redirect('/signup.html?error=exists');
  }
  const hash = bcrypt.hashSync(password, 10);
  users.push({ phone, username, password: hash });
  saveUsers(users);
  req.session.user = { username };
  res.redirect('/welcome.html');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  let users = loadUsers();
  const user = users.find(u => u.username === username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.redirect('/login.html?error=invalid');
  }
  req.session.user = { username };
  res.redirect('/welcome.html');
});

app.post('/chat/send', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  const { to, text } = req.body;
  if (!to || !text) return res.status(400).json({ error: 'Missing fields' });
  const from = req.session.user.username;
  const messages = loadMessages();
  messages.push({ from, to, text, timestamp: Date.now() });
  saveMessages(messages);
  res.json({ success: true });
});

app.get('/chat/history', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  const { user } = req.query;
  if (!user) return res.status(400).json({ error: 'Missing user' });
  const me = req.session.user.username;
  const messages = loadMessages();
  const chat = messages.filter(m => (m.from === me && m.to === user) || (m.from === user && m.to === me));
  res.json(chat);
});

app.get('/me', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  let users = loadUsers();
  const user = users.find(u => u.username === req.session.user.username);
  res.json({ username: user.username, phone: user.phone });
});

app.get('/users', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  let users = loadUsers();
  res.json(users.filter(u => u.username !== req.session.user.username).map(u => ({ username: u.username, phone: u.phone })));
});

module.exports = app;

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
}); 