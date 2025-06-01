const express = require('express');
const router = express.Router();

// Importer les routes
const homeRoutes = require('./home.routes');

// Routes publiques
router.use('/home', homeRoutes);

module.exports = router;