const AppModel = require('./AppModel');

class UserModel extends AppModel {
    constructor() {
        super();
    }

    async getUserByAuth(data) {
        try {
            const query = `
                SELECT * 
                FROM etudiant
                WHERE matricule = ? AND mdp = ?
            `;
            const result = await this.request(query, [data.matricule, data.mdp]);

            return result || [];
        } catch (error) {
            console.error('Error fetching user by auth:', error);
            throw error; // Propagation de l'erreur pour gestion ultérieure
        }
    }

    async getUserByMatricule(matricule) {
        try {
            const query = `
                SELECT * 
                FROM etudiant
                WHERE matricule = ?
            `;
            const result = await this.request(query, [matricule]);

            return result || [];
        } catch (error) {
            console.error('Error fetching user by matricule:', error);
            throw error; // Propagation de l'erreur pour gestion ultérieure
        }
    }

    async updatePassword(data) {
        try {
            const query = `
                UPDATE etudiant 
                SET mdp = ? 
                WHERE id = ?
            `;
            const result = await this.request(query, [data.mdp, data.etudiantId]);

            return result || false;
        } catch (error) {
            console.error('Error updating password:', error);
            throw error; // Propagation de l'erreur pour gestion ultérieure
        }
    }

    async updateMatricule(data) {
        try {
            const query = `
                UPDATE etudiant 
                SET matricule = ? 
                WHERE id = ?
            `;
            const result = await this.request(query, [data.matricule, data.etudiantId]);

            return result || false;
        } catch (error) {
            console.error('Error updating matricule:', error);
            throw error; // Propagation de l'erreur pour gestion ultérieure
        }
    }

}

module.exports = UserModel;
