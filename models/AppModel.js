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
            ORDER BY annee DESC
            LIMIT 1
        `;
        const result = await this.request(sql);
        return result[0] || null; // Return the first result or null if not found
    }
}

module.exports = AppModel;