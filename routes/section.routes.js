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

router.get('/messages/:id_section', async (req, res) => {
    try {
        const { id_section } = req.params;

        if (!id_section) {
            return res.status(400).json({ success: false, message: 'Section ID is required' });
        }

        const { rows, count } = await SectionModel.getMessagesBySection(id_section);
        console.log('Messages Data:', rows);

        if (!count || count === 0) {
            return res.status(404).json({ success: false, message: 'No messages found for this section' });
        }

        res.json({ success: true, message: 'Messages retrieved successfully', data: rows });
    } catch (error) {
        console.error('Error retrieving messages:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.get('/logs_titulaire/:id_section', async (req, res) => {
    try {
        const { id_section } = req.params;

        if (!id_section) {
            return res.status(400).json({ success: false, message: 'Section ID is required' });
        }

        const { rows, count } = await SectionModel.getTitulaireBySection(id_section);
        console.log('Titulaire Data:', rows);

        if (!count || count === 0) {
            return res.status(404).json({ success: false, message: 'No titulaire found for this section' });
        }

        res.json({ success: true, message: 'Titulaire retrieved successfully', data: rows });
    } catch (error) {
        console.error('Error retrieving titulaire:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.get('/enrollements/:id_section', async (req, res) => {
    try {
        const { id_section } = req.params;

        if (!id_section) {
            return res.status(400).json({ success: false, message: 'Section ID is required' });
        }

        const { rows, count } = await SectionModel.getEnrollementsBySection(id_section);
        console.log('Enrollements Data:', rows);

        if (!count || count === 0) {
            return res.status(404).json({ success: false, message: 'No enrollements found for this section' });
        }

        res.json({ success: true, message: 'Enrollements retrieved successfully', data: rows });
    } catch (error) {
        console.error('Error retrieving enrollements:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.post('/promotion', async (req, res) => {
    try {
        const payload = {
            id_section: req.body['id_section'],
            id_niveau: req.body['id_niveau'],
            orientation: req.body['orientation'],
            description: req.body['description']
        }

        console.log('Payload for Promotion:', payload);
        const result = await SectionModel.createPromotion(payload);

        if (result) {
            res.json({ success: true, message: 'Promotion created successfully', data: result });
        } else {
            res.status(400).json({ success: false, message: 'Failed to create promotion' });
        }
    } catch (error) {
        console.error('Error creating promotion:', error);
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

router.post('/enrollement', async (req, res) => {
    try {
        const payload = {
            id_promotion: req.body['id_promotion'],
            id_annee: req.body['id_annee'],
            designation: req.body['designation'],
            type: req.body['type'],
            montant: req.body['montant'],
            tranche: req.body['tranche'],
            q_section: req.body['q_section'],
            q_coge: req.body['q_coge'],
            q_jury: req.body['q_jury'],
            date_fin: req.body['date_fin']
        }

        console.log('Payload for Enrollement:', payload);
        const result = await SectionModel.createEnrollement(payload);

        if (result) {
            res.json({ success: true, message: 'Enrollement created successfully', data: result });
        } else {
            res.status(400).json({ success: false, message: 'Failed to create enrollement' });
        }
    } catch (error) {
        console.error('Error creating enrollement:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.post('/examen-session', async (req, res) => {
    try {
        const payload = {
            id_session: req.body['id_session'],
            id_matiere: req.body['id_matiere'],
            date_epreuve: req.body['date_epreuve']
        }

        console.log('Payload for Examen Session:', payload);
        const result = await SectionModel.createExamen(payload);

        if (result) {
            res.json({ success: true, message: 'Examen session created successfully', data: result });
        } else {
            res.status(400).json({ success: false, message: 'Failed to create examen session' });
        }
    } catch (error) {
        console.error('Error creating examen session:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.post('/communique', async (req, res) => {
    try {
        const payload = {
            id_section: req.body['id_section'],
            titre: req.body['titre'],
            contenu: req.body['contenu'],
            service: req.body['service'] || 'section' // Default to 'section' if not provided
        }

        console.log('Payload for Communication:', payload);
        const result = await SectionModel.createCommunication(payload);

        if (result) {
            res.json({ success: true, message: 'Communication created successfully', data: result });
        } else {
            res.status(400).json({ success: false, message: 'Failed to create communication' });
        }
    } catch (error) {
        console.error('Error creating communication:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;