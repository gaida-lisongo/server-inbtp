require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Model } = require('./models');
const app = express();

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Basic route
app.get('/', async (req, res) => {
    const request = await Model.findConnexion();

    console.log('Request:', request);
    const allConnexions = request ? request.length : 0;
    res.json({ message: 'Welcome to INBTP API', connexions: allConnexions });
});

// Routes
const routes = require('./routes');
app.use('/api', routes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Set port and start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
    
});