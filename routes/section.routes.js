const express = require('express');
const { route } = require('./home.routes');
const { SectionModel } = require('../models');
const excelJs = require('exceljs');

const router = express.Router();

async function categorieEtudiant(data, categore){
    try {
        let critere = 0;

        switch (categore) {
            case 'mineur':
                critere = 18
            case 'adolescent':
                critere = 25;
                break;
            case 'adulte':
                critere = 40;
                break;
            default:
                critere = 65;
                break;
        }

        const etudiants = [];

        data.forEach(etudiant => {
            //etudiant.date_naiss est un varchar de la forme YYYY-MM-DD
            const dateNaissance = new Date(etudiant.date_naiss);
            const age = new Date().getFullYear() - dateNaissance.getFullYear();

            if (age <= critere) {
                etudiants.push(etudiant);
            }
        });
        
        //Tri des étudiants par date de naissance
        etudiants.sort((a, b) => new Date(a.date_naiss) - new Date(b.date_naiss));
        return etudiants;

    } catch (error) {
        console.error('Error categorizing students:', error);
        throw new Error('Failed to categorize students');
    }
}

router.get('/liste_declarative/:id_promotion/:id_annee', async (req, res) => {
    try {
        const { id_promotion, id_annee } = req.params;

        if (!id_promotion || !id_annee) {
            return res.status(400).json({ success: false, message: 'Promotion ID and Year ID are required' });
        }

        const {rows, count} = await SectionModel.getEtudiantBypromotion(id_promotion, id_annee);
        console.log('Students Data:', rows);
        res.json({ success: true, message: 'Students retrieved successfully', data: etudiants });
    } catch (error) {
        console.error('Error retrieving students:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.get('/current/:id_section', async (req, res) => {
    try {
        const { id_section } = req.params;

        if (!id_section) {
            return res.status(400).json({ success: false, message: 'Section ID is required' });
        }
        
        const { rows: sectionData, count } = await SectionModel.getProgrammeById(id_section);

        if (!count || count === 0) {
            return res.status(404).json({ success: false, message: 'Section not found' });
        }

        const { rows: enrollementData, count: enrollementCount } = await SectionModel.getEnrollementsByPromotion(id_section);
      
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

router.get('/enrollements/:id_section/:id_annee', async (req, res) => {
    try {
        const { id_section, id_annee } = req.params;

        if (!id_section) {
            return res.status(400).json({ success: false, message: 'Section ID is required' });
        }

        if (!id_annee) {
            return res.status(400).json({ success: false, message: 'Academic year ID is required' });
        }

        const { rows, count } = await SectionModel.getEnrollementsBySection(id_section, id_annee);
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

router.get('/promotion_enrollements/:id_promotion/:id_annee', async (req, res) => {
    try {
        const { id_promotion, id_annee } = req.params;

        if (!id_promotion) {
            return res.status(400).json({ success: false, message: 'Promotion ID is required' });
        }

        if (!id_annee) {
            return res.status(400).json({ success: false, message: 'Academic year ID is required' });
        }

        const { rows, count } = await SectionModel.getEnrollementsByPromotionAnnee(id_promotion, id_annee);
        console.log('Enrollements Data:', rows);

        if (!count || count === 0) {
            return res.status(404).json({ success: false, message: 'No enrollements found for this promotion' });
        }

        res.json({ success: true, message: 'Enrollements retrieved successfully', data: rows });
    } catch (error) {
        console.error('Error retrieving enrollements:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}); 

router.get('/cmd_enrollement/:id_enrollement', async(req, res) => {
    try {
        const { id_enrollement } = req.params;

        if (!id_enrollement) {
            return res.status(400).json({ success: false, message: 'Enrollement ID is required' });
        }

        const { rows, count } = await SectionModel.getCmdEnrollementsById(id_enrollement);
        console.log('Commandes Data:', rows);

        if (!count || count === 0) {
            return res.status(404).json({ success: false, message: 'No commandes found for this enrollement' });
        }

        res.json({ success: true, message: 'Commandes retrieved successfully', data: rows });
    } catch (error) {
        console.error('Error retrieving commandes:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.get('/charges-horaire/:id_promotion/:id_annee', async (req, res) => {
    try {
        const { id_promotion, id_annee } = req.params;

        if (!id_promotion) {
            return res.status(400).json({ success: false, message: 'Promotion ID is required' });
        }

        if (!id_annee) {
            return res.status(400).json({ success: false, message: 'Academic year ID is required' });
        }

        const { rows, count } = await SectionModel.getChargesByPromotion(id_promotion, id_annee);

        if (!count || count === 0) {
            return res.status(404).json({ success: false, message: 'No charges horaire found for this promotion' });
        }

        res.json({ success: true, message: 'Charges horaire retrieved successfully', data: rows });
    } catch (error) {
        console.error('Error retrieving charges horaire:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.get('/unites/:id_promotion', async (req, res) => {
    try {
        const id_promotion = req.params.id_promotion;

        if (!id_promotion) {
            return res.status(400).json({ success: false, message: 'Promotion ID is required' });
        }

        const { rows, count } = await SectionModel.getUnitesByPromotion(id_promotion);
        console.log('Unites Data:', rows);

        if (!count || count === 0) {
            return res.status(404).json({ success: false, message: 'No units found for this promotion' });
        }

        const unitesPromises = rows.map(async unite => {
            const { rows : matieresData } = await SectionModel.getMatieresByUE(unite.id)

            return {
                ...unite,
                ecue: matieresData
            }
        })

        // Attendre que toutes les promesses soient résolues
        const unitesWithECUE = await Promise.all(unitesPromises);

        // Vérifier que les données sont correctes
        console.log('Unites with ECUE:', JSON.stringify(unitesWithECUE.slice(0, 1), null, 2)); // Log du premier élément pour vérification
        res.json({ success: true, message: 'Units retrieved successfully', data: unitesWithECUE });
    } catch (error) {
        console.error('Error retrieving units:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
})

router.get('/jury/:id_promotion/:id_annee', async (req, res) => {
    try {
        const { id_promotion, id_annee } = req.params;
        if (!id_promotion) {
            return res.status(400).json({ success: false, message: 'Promotion ID is required' });
        }
        if (!id_annee) {
            return res.status(400).json({ success: false, message: 'Academic year ID is required' });
        }
        const { rows, count } = await SectionModel.getJuryByPromotion({id_promotion, id_annee});
        console.log('Jury Data:', rows);

        if (!count || count === 0) {
            return res.status(404).json({ success: false, message: 'No jury found for this promotion' });
        }
        res.json({ success: true, message: 'Jury retrieved successfully', data: rows });
    } catch (error) {
        console.error('Error retrieving jury:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.get('/deliberations/:id_promotion/:id_annee', async (req, res) => {
    try {
        const { id_promotion, id_annee } = req.params;
        if (!id_promotion) {
            return res.status(400).json({ success: false, message: 'Promotion ID is required' });
        }
        if (!id_annee) {
            return res.status(400).json({ success: false, message: 'Academic year ID is required' });
        }

        const { rows, count } = await SectionModel.getInsertionByPromotion({id_promotion, id_annee});

        console.log('Délibération Data:', rows);
        if (!count || count === 0) {
            return res.status(404).json({ success: false, message: 'No délibérations found for this promotion' });
        }

        res.json({ success: true, message: 'Délibérations retrieved successfully', data: rows });
    } catch (error) {
        console.error('Error retrieving délibérations:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.post('/create-jury', async (req, res) => {
    try {
        const payload = {
            id_section: req.body['id_section'],
            designation: req.body['designation'],
            code: req.body['code'],
            id_president: req.body['id_president'],
            id_secretaire: req.body['id_secretaire'],
            id_membre: req.body['id_membre'], // Optional field
            id_promotion: req.body['id_promotion'],
            id_annee: req.body['id_annee'],
            autorisation: false // Optional field, default to false
        }

        console.log('Payload for Jury:', payload);
        const {rows, count, lastInsertedId} = await SectionModel.createJury(payload);

        if (lastInsertedId) {
            const { lastInsertedId: promotion_juryId } = await SectionModel.createPromotionJury({
                id_promotion: payload.id_promotion,
                id_annee: payload.id_annee,
                id_jury: lastInsertedId
            });

            console.log('Promotion Jury ID:', promotion_juryId);
            if (!promotion_juryId) {
                return res.status(400).json({ success: false, message: 'Failed to link jury to promotion' });
            }

            return res.json({
                success: true,
                message: 'Jury created successfully',
                data: {
                    id: lastInsertedId,
                    promotion_juryId,
                }
            });
        }
        res.status(400).json({ success: false, message: 'Failed to create jury' });
    } catch (error) {
        console.error('Error creating jury:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.post('/find-titulaire', async (req, res) => {
    try {
        const searchTerm = req.body.search || '';
        const id_annee = req.body.annee

        if(!id_annee){
            return res.status(400).json({ success: false, message: 'Academic year ID is required' });
        }
        
        const { rows, count } = await SectionModel.findTitulaireByRechearch(searchTerm, id_annee);

        if (!count || count === 0) {
            return res.status(404).json({ success: false, message: 'No titulaire found matching the search term' });
        }

        res.json({ success: true, message: 'Titulaire search results', data: rows });
    } catch (error) {
        console.error('Error searching titulaire:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.post('/createChargeHoraire', async (req, res) => {
    try {
        const payload = {
            id_matiere: req.body['id_matiere'],
            id_titulaire: req.body['id_titulaire'],
            id_annee: req.body['id_annee'],
            semestre: req.body['semestre'],
            horaire: req.body['horaire']
        }

        console.log('Payload for Charge Horaire:', payload);
        const result = await SectionModel.createChargeHoraire(payload);

        if (result) {
            res.json({ success: true, message: 'Charge horaire created successfully', data: result });
        } else {
            res.status(400).json({ success: false, message: 'Failed to create charge horaire' });
        }
    } catch (error) {
        console.error('Error creating charge horaire:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.post('/unite', async (req, res) => {
    try {
        const payload = {
            code: req.body['code'],
            designation: req.body['designation'],
            type: req.body['type'],
            competences: req.body['competences'],
            objectifs: req.body['objectifs'],
            id_responsable: req.body['id_responsable'],
            id_promotion: req.body['id_promotion']
        }

        console.log('Payload for Unite:', payload);
        const result = await SectionModel.createUnite(payload);
        
        if (result) {
            res.json({ success: true, message: 'Unité created successfully', data: result });
        } else {
            res.status(400).json({ success: false, message: 'Failed to create unité' });
        }
    } catch (error) {
        console.error('Error creating unité:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.post('/matiere', async (req, res) => {
    try {
        const payload = {
            id_unite: req.body['id_unite'],
            code: req.body['code'],
            designation: req.body['designation'],
            credit: req.body['credit'],
            semestre: req.body['semestre']
        }

        console.log('Payload for Matiere:', payload);
        const result = await SectionModel.createMatiere(payload);

        if (result) {
            res.json({ success: true, message: 'Matière created successfully', data: result });
        } else {
            res.status(400).json({ success: false, message: 'Failed to create matière' });
        }
    } catch (error) {
        console.error('Error creating matière:', error);
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
            q_app: req.body['q_app'], // Optional field
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

router.put('/chargeHoraire/:id_charge', async (req, res) => {
    try {
        const { id_charge } = req.params;
        const payload = {
            col: req.body['col'],
            value: req.body['value']
        }

        console.log('Payload for Update Charge Horaire:', payload);
        const result = await SectionModel.updateChargeHoraire(payload.col, payload.value, id_charge);

        if (result) {
            res.json({ success: true, message: 'Charge horaire updated successfully', data: result });
        } else {
            res.status(400).json({ success: false, message: 'Failed to update charge horaire' });
        }
    } catch (error) {
        console.error('Error updating charge horaire:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.delete('/chargeHoraire/:id_charge', async (req, res) => {
    try {
        const { id_charge } = req.params;

        if (!id_charge) {
            return res.status(400).json({ success: false, message: 'Charge ID is required' });
        }

        const result = await SectionModel.deleteChargeHoraire(id_charge);

        if (result) {
            res.json({ success: true, message: 'Charge horaire deleted successfully' });
        } else {
            res.status(400).json({ success: false, message: 'Failed to delete charge horaire' });
        }
    } catch (error) {
        console.error('Error deleting charge horaire:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.put('/unite/:id_unite', async (req, res) => {
    try {
        const { id_unite } = req.params;
        const payload = {
            col: req.body['col'],
            value: req.body['value']
        }

        console.log('Payload for Update Unité:', payload);
        const result = await SectionModel.updateUnite(payload.col, payload.value, id_unite);

        if (result) {
            res.json({ success: true, message: 'Unité updated successfully', data: result });
        } else {
            res.status(400).json({ success: false, message: 'Failed to update Unité' });
        }
    } catch (error) {
        console.error('Error updating charge horaire:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.delete('/unite/:id_unite', async (req, res) => {
    try {
        const { id_unite } = req.params;
        const result = await SectionModel.deleteUnite(id_unite);

        if (result) {
            res.json({ success: true, message: 'Unité deleted successfully' });
        } else {
            res.status(400).json({ success: false, message: 'Failed to delete Unité' });
        }
    } catch (error) {
        console.error('Error deleting Unité:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.put('/matiere/:id_matiere', async (req, res) => {
    try {
        const { id_matiere } = req.params;
        const payload = {
            col: req.body['col'],
            value: req.body['value']
        }

        console.log('Payload for Update Matière:', payload);
        const result = await SectionModel.updateMatiere(payload.col, payload.value, id_matiere);

        if (result) {
            res.json({ success: true, message: 'Matière updated successfully', data: result });
        } else {
            res.status(400).json({ success: false, message: 'Failed to update Matière' });
        }
    } catch (error) {
        console.error('Error updating matière:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.delete('/matiere/:id_matiere', async (req, res) => {
    try {
        const { id_matiere } = req.params;
        const result = await SectionModel.deleteMatiere(id_matiere);

        if (result) {
            res.json({ success: true, message: 'Matière deleted successfully' });
        } else {
            res.status(400).json({ success: false, message: 'Failed to delete Matière' });
        }
    } catch (error) {
        console.error('Error deleting Matière:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.put('/jury/:id_jury', async (req, res) => {
    try {
        const { id_jury } = req.params;
        const payload = {
            col: req.body['col'],
            value: req.body['value']
        }

        console.log('Payload for Update Jury:', payload);
        const result = await SectionModel.updateJury(payload.col, payload.value, id_jury);

        if (result) {
            res.json({ success: true, message: 'Jury updated successfully', data: result });
        } else {
            res.status(400).json({ success: false, message: 'Failed to update jury' });
        }
    } catch (error) {
        console.error('Error updating jury:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.delete('/jury/:id_jury', async (req, res) => {
    try {
        const { id_jury } = req.params;

        if (!id_jury) {
            return res.status(400).json({ success: false, message: 'Jury ID is required' });
        }

        const result = await SectionModel.deleteJury(id_jury);

        if (result) {
            res.json({ success: true, message: 'Jury deleted successfully' });
        } else {
            res.status(400).json({ success: false, message: 'Failed to delete jury' });
        }
    } catch (error) {
        console.error('Error deleting jury:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});



module.exports = router;