const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../utils/db');
const config = require('../config');

class LoginController {
  async register(req, res) {
    const { name, email, password } = req.body;

    try {
      const hashedPassword = await bcrypt.hash(password, config.BCRYPT_SALT_ROUNDS);

      // Option 1: Using pool.execute()
      const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
      await pool.execute(sql, [name, email, hashedPassword]);

      // Or Option 2: Getting a connection first
      // const connection = await pool.getConnection();
      // try {
      //   await connection.query(sql, [name, email, hashedPassword]);
      // } finally {
      //   connection.release();
      // }

      res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async login(req, res) {
    const { email, password } = req.body;

    try {
      // Using pool.execute()
      const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
      const user = rows[0];

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ id: user.id, email: user.email }, config.JWT_SECRET, {
        expiresIn: '1h',
      });

      res.status(200).json({ message: 'Login successful', token });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new LoginController();