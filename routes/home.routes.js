const express = require('express');
const router = express.Router();
const { App } = require('../controllers')

router.get('/welcome', (req, res) => {
    res.send('Welcome to the Home Page');
});

router.get('/', async (req, res) => {
    try {
        const data = await App.programmes();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching programmes', error });
    }
})

router.get('/section/:id', async (req, res) => {
    const sectionId = req.params.id;
    try {
        const data = await App.programme(sectionId);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching section', error });
    }

})

router.get('/annees', async (req, res) => {
    try {
        const data = await App.annees();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching annees', error });
    }
})

router.get('/annee/:id', async (req, res) => {
    const anneeId = req.params.id;
    try {
        const data = await App.annee(anneeId);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching annee', error });
    }
})

router.get('/current-annee', async (req, res) => {
    try {
        const data = await App.currentAnnee();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching current annee', error });
    }
})  

router.get('/promotions', async (req, res) => {
    try {
        const data = await App.promotions();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching promotions', error });
    }
})

router.get('/promotions-section/:id', async (req, res) => {
    const sectionId = req.params.id;
    try {
        const data = await App.promotionsBySection(sectionId);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching promotions by section', error });
    }
})

module.exports = router;