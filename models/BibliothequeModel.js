const AgentModel = require('./AgentModel');

class BibliothequeModel extends AgentModel {
    constructor() {
        super();
    }

    async getAllAuteurs() {
        try {
            const query = `
                SELECT * 
                FROM auteur
            `;
            const { rows, count } = await this.request(query);
            return rows || [];
        } catch (error) {
            console.error('Error fetching all authors:', error);
            throw error; // Propagation de l'erreur pour gestion ultérieure
        }
    }

    async getAllCategories() {
        try {
            const query = `
                SELECT theme.*, COUNT(ouvrage.id) AS ouvrage_count
                FROM theme
                LEFT JOIN ouvrage ON theme.id = ouvrage.id_theme
                GROUP BY theme.id
            `;
            const { rows, count } = await this.request(query);
            console.log('Total categories:', count);
            console.log('Categories:', rows);
            return rows || [];
        } catch (error) {
            console.error('Error fetching all categories:', error);
            throw error; // Propagation de l'erreur pour gestion ultérieure
        }
    }

    async getAllDocuments() {
        try {
            const query = `
                SELECT * 
                FROM document_type
            `;
            const { rows, count } = await this.request(query);
            return rows || [];
        } catch (error) {
            console.error('Error fetching all documents:', error);
            throw error; // Propagation de l'erreur pour gestion ultérieure
        }
    }

    async getAllOuvrages() {
        try {
            const query = `
                SELECT ouvrage.*, CONCAT(auteur.nom, ' ', auteur.post_nom) AS auteur_name,
                       theme.designation AS theme_name, theme.description AS theme_description, document_type.designation AS document, document_type.description AS document_description
                FROM ouvrage
                INNER JOIN auteur ON ouvrage.id_auteur = auteur.id
                INNER JOIN theme ON ouvrage.id_theme = theme.id
                INNER JOIN document_type ON ouvrage.id_document = document_type.id
            `;
            const { rows, count } = await this.request(query);
            return rows || [];
        } catch (error) {
            console.error('Error fetching all works:', error);
            throw error; // Propagation de l'erreur pour gestion ultérieure
        }
    }

    async getOuvragesByTheme(themeId) {
        try {
            const query = `
                SELECT ouvrage.*, CONCAT(auteur.nom, ' ', auteur.post_nom) AS auteur_name,
                       theme.designation AS theme_name, theme.description AS theme_description, document_type.designation AS document, document_type.description AS document_description
                FROM ouvrage
                INNER JOIN auteur ON ouvrage.id_auteur = auteur.id
                INNER JOIN theme ON ouvrage.id_theme = theme.id
                INNER JOIN document_type ON ouvrage.id_document = document_type.id
                WHERE ouvrage.id_theme = ?
            `;
            const { rows, count } = await this.request(query, [themeId]);
            return rows || [];
        } catch (error) {
            console.error('Error fetching works by theme:', error);
            throw error; // Propagation de l'erreur pour gestion ultérieure
        }
    }

    async getOuvragesByDocumentType(documentTypeId) {
        try {
            const query = `
                SELECT ouvrage.*, CONCAT(auteur.nom, ' ', auteur.post_nom) AS auteur_name,
                       theme.designation AS theme_name, theme.description AS theme_description, document_type.designation AS document, document_type.description AS document_description
                FROM ouvrage
                INNER JOIN auteur ON ouvrage.id_auteur = auteur.id
                INNER JOIN theme ON ouvrage.id_theme = theme.id
                INNER JOIN document_type ON ouvrage.id_document = document_type.id
                WHERE ouvrage.id_document = ?
            `;
            const { rows, count } = await this.request(query, [documentTypeId]);
            return rows || [];
        } catch (error) {
            console.error('Error fetching works by document type:', error);
            throw error; // Propagation de l'erreur pour gestion ultérieure
        }
    }

    async getOuvragesByAuthor(authorId) {
        try {
            const query = `
                SELECT ouvrage.*, CONCAT(auteur.nom, ' ', auteur.post_nom) AS auteur_name,
                       theme.designation AS theme_name, theme.description AS theme_description, document_type.designation AS document, document_type.description AS document_description
                FROM ouvrage
                INNER JOIN auteur ON ouvrage.id_auteur = auteur.id
                INNER JOIN theme ON ouvrage.id_theme = theme.id
                INNER JOIN document_type ON ouvrage.id_document = document_type.id
                WHERE ouvrage.id_auteur = ?
            `;
            const { rows } = await this.request(query, [authorId]);
            return rows || [];
        } catch (error) {
            console.error('Error fetching works by author:', error);
            throw error; // Propagation de l'erreur pour gestion ultérieure
        }
    }

