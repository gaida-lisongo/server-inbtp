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
}

module.exports = SectionModel;