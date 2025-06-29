const express = require('express');
const router = express.Router();

// Importer les routes
const homeRoutes = require('./home.routes');
const pdfRoutes = require('./pdf.routes');
const userRoutes = require('./user.routes');
const agentRoutes = require('./agent.routes');
const bibliothequeRoutes = require('./bibliotheque.routes');
const sectionRoutes = require('./section.routes');

// Routes publiques
router.use('/home', homeRoutes);
router.use('/pdf', pdfRoutes);
router.use('/etudiant', userRoutes);
router.use('/agent', agentRoutes);
router.use('/bibliotheque', bibliothequeRoutes);
router.use('/section', sectionRoutes);

module.exports = router;