    async getAllReservations() {
        try {
            const query = `
                SELECT reservation.*, CONCAT(etudiant.nom, ' ', etudiant.post_nom) AS etudiant_name,
                       CONCAT(ouvrage.titre, ' (', ouvrage.id, ')') AS ouvrage_title,
                          ouvrage.id AS ouvrage_id, ouvrage.id_auteur, ouvrage.id_theme, ouvrage.id_document,
                          CONCAT(auteur.nom, ' ', auteur.post_nom) AS auteur_name,
                          theme.designation AS theme_name, theme.description AS theme_description,
                            document_type.designation AS document, document_type.description AS document_description
                FROM reservation
                INNER JOIN etudiant ON reservation.id_etudiant = etudiant.id
                INNER JOIN ouvrage ON reservation.id_ouvrage = ouvrage.id
                INNER JOIN auteur ON ouvrage.id_auteur = auteur.id
                INNER JOIN theme ON ouvrage.id_theme = theme.id
                INNER JOIN document_type ON ouvrage.id_document = document_type.id
                ORDER BY reservation.date_created DESC
            `;
            const { rows, count } = await this.request(query);
            return rows || [];
        } catch (error) {
            console.error('Error fetching all reservations:', error);
            throw error; // Propagation de l'erreur pour gestion ultérieure
        }
    }

    async getReservationsByStudent(studentId) {
        try {
            const query = `
                SELECT reservation.*, CONCAT(etudiant.nom, ' ', etudiant.post_nom) AS etudiant_name,
                       CONCAT(ouvrage.titre, ' (', ouvrage.id, ')') AS ouvrage_title,
                          ouvrage.id AS ouvrage_id, ouvrage.id_auteur, ouvrage.id_theme, ouvrage.id_document,
                          CONCAT(auteur.nom, ' ', auteur.post_nom) AS auteur_name,
                          theme.designation AS theme_name, theme.description AS theme_description,
                            document_type.designation AS document, document_type.description AS document_description
                FROM reservation
                INNER JOIN etudiant ON reservation.id_etudiant = etudiant.id
                INNER JOIN ouvrage ON reservation.id_ouvrage = ouvrage.id
                INNER JOIN auteur ON ouvrage.id_auteur = auteur.id
                INNER JOIN theme ON ouvrage.id_theme = theme.id
                INNER JOIN document_type ON ouvrage.id_document = document_type.id
                WHERE reservation.id_etudiant = ?
                ORDER BY reservation.date_created DESC
            `;
            const { rows } = await this.request(query, [studentId]);
            return rows || [];
        } catch (error) {
            console.error('Error fetching reservations by student:', error);
            throw error; // Propagation de l'erreur pour gestion ultérieure
        }
    }

    async getReservationsByWork(workId, anneeId) {
        try {
            const query = `
                SELECT reservation.*, CONCAT(etudiant.nom, ' ', etudiant.post_nom) AS etudiant_name,
                       CONCAT(ouvrage.titre, ' (', ouvrage.id, ')') AS ouvrage_title,
                          ouvrage.id AS ouvrage_id, ouvrage.id_auteur, ouvrage.id_theme, ouvrage.id_document,
                          CONCAT(auteur.nom, ' ', auteur.post_nom) AS auteur_name,
                          theme.designation AS theme_name, theme.description AS theme_description,
                            document_type.designation AS document, document_type.description AS document_description
                FROM reservation
                INNER JOIN etudiant ON reservation.id_etudiant = etudiant.id
                INNER JOIN ouvrage ON reservation.id_ouvrage = ouvrage.id
                INNER JOIN auteur ON ouvrage.id_auteur = auteur.id
                INNER JOIN theme ON ouvrage.id_theme = theme.id
                INNER JOIN document_type ON ouvrage.id_document = document_type.id
                WHERE reservation.id_ouvrage = ? AND reservation.id_annee = ?
                ORDER BY reservation.date_created DESC
            `;
            const { rows } = await this.request(query, [workId, anneeId]);
            return rows || [];
        } catch (error) {
            console.error('Error fetching reservations by work:', error);
            throw error; // Propagation de l'erreur pour gestion ultérieure
        }
    }

