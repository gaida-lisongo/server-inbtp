const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authJwt');
const { BibliothequeModel } = require('../models');
require('dotenv').config();
const multer = require('multer');
const saveImage = require('../utils/saveImage');
const path = require('path');
const fs = require('fs');
router.use(authenticate);


router.get('/', async (req, res) => {
    try {
        const rows = await BibliothequeModel.getBibliothequeData();
        console.log('Total ouvrages:', rows.length);
        console.log('Ouvrages:', rows);
        return res.status(200).json({ 
            success: true, 
            message: 'Liste des ouvrages de la bibliotheque, par thématique', 
            data: rows 
        });
    } catch (error) {
        console.error('Error fetching bibliotheque:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.get('/ouvrages', async (req, res) => {
    try {
        const rows = await BibliothequeModel.getAllOuvrages();
        return res.status(200).json({ 
            success: true, 
            message: 'Liste des ouvrages de la bibliotheque', 
            data: rows });
    } catch (error) {
        console.error('Error fetching ouvrages:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.get('/ouvrages/theme/:themeId', async (req, res) => {
    try{
        const { themeId } = req.params;
        if (!themeId) {
            return res.status(400).json({ success: false, message: 'Theme ID is required' });
        }

        const id = parseInt(themeId, 10);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: 'Invalid Theme ID' });
        }

        const rows = await BibliothequeModel.getOuvragesByTheme(id);
        return res.status(200).json({ 
            success: true, 
            message: `Liste des ouvrages pour le thème ${id}`, 
            data: rows 
        });

    } catch (error){
        console.error('Error fetching ouvrages by theme:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.get('/documents', async (req, res) => {
    try {
        const rows = await BibliothequeModel.getAllDocuments();
        return res.status(200).json({ 
            success: true, 
            message: 'Liste des types de documents de la bibliotheque', 
            data: rows });
    } catch (error) {
        console.error('Error fetching documents:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});



router.get('/authors', async (req, res) => {
    try {
        const rows = await BibliothequeModel.getAllAuteurs();
        return res.status(200).json({ 
            success: true, 
            message: 'Liste des auteurs de la bibliotheque', 
            data: rows });
    } catch (error) {
        console.error('Error fetching authors:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.get('/themes', async (req, res) => {
    try {
        const rows = await BibliothequeModel.getAllCategories();
        return res.status(200).json({ 
            success: true, 
            message: 'Liste des thématiques de la bibliotheque', 
            data: rows });
    } catch (error) {
        console.error('Error fetching themes:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.get('/reservations/:anneeId', async (req, res) => {
    try {
        const { anneeId } = req.params;
        if (!anneeId) {
            return res.status(400).json({ success: false, message: 'Annee ID is required' });
        }

        const id = parseInt(anneeId, 10);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: 'Invalid Annee ID' });
        }
        const rows = await BibliothequeModel.getReservationsByAnnee(id);
        return res.status(200).json({ 
            success: true, 
            message: 'Liste des réservations par année', 
            data: rows });
    } catch (error) {
        console.error('Error fetching reservations by anneeId:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.get('/reservations', async (req, res) => {
    try {
        const { themeId, anneeId } = req.query;
        if (!themeId || !anneeId) {
            return res.status(400).json({ success: false, message: 'Theme ID and Annee ID are required' });
        }

        const theme = parseInt(themeId, 10);
        const annee = parseInt(anneeId, 10);

        if (isNaN(theme) || isNaN(annee)) {
            return res.status(400).json({ success: false, message: 'Invalid Theme ID or Annee ID' });
        }

        const rows = await BibliothequeModel.getReservationsByThemeAndAnnee(theme, annee);
        return res.status(200).json({
            success: true, 
            message: 'Liste des réservations par thème et année', 
            data: rows });

    } catch (error) {
        console.error('Error fetching all reservations:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.get('/reservations/theme/:theme/:annee', async (req, res) => {
    try {
        const { theme, annee } = req.params;
        if (!theme || !annee) {
            return res.status(400).json({ success: false, message: 'Theme ID and Annee ID are required' });
        }

        const themeId = parseInt(theme, 10);
        const anneeId = parseInt(annee, 10);
        
        if (isNaN(themeId) || isNaN(anneeId)) {
            return res.status(400).json({ success: false, message: 'Invalid Theme ID or Annee ID' });
        }

        const rows = await BibliothequeModel.getReservationByTheme(themeId, anneeId);
        return res.status(200).json({
            success: true,
            message: `Liste des réservations pour le thème ${themeId} et l'année ${anneeId}`,
            data: rows 
        });

    } catch (error) {
        console.error('Error fetching reservations by theme:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.post('/', async (req, res) => {
    try {
        const { 
            titre, 
            id_auteur, 
            id_theme, 
            id_document, 
            description,
            tags,
            annee,
            mois,
            jour,
            lieu_edition,
            qte
        } = req.body;

        if (!titre || !id_auteur || !id_theme || !id_document) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const result = await BibliothequeModel.createOuvrage({
            titre,
            id_auteur,
            id_theme,
            id_document,
            description,
            tags,
            annee,
            mois,
            jour,
            lieu_edition,
            qte
        });

        if (result) {
            return res.status(201).json({ success: true, message: 'Ouvrage added successfully', data: result });
        } else {
            return res.status(500).json({ success: false, message: 'Failed to add ouvrage' });
        }
    } catch (error) {
        console.error('Error adding ouvrage:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.post('/auteur', multer.single('auteurPhoto'), async (req, res) => {
    try {
        // const { nom, post_nom, photo, prenom, description } = req.body;
        const payload = {
            nom: req.body['nom'],
            post_nom: req.body['post_nom'],
            prenom: req.body['prenom'],
            description: req.body['description']
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Photo is required' });
            
        }

        //Convert fille buffet to base 64
        let photo = fs.readFileSync(req.file.buffer);
        const requestData = {...payload, photo};

        if (!requestData.nom || !requestData.post_nom || !requestData.photo || !requestData.prenom || !requestData.description) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const photoUrl = photo ? await saveImage(requestData.photo, 'auteurs') : "https://via.placeholder.com/150"; // Default image if none provided
        const reqData = {...requestData, photoUrl}
        const result = await BibliothequeModel.createAuteur(reqData);

        if (result) {
            return res.status(201).json({ success: true, message: 'Auteur added successfully', data: result });
        } else {
            return res.status(500).json({ success: false, message: 'Failed to add auteur' });
        }
    } catch (error) {
        console.error('Error adding auteur:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.post('/theme', async (req, res) => {
    try {
        const { designation, id_filiere, description } = req.body;

        if (!designation || !id_filiere || !description) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const result = await BibliothequeModel.createTheme({ designation, id_filiere, description });

        if (result) {
            return res.status(201).json({ success: true, message: 'Theme added successfully', data: result });
        } else {
            return res.status(500).json({ success: false, message: 'Failed to add theme' });
        }
    } catch (error) {
        console.error('Error adding theme:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.post('/document', async (req, res) => {
    try {
        const { designation, description } = req.body;

        if (!designation || !description) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const result = await BibliothequeModel.createDocumentType({ designation, description });

        if (result) {
            return res.status(201).json({ success: true, message: 'Document added successfully', data: result });
        } else {
            return res.status(500).json({ success: false, message: 'Failed to add document' });
        }
    } catch (error) {
        console.error('Error adding document:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.put('/ouvrage', async (req, res) => {
    try {
        const { column, val, id } = req.body;
        if (!column || !val || !id) {
            return res.status(400).json({ success: false, message: 'Column, value, and ouvrage ID are required' });
        } 
        const result = await BibliothequeModel.updateOuvrage(column, val, id);
        if (result) {
            return res.status(200).json({ success: true, message: 'Ouvrage updated successfully', data: result });
        }
        return res.status(500).json({ success: false, message: 'Failed to update ouvrage' });

    } catch (error) {
        console.error('Error updating ouvrage:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.put('/auteur', async (req, res) => {
    try {
        const { column, val, id } = req.body;
        if (!column || !val || !id) {
            return res.status(400).json({ success: false, message: 'Column, value, and auteur ID are required' });
        } 
        const result = await BibliothequeModel.updateAuteur(column, val, id);
        if (result) {
            return res.status(200).json({ success: true, message: 'Auteur updated successfully', data: result });
        }
        return res.status(500).json({ success: false, message: 'Failed to update auteur' });

    } catch (error) {
        console.error('Error updating auteur:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.put('/theme', async (req, res) => {
    try {
        const { column, val, id } = req.body;
        if (!column || !val || !id) {
            return res.status(400).json({ success: false, message: 'Column, value, and theme ID are required' });
        } 
        const result = await BibliothequeModel.updateTheme(column, val, id);
        if (result) {
            return res.status(200).json({ success: true, message: 'Theme updated successfully', data: result });
        }
        return res.status(500).json({ success: false, message: 'Failed to update theme' });

    } catch (error) {
        console.error('Error updating theme:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.put('/document', async (req, res) => {
    try {
        const { column, val, id } = req.body;
        if (!column || !val || !id) {
            return res.status(400).json({ success: false, message: 'Column, value, and document ID are required' });
        } 
        const result = await BibliothequeModel.updateDocumentType(column, val, id);
        if (result) {
            return res.status(200).json({ success: true, message: 'Document updated successfully', data: result });
        }
        return res.status(500).json({ success: false, message: 'Failed to update document' });

    } catch (error) {
        console.error('Error updating document:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.put('/reservation', async (req, res) => {
    try {
        const { column, val, id } = req.body;
        if (!column || !val || !id) {
            return res.status(400).json({ success: false, message: 'Column, value, and reservation ID are required' });
        } 
        const result = await BibliothequeModel.updateReservation(column, val, id);
        if (result) {
            return res.status(200).json({ success: true, message: 'Reservation updated successfully', data: result });
        }
        return res.status(500).json({ success: false, message: 'Failed to update reservation' });

    } catch (error) {
        console.error('Error updating reservation:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.delete('/ouvrage/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Ouvrage ID is required' });
        }

        const result = await BibliothequeModel.deleteOuvrage(id);
        if (result) {
            return res.status(200).json({ success: true, message: 'Ouvrage deleted successfully' });
        }
        return res.status(500).json({ success: false, message: 'Failed to delete ouvrage' });

    } catch (error) {
        console.error('Error deleting ouvrage:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.delete('/auteur/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Auteur ID is required' });
        }

        const result = await BibliothequeModel.deleteAuteur(id);
        if (result) {
            return res.status(200).json({ success: true, message: 'Auteur deleted successfully' });
        }
        return res.status(500).json({ success: false, message: 'Failed to delete auteur' });

    } catch (error) {
        console.error('Error deleting auteur:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.delete('/theme/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Theme ID is required' });
        }

        const result = await BibliothequeModel.deleteTheme(id);
        if (result) {
            return res.status(200).json({ success: true, message: 'Theme deleted successfully' });
        }
        return res.status(500).json({ success: false, message: 'Failed to delete theme' });

    } catch (error) {
        console.error('Error deleting theme:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.delete('/document/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Document ID is required' });
        }

        const result = await BibliothequeModel.deleteDocumentType(id);
        if (result) {
            return res.status(200).json({ success: true, message: 'Document deleted successfully' });
        }
        return res.status(500).json({ success: false, message: 'Failed to delete document' });

    } catch (error) {
        console.error('Error deleting document:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.delete('/reservation/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Reservation ID is required' });
        }

        const result = await BibliothequeModel.deleteReservation(id);
        if (result) {
            return res.status(200).json({ success: true, message: 'Reservation deleted successfully' });
        }
        return res.status(500).json({ success: false, message: 'Failed to delete reservation' });

    } catch (error) {
        console.error('Error deleting reservation:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
module.exports = router;