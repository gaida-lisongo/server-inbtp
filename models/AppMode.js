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
}

module.exports = AppModel;