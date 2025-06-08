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

    async getProgrammeByName(name) {
        const sql = `SELECT s.*, m.designation AS 'mention', CONCAT(chef_section.grade, '. ', chef_section.nom, ' ', chef_section.post_nom) AS 'chef_section', chef_section.telephone AS 'chef-phone', chef_section.avatar AS 'chef-photo', CONCAT(sec_section.grade, '. ', sec_section.nom, ' ', sec_section.post_nom) AS 'sec_section', sec_section.telephone AS 'sec-phone', sec_section.avatar AS 'sec-photo', chef_section.e_mail
            FROM section s
            INNER JOIN mention m ON m.id = s.id_mention
            INNER JOIN agent chef_section ON chef_section.id = m.id_agent
            INNER JOIN agent sec_section ON sec_section.id = s.id_sec
            WHERE s.designation = ?
        `;
        const result = await this.request(sql, [name]);
        return result || [];
    }

    async getNiveauByName({name}) {
        const sql = `SELECT *
            FROM niveau
            WHERE intitule = ?
        `;
        const result = await this.request(sql, [name]);
        return result || null;
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

    async getPromotionById(idPromotion) {
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

    async getEtudiants(){
        const sql = `SELECT *
            FROM etudiant
        `;
        const result = await this.request(sql);
        return result || [];
    }

    async getNiveaux(){
        const sql = `SELECT *
            FROM niveau
            ORDER BY intitule
        `;
        const result = await this.request(sql);
        return result || [];
    }

    async getEtudiantById(etudiantId) {
        const sql = `SELECT *
            FROM etudiant
            WHERE id = ?
        `;
        const result = await this.request(sql, [etudiantId]);
        return result || null;
    }

    async getEtudiantByMatricule(matricule) {
        const sql = `SELECT *
            FROM etudiant
            WHERE matricule = ?
        `;
        const result = await this.request(sql, [matricule]);
        return result || null;
    }

    async getCotesEtudiant({etudiantId, matiereId, anneeId}) {
        const sql = `SELECT *
            FROM fiche_cotation
            WHERE id_etudiant = ? AND id_matiere = ? AND id_annee = ?
        `;
        const result = await this.request(sql, [etudiantId, matiereId, anneeId]);
        return result || null;
    }

    async getCommandeEtudiant({etudiantId, anneeId, promotionId}) {
        const sql = `SELECT er.*, cmde.id_enrollement, cmde.id_etudiant, cmde.montant, cmde.statut, cmde.reference AS 'payment_enrol', cmde.orderNumber AS 'payment_carnet', cmde.montant AS 'payment_frais', cmde.date_created AS 'date_payment'
                    FROM enrollements er
                    INNER JOIN commande_enrollement cmde ON cmde.id_enrollement = er.id
                    WHERE er.id_promotion = ? AND er.id_annee = ? AND cmde.id_etudiant = ?
                `;
        const result = await this.request(sql, [promotionId, anneeId, etudiantId]);
        return result || null;
    }

    async createMessageSection({ nom, email, objet, contenu, sectionId }) {
        const sql = `
            INSERT INTO contacts_sections (auteur_nom, auteur_email, message_objet, message_contenu, sectionId)
            VALUES (?, ?, ?, ?, ?)
        `;
        const result = await this.request(sql, [nom, email, objet, contenu, sectionId]);
        return result || null;
    }

    async createEtudiant(data) {
        const { nom, postNom, preNom, matricule, sexe, dateNaissance, telephone, email, avatar } = data;
        console.log('Creating Etudiant with data:', data);
        const sql = `
            INSERT INTO etudiant (nom, post_nom, prenom, matricule, sexe, date_naiss, telephone, e_mail, avatar)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const result = await this.request(sql, [nom, postNom, preNom, matricule, sexe, dateNaissance, telephone, email, avatar]);
        return result || null;
    }

    async createAdminEtudiant(data) {
        /**
         * INSERT INTO `administratif_etudiant`( `id_etudiant`, `section`, `option`, `annee`, `pourcentage_exetat`) VALUES ('[value-1]','[value-2]','[value-3]','[value-4]','[value-5]','[value-6]')
         */
        const { id_etudiant, section, option, annee, pourcentage_exetat } = data;
        const sql = `
            INSERT INTO \`administratif_etudiant\`( \`id_etudiant\`, \`section\`, \`option\`, \`annee\`, \`pourcentage_exetat\`) VALUES (?, ?, ?, ?, ?)
        `;
        const result = await this.request(sql, [id_etudiant, section, option, annee, pourcentage_exetat]);
        return result || null;
    }

    async createOriginEtudiant(data) {
        /**
         * INSERT INTO `origine_etudiant`(`id_etudiant`, `id_ville`, `nomPays`, `nomProvince`, `nomVille`) VALUES ('[value-1]','[value-2]','[value-3]','[value-4]','[value-5]','[value-6]')
         */
        const { id_etudiant, nomPays, nomProvince, nomVille } = data;
        const sql = `
            INSERT INTO \`origine_etudiant\`(\`id_etudiant\`, \`id_ville\`, \`nomPays\`, \`nomProvince\`, \`nomVille\`) VALUES (?, ?, ?, ?, ?)
        `;
        const result = await this.request(sql, [id_etudiant, 3, nomVille, nomProvince, nomPays]);
        return result || null;
    }

    async createInscriptionEtudiant(data) {
        /**
         * INSERT INTO `req_inscription`(`id_section`, `id_niveau`, `id_etudiant`, `date_creation`, `statut`, `nref`) VALUES
         */
        const { id_section, id_niveau, id_etudiant, nref } = data;
        const sql = `
            INSERT INTO req_inscription(
                id_section, 
                id_niveau, 
                id_etudiant, 
                date_creation, 
                statut, 
                nref
            ) VALUES (?, ?, ?, ?, ?, ?)
        `;
        const result = await this.request(sql, [id_section, id_niveau, id_etudiant, NOW(), 'PENDING', nref]);
        return result || null;
    }
}

module.exports = AppModel;