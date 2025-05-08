// tests/mockApp.js
const express = require('express');
const app = express();

app.use(express.json());

app.post('/api/auth/register', (req, res) => {
  return res.status(200).json({ message: 'User registered (simulat)' });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (email === 'john@example.com' && password === 'password123') {
    return res.status(200).json({ token: 'fake-jwt-token' });
  }

  return res.status(200).json({ message: 'Invalid credentials (simulat)' });
});

app.get('/', (req, res) => {
  return res.status(200).send('Root route (simulat)');
});

app.get('/public', (req, res) => {
  return res.status(200).send('Public route (simulat)');
});

module.exports = app;
