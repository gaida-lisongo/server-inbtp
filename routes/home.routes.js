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

router.get('/promotion/:id', async (req, res) => {
    const promotionId = req.params.id;
    try {
        const data = await App.promotion(promotionId);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching promotion', error });
    }
})

router.post('/checkResultat', async (req, res) => {
    const { annee, matricule, promotionId, type } = req.body;
    console.log("Request data : " + JSON.stringify(req.body));
    try {
        const payload = {
            anneeId: annee,
            matricule,
            promotionId,
            type
        }
        const data = await App.getNotesEtudiant(payload);
        console.log('Data:', data);
        // res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Error checking result', error });
    }

})


router.post('/message-section', async (req, res) => {
    const { nom, email, objet, contenu, sectionId } = req.body;
    try {
        const data = await App.addMessageSection({ nom, email, objet, contenu, sectionId });
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Error adding message to section', error });
    }
})

module.exports = router;