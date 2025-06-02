const Model = require('./Model');

class AppModel extends Model {
    constructor() {
        super();
    }

    async getProgrammes() {
        const sql = `
            SELECT s.*, m.designation AS 'mention', CONCAT(chef_mention.nom, ' ', chef_mention.post_nom, ' ', chef_mention.prenom) AS 'chef_section'
            FROM section s
            INNER JOIN mention m ON m.id = s.id_mention
            INNER JOIN agent chef_mention ON chef_mention.id = m.id_agent
        `;

        const result = await this.request(sql);
        return result || [];
    }

    async getProgrammeById(id) {
        const sql = `SELECT s.*, m.designation AS 'mention', CONCAT(chef_section.grade, '. ', chef_section.nom, ' ', chef_section.post_nom) AS 'chef_section', chef_section.telephone AS 'chef-phone', chef_section.avatar AS 'chef-photo', CONCAT(sec_section.grade, '. ', sec_section.nom, ' ', sec_section.post_nom) AS 'sec_section', sec_section.telephone AS 'sec-phone', sec_section.avatar AS 'sec-photo', chef_section.e_mail
            FROM section s
            INNER JOIN mention m ON m.id = s.id_mention
            INNER JOIN agent chef_section ON chef_section.id = m.id_agent
            INNER JOIN agent sec_section ON sec_section.id = s.id_sec
            WHERE s.id = ?
        `;
        const result = await this.request(sql, [id]);
        return result || [];
    }

    async getAnnees() {
        const sql = `
            SELECT *
            FROM annee
        `;
        const result = await this.request(sql);
        return result || [];
    }

    async getAnneeById(id) {
        const sql = `
            SELECT *
            FROM annee
            WHERE id = ?
        `;
        const result = await this.request(sql, [id]);
        return result || [];
    }

    async getCurrentAnnee() {
        const sql = `
            SELECT *
            FROM annee
            ORDER BY annee.id DESC
            LIMIT 1
        `;
        const result = await this.request(sql);
        
        return result || null; // Return the first result or null if not found
    }

    async getPromotions() {
        const sql = `SELECT p.*, s.designation AS 'section', n.intitule AS 'niveau', n.systeme
            FROM promotion p
            INNER JOIN section s ON p.id_section = s.id
            INNER JOIN niveau n ON n.id = p.id_niveau
        `;
        const result = await this.request(sql);
        return result || [];
    }

    async getPromotionsByProgramme(idProgramme) {
        const sql = `SELECT p.*, s.designation AS 'section', n.intitule AS 'niveau', n.systeme
            FROM promotion p
            INNER JOIN section s ON p.id_section = s.id
            INNER JOIN niveau n ON n.id = p.id_niveau
            WHERE p.id_section = ?
        `;
        const result = await this.request(sql, [idProgramme]);
        return result || [];
    }

    async getPromotionsById(idPromotion) {
        const sql = `SELECT p.*, s.designation AS 'section', n.intitule AS 'niveau', n.systeme
            FROM promotion p
            INNER JOIN section s ON p.id_section = s.id
            INNER JOIN niveau n ON n.id = p.id_niveau
            WHERE p.id = ?
        `;
        const result = await this.request(sql, [idPromotion]);
        return result || [];
    }

    async getMatieresByPromotion(promotionId) {
        const sql = `SELECT mt.*, ut.designation AS 'unite-titre', ut.code AS 'unite-code'
            FROM matiere mt
            INNER JOIN unite ut ON ut.id = mt.id_unite
            WHERE ut.id_promotion = ?
        `;
        const result = await this.request(sql, [promotionId]);
        return result || [];
        
    }

    async createMessageSection({ nom, email, objet, contenu, sectionId }) {
        const sql = `
            INSERT INTO contacts_sections (auteur_nom, auteur_email, message_objet, message_contenu, sectionId)
            VALUES (?, ?, ?, ?, ?)
        `;
        const result = await this.request(sql, [nom, email, objet, contenu, sectionId]);
        return result || null;
    }
}

module.exports = AppModel;