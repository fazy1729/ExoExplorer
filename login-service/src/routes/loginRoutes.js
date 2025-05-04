const express = require('express');
const loginController = require('../controllers/loginController');

const router = express.Router();

// Route for user login
router.post('/login', loginController.login);

// Route for user registration (if applicable)
router.post('/register', loginController.register);


module.exports = router;