    async getReservationByTheme(themeId, anneeId) {
        try {
            const query = `
                SELECT reservation.*, CONCAT(etudiant.nom, ' ', etudiant.post_nom) AS etudiant
                FROM reservation
                INNER JOIN etudiant ON reservation.id_etudiant = etudiant.id
                INNER JOIN ouvrage ON reservation.id_ouvrage = ouvrage.id
                INNER JOIN auteur ON ouvrage.id_auteur = auteur.id
                INNER JOIN theme ON ouvrage.id_theme = theme.id
                INNER JOIN document_type ON ouvrage.id_document = document_type.id
                WHERE ouvrage.id_theme = ? AND reservation.id_annee = ?
                ORDER BY reservation.id DESC
            `;
            const { rows } = await this.request(query, [themeId, anneeId]);
            return rows || [];
        } catch (error) {
            console.error('Error fetching reservations by theme:', error);
            throw error; // Propagation de l'erreur pour gestion ultérieure
        }
    }

    async getBibliothequeData() {
        try {
            const query = `
                SELECT 
                    theme.*, f.designation AS 'filiere',
                    COUNT(DISTINCT ouvrage.id) AS total_ouvrage,
                    COUNT(DISTINCT auteur.id) AS total_auteur,
                    COUNT(DISTINCT document_type.id) AS total_type,
                    COUNT(DISTINCT r.id) AS total_reservation
                FROM theme
                INNER JOIN section f ON f.id = theme.id_filiere
                LEFT JOIN ouvrage ON theme.id = ouvrage.id_theme
                LEFT JOIN reservation r ON r.id_ouvrage = ouvrage.id
                LEFT JOIN auteur ON ouvrage.id_auteur = auteur.id
                LEFT JOIN document_type ON ouvrage.id_document = document_type.id
                GROUP BY theme.id
            `;
            const { rows } = await this.request(query);
            return rows || [];
        } catch (error) {
            console.error('Error fetching bibliotheque data:', error);
            throw error; // Propagation de l'erreur pour gestion ultérieure
        }
    }

    async getReservationsByAnnee(anneeId) {
        try {
            const query = `
                SELECT reservation.*, CONCAT(etudiant.nom, ' ', etudiant.post_nom) AS etudiant_name,
                       CONCAT(ouvrage.titre, ' (', ouvrage.id, ')') AS ouvrage_title,
                          ouvrage.id AS ouvrage_id, ouvrage.id_auteur, ouvrage.id_theme, ouvrage.id_document,
                          CONCAT(auteur.nom, ' ', auteur.post_nom) AS auteur_name,
                          theme.designation AS theme_name, theme.description AS theme_description,
                            document_type.designation AS document, document_type.description AS document_description
                FROM reservation
                INNER JOIN etudiant ON reservation.id_etudiant = etudiant.id
                INNER JOIN ouvrage ON reservation.id_ouvrage = ouvrage.id
                INNER JOIN auteur ON ouvrage.id_auteur = auteur.id
                INNER JOIN theme ON ouvrage.id_theme = theme.id
                INNER JOIN document_type ON ouvrage.id_document = document_type.id
                WHERE reservation.id_annee = ?
                ORDER BY reservation.date_created DESC
            `;
            const { rows } = await this.request(query, [anneeId]);
            return rows || [];
        } catch (error) {
            console.error('Error fetching reservations by year:', error);
            throw error; // Propagation de l'erreur pour gestion ultérieure
        }
    }

    async createAuteur(data) {
        try {
            const query = `
                INSERT INTO auteur (nom, post_nom, prenom, photo, description)
                VALUES (?, ?, ?, ?, ?)
            `;
            const { rows } = await this.request(query, [data.nom, data.post_nom, data.prenom, data.photoUrl, data.description]);
            return rows || [];
        } catch (error) {
            console.error('Error creating author:', error);
            throw error; // Propagation de l'erreur pour gestion ultérieure
        }
    }

    async createTheme(data) {
        try {
            const query = `
                INSERT INTO theme (designation, description, id_filiere)
                VALUES (?, ?, ?)
            `;
            const { rows } = await this.request(query, [data.designation, data.description, data.id_filiere || null]);
            return rows || [];
        } catch (error) {
            console.error('Error creating theme:', error);
            throw error; // Propagation de l'erreur pour gestion ultérieure
        }
    }

