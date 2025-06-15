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

}

module.exports = UserModel;
