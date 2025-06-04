const express = require('express');
const router = express.Router();

// Importer les routes
const homeRoutes = require('./home.routes');
const pdfRoutes = require('./pdf.routes');

// Routes publiques
router.use('/home', homeRoutes);
router.use('/pdf', pdfRoutes);

module.exports = router;