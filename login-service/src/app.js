const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const loginRoutes = require('./routes/loginRoutes');
const config = require('./config');
const path = require('path');

const app = express();

app.use(cors());

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Serve static files
app.use('/public', express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', loginRoutes);

// Start the server
const PORT = config.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
module.exports = config;