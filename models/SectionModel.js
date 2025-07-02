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

    async createTitulaire(titulaireData) {
        const sql = `INSERT INTO titulaire (nom, post_nom, prenom, sexe, date_naiss, matricule, id_grade, grade, e_mail, telephone, addresse)
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
}

module.exports = SectionModel;