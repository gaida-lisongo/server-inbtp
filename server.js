require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Model } = require('./models');
const app = express();

let lamp = true;

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
    res.json({ message: 'Welcome to ISTA API', connexions: allConnexions });
});

app.get('/lamp/:state', (req, res) => {
    const { state } = req.params;

    if( state === 'on') {
        lamp = true;
        console.log('Lamp is ON');

        res.setHeader('Content-Type', 'text/plain');
        res.send('1');
    } else {
        lamp = false;
        console.log('Lamp is OFF');

        res.setHeader('Content-Type', 'text/plain');
        res.send('0');
    }
    
});

app.get('/esp', (req, res) => {
    const esp = {
        message: 'Bienvenido a la API de ISTA',
        connexions: 0,
        clientIp: req.ip || req.connection.remoteAddress,
    };

    console.log('ESP Request:', esp);

    //Reponse au format text/plain
    res.setHeader('Content-Type', 'text/plain');
    res.send(`${lamp ? '1' : '0'}`);
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
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}.`);
    console.log(`Server is running on http://0.0.0.0:${PORT}.`);
});