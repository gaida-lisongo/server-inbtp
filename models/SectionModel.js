const AgentModel = require('./AgentModel');

class SectionModel extends AgentModel {
    constructor() {
        super();
    }
    
    async getEnrollementsByPromotion(idProgramme) {
        const sql = `SELECT er.*, CONCAT(n.intitule, ' ', s.sigle) AS 'classe', p.orientation, p.description AS 'promo_des', n.systeme
            FROM enrollements er
            INNER JOIN promotion p ON p.id = er.id_promotion
            INNER JOIN niveau n ON n.id = p.id_niveau
            INNER JOIN section s ON s.id = p.id_section
            WHERE p.id_section = ?
        `;
        const result = await this.request(sql, [idProgramme]);
        return result || [];
    }

    async getGradesAcademic() {
        const sql = `SELECT * FROM grade `;
        const result = await this.request(sql, []);
        return result || [];
    }

    async getMessagesBySection(idSection) {
        const sql = `SELECT * FROM contacts_sections WHERE sectionId = ? ORDER BY date_creation DESC`;
        const result = await this.request(sql, [idSection]);
        return result || [];
    }

    async createTitulaire(titulaireData) {
        const sql = `INSERT INTO agent (nom, post_nom, prenom, sexe, date_naiss, matricule, id_grade, grade, e_mail, telephone, adresse)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const params = [
            titulaireData.nom,
            titulaireData.post_nom,
            titulaireData.prenom,
            titulaireData.sexe,
            titulaireData.date_naiss,
            titulaireData.matricule,
            titulaireData.id_grade,
            titulaireData.grade,
            titulaireData.e_mail,
            titulaireData.telephone,
            titulaireData.addresse
        ];
        const result = await this.request(sql, params);
        return result;
    }

    async createPromotion(promotionData) {
        const sql = `INSERT INTO promotion (id_section, id_niveau, orientation, description)
            VALUES (?, ?, ?, ?)`;
        const params = [
            promotionData.id_section,
            promotionData.id_niveau,
            promotionData.orientation,
            promotionData.description
        ];
        const result = await this.request(sql, params);
        return result;
    }

    async createEnrollement(enrollementData) {
        const sql = `INSERT INTO enrollements (id_promotion, id_annee, date_fin, q_jury, q_section, q_coge, tranche, montant, type, designation)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const params = [
            enrollementData.id_promotion,
            enrollementData.id_annee,
            enrollementData.date_fin,
            enrollementData.q_jury,
            enrollementData.q_section,
            enrollementData.q_coge,
            enrollementData.tranche,
            enrollementData.montant,
            enrollementData.type,
            enrollementData.designation
        ];
        const result = await this.request(sql, params);
        return result;
    }

    async createExamen(examenData) {
        const sql = `INSERT INTO examen_matiere (id_session, id_matiere, date_epreuve)
            VALUES (?, ?, ?)`;
        const params = [
            examenData.id_session,
            examenData.id_matiere,
            examenData.date_epreuve
        ];
        const result = await this.request(sql, params);
        return result;

    }
    
    async createCommunication(communicationData) {
        const sql = `INSERT INTO communique (
            id_auteur, 
            titre, 
            contenu, 
            date_created, 
            service
            ) VALUES (?, ?, ?, NOW(), ?)`;
        const params = [
            communicationData.id_section,
            communicationData.titre,
            communicationData.contenu,
            communicationData.service
        ];
        const result = await this.request(sql, params);
        return result;
    }
}

module.exports = SectionModel;