    async createDocumentType(data) {
        try {
            const query = `
                INSERT INTO document_type (designation, description)
                VALUES (?, ?)
            `;
            const { rows } = await this.request(query, [data.designation, data.description]);
            return rows || [];
        } catch (error) {
            console.error('Error creating document type:', error);
            throw error; // Propagation de l'erreur pour gestion ultérieure
        }
    }

    async createOuvrage(data) {
        try {
            const query = `
                INSERT INTO ouvrage (titre, id_auteur, id_theme, id_document, description, tags, annee, mois, jour, lieu_edition, qte)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const { rows } = await this.request(query, [data.titre, data.id_auteur, data.id_theme, data.id_document, data.description, data.tags, data.annee, data.mois, data.jour, data.lieu_edition, data.qte  || 0]);
            return rows || [];
        } catch (error) {
            console.error('Error creating work:', error);
            throw error; // Propagation de l'erreur pour gestion ultérieure
        }
    }

    async updateDocumentType(id, column, value) {
        try {
            const query = `
                UPDATE document_type
                SET ${column} = ?
                WHERE id = ?
            `;
            const { rows } = await this.request(query, [value, id]);
            return rows || [];
        } catch (error) {
            console.error('Error updating document type:', error);
            throw error; // Propagation de l'erreur pour gestion ultérieure
        }
    }

    async updateOuvrage(id, column, value) {
        try {
            const query = `
                UPDATE ouvrage
                SET ${column} = ?
                WHERE id = ?
            `;
            const { rows } = await this.request(query, [value, id]);
            return rows || [];
        } catch (error) {
            console.error('Error updating work:', error);
            throw error; // Propagation de l'erreur pour gestion ultérieure
        }
    }

    async updateTheme(id, column, value) {
        try {
            const query = `
                UPDATE theme
                SET ${column} = ?
                WHERE id = ?
            `;
            const { rows } = await this.request(query, [value, id]);
            return rows || [];
        } catch (error) {
            console.error('Error updating theme:', error);
            throw error; // Propagation de l'erreur pour gestion ultérieure
        }
    }

    async updateAuteur(id, column, value) {
        try {
            const query = `
                UPDATE auteur
                SET ${column} = ?
                WHERE id = ?
            `;
            const { rows } = await this.request(query, [value, id]);
            return rows || [];
        } catch (error) {
            console.error('Error updating author:', error);
            throw error; // Propagation de l'erreur pour gestion ultérieure
        }
    }

    async updateReservation(id, column, value) {
        try {
            const query = `
                UPDATE reservation
                SET ${column} = ?
                WHERE id = ?
            `;
            const { rows } = await this.request(query, [value, id]);
            return rows || [];
        } catch (error) {
            console.error('Error updating reservation:', error);
            throw error; // Propagation de l'erreur pour gestion ultérieure
        }
    }

    async deleteOuvrage(id) {
        try {
            const query = `
                DELETE FROM ouvrage
                WHERE id = ?
            `;
            const { rows } = await this.request(query, [id]);
            return rows || [];
        } catch (error) {
            console.error('Error deleting work:', error);
            throw error; // Propagation de l'erreur pour gestion ultérieure
        }
    }

    async deleteAuteur(id) {
        try {
            const query = `
                DELETE FROM auteur
                WHERE id = ?
            `;
            const { rows } = await this.request(query, [id]);
            return rows || [];
        } catch (error) {
            console.error('Error deleting author:', error);
            throw error; // Propagation de l'erreur pour gestion ultérieure
        }
    }

    async deleteTheme(id) {
        try {
            const query = `
                DELETE FROM theme
                WHERE id = ?
            `;
            const { rows } = await this.request(query, [id]);
            return rows || [];
        } catch (error) {
            console.error('Error deleting theme:', error);
            throw error; // Propagation de l'erreur pour gestion ultérieure
        }
    }

    async deleteDocumentType(id) {
        try {
            const query = `
                DELETE FROM document_type
                WHERE id = ?
            `;
            const { rows } = await this.request(query, [id]);
            return rows || [];
        } catch (error) {
            console.error('Error deleting document type:', error);
            throw error; // Propagation de l'erreur pour gestion ultérieure
        }
    }

    async deleteReservation(id) {
        try {
            const query = `
                DELETE FROM reservation
                WHERE id = ?
            `;
            const { rows } = await this.request(query, [id]);
            return rows || [];
        } catch (error) {
            console.error('Error deleting reservation:', error);
            throw error; // Propagation de l'erreur pour gestion ultérieure
        }
    }
}

module.exports = BibliothequeModel;