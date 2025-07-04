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

    async getTitulaireBySection(idSection) {
        const sql = `SELECT 
                        connected,
                        COUNT(*) AS total_titulaires
                        FROM (
                    SELECT 
                        agent.id,
                        EXISTS (
                        SELECT 1
                        FROM logs_titulaire logs
                        WHERE logs.id_section = ? AND logs.id_agent = agent.id
                        ) AS connected
                    FROM agent
                    INNER JOIN grade ON grade.id = agent.id_grade
                    WHERE grade.id_personnel = 1
                    ) AS sub
                    GROUP BY connected`
        const result = await this.request(sql, [idSection]);
        return result || [];
    }

    async getEnrollementsBySection(idSection, id_annee) {
        const sql = `SELECT *
                    FROM enrollements e
                    INNER JOIN promotion p ON p.id = e.id_promotion
                    WHERE p.id_section = ? AND e.id_annee = ?
                    ORDER BY e.date_fin DESC`;
        const result = await this.request(sql, [idSection, id_annee]);    
        return result || [];
    }    

    async getChargesByPromotion(id_promotion, id_annee) {
        const sql = `SELECT 
                        m.id AS id_matiere,
                        m.designation AS matiere,
                        m.credit,
                        m.semestre,
                        u.designation AS unite,
                        u.id_promotion AS promotion,
                        ch.id AS id_charge,
                        ch.id_titulaire,
                        ch.horaire,
                        agent.avatar,
                        agent.matricule,
                        agent.nom,
                        agent.post_nom,
                        agent.sexe,
                        grade.designation AS titre_acad,
                        CASE 
                            WHEN ch.id IS NULL THEN 'NO'
                            ELSE 'OK'
                        END AS statut_charge,

                        CASE 
                            WHEN ch.id_titulaire IS NOT NULL THEN (
                            SELECT COUNT(*)
                            FROM charge_horaire ch2
                            WHERE ch2.id_titulaire = ch.id_titulaire
                                AND ch2.id_annee = ?
                            )
                            ELSE 0
                        END AS nb_affectations,

                        CASE 
                            WHEN ch.id_titulaire IS NOT NULL THEN (
                            SELECT SUM(m2.credit)
                            FROM charge_horaire ch2
                            INNER JOIN matiere m2 ON m2.id = ch2.id_matiere
                            WHERE ch2.id_titulaire = ch.id_titulaire
                                AND ch2.id_annee = ?
                            )
                            ELSE 0
                        END AS total_credits,
                        CASE 
                            WHEN ch.id_titulaire IS NOT NULL THEN (
                            SELECT CONCAT(SUM(m2.credit) * 17, ' h')
                            FROM charge_horaire ch2
                            INNER JOIN matiere m2 ON m2.id = ch2.id_matiere
                            WHERE ch2.id_titulaire = ch.id_titulaire
                                AND ch2.id_annee = ?
                            )
                            ELSE '0 h'
                        END AS volume_charge

                        FROM promotion p
                        INNER JOIN unite u ON u.id_promotion = p.id
                        INNER JOIN matiere m ON m.id_unite = u.id
                        LEFT JOIN charge_horaire ch ON ch.id_matiere = m.id AND ch.id_annee = ?
                        LEFT JOIN agent ON agent.id = ch.id_titulaire
                        LEFT JOIN grade ON agent.id_grade = grade.id
                        WHERE p.id = ?;
                        `
        const params = [id_annee, id_annee, id_annee, id_annee, id_promotion];
        const result = await this.request(sql, params);
        return result || [];
    }

    async getUnitesByPromotion(id_promotion) {
        const sql = `SELECT 
                        unite.*, 
                        SUM(m.credit) AS total_credit, 
                        COUNT(m.id) AS total_ecue, 
                        CASE
                            WHEN unite.id_responsable IS NOT NULL THEN (
                                SELECT CONCAT(grade.designation, ' ', agent.nom, ' ', agent.post_nom, ' - ', agent.matricule)
                                FROM agent
                                INNER JOIN grade ON grade.id = agent.id_grade
                                WHERE agent.id = unite.id_responsable
                            ) ELSE 'Sans Responsable'
                        END AS responsable
                    FROM unite
                    LEFT JOIN matiere m ON m.id_unite = unite.id
                    WHERE unite.id_promotion = ?
                    GROUP BY unite.id`;
        const result = await this.request(sql, [id_promotion]);
        return result || [];
    }

    async getJuryByPromotion(payload){
        const sql = `SELECT j.*, pj.id AS promotion_juryId
            FROM jury j
            INNER JOIN promotion_jury pj ON pj.id_jury = j.id
            WHERE pj.id_annee = ? AND pj.id_promotion = ?`;

        const result = await this.request(sql, [payload.id_annee, payload.id_promotion]);
        return result || [];
    }

    async getInsertionByPromotion({id_promotion, id_annee}) {
        const sql = `SELECT *, CONCAT(grade.designation, ' ', agent.nom, ' ', agent.post_nom, ' (', agent.matricule, ')') AS 'auteur_nom', agent.telephone, agent.e_mail, agent.avatar,
                        CONCAT(e.nom, ' ', e.post_nom, ' (', e.matricule, ')') AS 'etudiant_nom', e.sexe, f.id_etudiant, f.id_matiere, f.tp, f.td, f.examen, f.rattrapage, f.updated_by, f.updated_at, f.created_at, f.created_by, m.designation AS 'matiere', m.credit, m.semestre
                    FROM insertion
                    INNER JOIN agent ON agent.id = insertion.id_agent
                    INNER JOIN grade ON grade.id = agent.id_grade
                    INNER JOIN fiche_cotation f ON f.id = insertion.id_fiche_cotation
                    INNER JOIN matiere m ON m.id = f.id_matiere
                    INNER JOIN unite u ON u.id = m.id_unite
                    INNER JOIN etudiant e ON e.id = f.id_etudiant 
                    WHERE u.id_promotion = ? AND f.id_annee = ?`;
        const result = await this.request(sql, [id_promotion, id_annee]);
        return result || [];
    }

    async findTitulaireByRechearch(searchTerm, id_annee) {
        // Le problème est ici - la syntaxe pour les paramètres est incorrecte
        // Vous utilisez '%?%' au lieu d'utiliser la concaténation ou des espaces réservés MySQL
        
        // Version corrigée:
        const searchPattern = `%${searchTerm.toUpperCase()}%`;
        
        const sql = `
            SELECT a.*, 
                CASE 
                    WHEN ch.id_titulaire IS NOT NULL THEN (
                        SELECT CONCAT(CAST(SUM(m2.credit) * 17 AS CHAR), ' h')
                        FROM charge_horaire ch2
                        INNER JOIN matiere m2 ON m2.id = ch2.id_matiere
                        WHERE ch2.id_titulaire = ch.id_titulaire
                        AND ch2.id_annee = ?
                    )
                    ELSE '0 h'
                END AS volume_charge,
                CASE 
                    WHEN ch.id_titulaire IS NOT NULL THEN (
                    SELECT SUM(m2.credit)
                    FROM charge_horaire ch2
                    INNER JOIN matiere m2 ON m2.id = ch2.id_matiere
                    WHERE ch2.id_titulaire = ch.id_titulaire
                        AND ch2.id_annee = ?
                    )
                    ELSE 0
                END AS total_credits,
                CASE 
                    WHEN ch.id_titulaire IS NOT NULL THEN (
                    SELECT COUNT(*)
                    FROM charge_horaire ch2
                    WHERE ch2.id_titulaire = ch.id_titulaire
                        AND ch2.id_annee = ?
                    )
                    ELSE 0
                END AS nb_affectations,
                g.designation AS titre_acad
            FROM agent a
            INNER JOIN grade g ON g.id = a.id_grade
            LEFT JOIN charge_horaire ch ON ch.id_titulaire = a.id
            WHERE a.nom LIKE ? OR a.post_nom LIKE ? OR a.matricule LIKE ?
            GROUP BY a.id  -- Ajout d'un GROUP BY pour éviter les doublons
            `;
        const params = [id_annee, id_annee, id_annee , searchPattern, searchPattern, searchPattern];
        const result = await this.request(sql, params);
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

    async createChargeHoraire(chargeData) {

        // Vérification des données
        console.log('Données de charge horaire:', chargeData);
        const sql = `INSERT INTO charge_horaire (id_matiere, id_titulaire, id_annee, semestre, horaire)
            VALUES (?, ?, ?, ?, ?)`;
        const params = [
            chargeData.id_matiere,
            chargeData.id_titulaire,
            chargeData.id_annee,
            chargeData.semestre,
            chargeData.horaire
        ];
        const result = await this.request(sql, params);
        return result;
    }

    async createUnite(uniteData){
        const sql = `
            INSERT INTO unite(
                code,
                type,
                designation,
                competences,
                objectifs,
                id_promotion,
                id_responsable
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            uniteData.code,
            uniteData.type,
            uniteData.designation,
            uniteData.competences,
            uniteData.objectifs,
            uniteData.id_promotion,
            uniteData.id_responsable
        ];

        const result = await this.request(sql, params);

        return result || []
    }

    async createMatiere(matiereData){
        const sql = `
            INSERT INTO matiere(
                designation,
                code,
                credit,
                id_unite,
                semestre
            ) VALUES (?, ?, ?, ?, ?)
        `;

        const params = [
            matiereData.designation,
            matiereData.code,
            matiereData.credit,
            matiereData.id_unite,
            matiereData.semestre
        ];

        const result = await this.request(sql, params);
        return result || [];
    }

    async createJury(juryData){
        const sql = `
            INSERT INTO jury(
                id_section, 
                designation, 
                code, 
                id_president, 
                id_secretaire, 
                id_membre
            ) VALUES (?, ?, ?, ?, ?, ?)
        `;
        const params = [
            juryData.id_section,
            juryData.designation,
            juryData.code,
            juryData.id_president,
            juryData.id_secretaire,
            juryData.id_membre
        ];
        const result = await this.request(sql, params);
        return result || [];
    }

    async updateJury(col, value, id) {
        const sql = `UPDATE jury SET ${col} = ? WHERE id = ?`;
        const params = [value, id];
        const result = await this.request(sql, params);
        return result;
    }

    async deleteJury(id) {
        const sql = `DELETE FROM jury WHERE id = ?`;
        const params = [id];
        const result = await this.request(sql, params);
        return result;
    }

    async createPromotionJury({id_promotion, id_annee, id_jury}) {
        const sql = `INSERT INTO promotion_jury (id_promotion, id_annee, id_jury)
            VALUES (?, ?, ?)`;
        const params = [id_promotion, id_annee, id_jury];
        const result = await this.request(sql, params);
        return result || [];
    }

    async updateChargeHoraire(col, value, id) {
        const sql = `UPDATE charge_horaire SET ${col} = ? WHERE id = ?`;
        const params = [value, id];
        const result = await this.request(sql, params);
        return result;
    }

    async deleteChargeHoraire(id) {
        const sql = `DELETE FROM charge_horaire WHERE id = ?`;
        const params = [id];
        const result = await this.request(sql, params);
        return result;
    }

    async updateUnite(col, value, id) {
        const sql = `UPDATE unite SET ${col} = ? WHERE id = ?`;
        const params = [value, id];
        const result = await this.request(sql, params);
        return result;
    }

    async deleteUnite(id) {
        const sql = `DELETE FROM unite WHERE id = ?`;
        const params = [id];
        const result = await this.request(sql, params);
        return result;
    }

    async updateMatiere(col, value, id) {
        const sql = `UPDATE matiere SET ${col} = ? WHERE id = ?`;
        const params = [value, id];
        const result = await this.request(sql, params);
        return result;
    }



    async deleteMatiere(id) {
        const sql = `DELETE FROM matiere WHERE id = ?`;
        const params = [id];
        const result = await this.request(sql, params);
        return result;
    }
}

module.exports = SectionModel;