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
        const sql = `
            SELECT s.*, m.designation AS 'mention', CONCAT(chef_mention.nom, ' ', chef_mention.post_nom, ' ', chef_mention.prenom) AS 'chef_section'
            FROM section s
            INNER JOIN mention m ON m.id = s.id_mention
            INNER JOIN agent chef_mention ON chef_mention.id = m.id_agent
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
}

module.exports = AppModel;