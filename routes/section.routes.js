const express = require('express');
const { route } = require('./home.routes');
const { SectionModel } = require('../models');

const router = express.Router();

/**
 * Ce module permet au chargé de l'enseignement de gérer les activités pédagogiques
 * du département(section) auquel il est rattaché.
 * Pour ce faire, il peut :
 * - Gérer les classes
 * 1. Créer une classe
 * 2. Lister les classes
 * 3. Modifier une classe
 * 4. Supprimer une classe
 * 
 * - Gérer les matières * 1. Créer une unité d'enseignement
 * 2. Lister les unités d'enseignement
 * 3. Modifier une unité d'enseignement
 * 4. Supprimer une unité d'enseignement
 * 5. Créer un élément constitutif
 * 6. Lister les éléments constitutifs
 * 7. Modifier un élément constitutif
 * 8. Supprimer un élément constitutif
 * 
 * - Gérer les Bureaux du Jury
 * 1. Lister les Bureaux du Jury
 * 2. Créer un Bureau du Jury
 * 3. Modifier un Bureau du Jury
 * 4. Supprimer un Bureau du Jury
 * 
 * - Gérer les enseignants
 * 1. Lister les enseignants
 * 2. Créer un enseignant
 * 3. Supprimer un enseignant
 * 4. Affecter un enseignant une charge horaire (élément constitutif)
 * 5. Modifier la charge horaire d'un enseignant
 * 6. Supprimer la charge horaire d'un enseignant
 * 7. Lister les charges horaires d'un enseignant
 * 8. Affecter un enseignant à un bureau du jury
 * 9. Supprimer l'affectation d'un enseignant à un bureau du jury
 * 10. Lister les affectations d'un enseignant à un bureau du jury
 * 
 * - Métriques
 * 1. Nombres de commandes passées par les étudiants pour les travaux pratiques
 * 2. Nombres de commandes passées par les étudiants pour les notes de cours
 * 3. Nombres de commandes passées par les étudiants pour l'enrollement
 * 
 * - Communiquer avec les étudiants
 * 1. Créer une annonce
 * 2. Lister les annonces
 * 3. Modifier une annonce
 * 4. Supprimer une annonce
 * 5. Lister les messages recu depuis le site web de l'institut
 * 6. Répondre à un message reçu depuis le site web de l'institut
        */

router.get('/current/:id_section', async (req, res) => {
    try {
        const { id_section } = req.params;

        if (!id_section) {
            return res.status(400).json({ success: false, message: 'Section ID is required' });
        }
        
        const { rows: sectionData, count } = await SectionModel.getProgrammeById(id_section);
        console.log('Section Data:', sectionData);

        if (!count || count === 0) {
            return res.status(404).json({ success: false, message: 'Section not found' });
        }

        const { rows: enrollementData, count: enrollementCount } = await SectionModel.getEnrollementsByPromotion(id_section);
        console.log('Enrollement Data:', enrollementData);

        res.json({ 
            success: true, 
            message: 'Section retrieved successfully', 
            data: {
                section: sectionData,
                enrollements: enrollementData
            } 
        });
    } catch (error) {
        console.error('Error retrieving section:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
        
    }
});

router.get('/grades', async (req, res) => {
    try {
        const { rows, count } = await SectionModel.getGradesAcademic();
        console.log('Grades Data:', rows);
        if (!count || count === 0) {
            return res.status(404).json({ success: false, message: 'No grades found' });
        }
        res.json({ success: true, message: 'Grades retrieved successfully', data: rows });
    } catch (error) {
        console.error('Error retrieving grades:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.post('/titulaire', async (req, res) => {
    try {
        const payload = {
            nom: req.body['nom'],
            post_nom: req.body['post_nom'],
            prenom: req.body['prenom'],
            sexe: req.body['sexe'],
            date_naiss: req.body['date_naiss'],
            matricule: req.body['matricule'],
            id_grade: req.body['id_grade'],
            grade: req.body['grade'],
            e_mail: req.body['e_mail'],
            telephone: req.body['telephone'],
            addresse: req.body['addresse'],
        }

        console.log('Payload for Titulaire:', payload);
        const result = await SectionModel.createTitulaire(payload);

        if (result) {
            res.json({ success: true, message: 'Titulaire created successfully', data: result });
        } else {
            res.status(400).json({ success: false, message: 'Failed to create titulaire' });
        }
    } catch (error) {
        console.error('Error creating title:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
module.exports = router;