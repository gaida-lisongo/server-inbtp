const UserModel = require('./UserModel');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt.config');

class AgentModel extends UserModel {
    constructor(){
        super();
    }

    async getAgentByAuth(data) {
        try {
            const query = `
                SELECT * 
                FROM agent
                WHERE matricule = ? AND secure = ?
            `;
            const {rows, count} = await this.request(query, [data.matricule, data.mdp]);
            
            if (rows && rows.length > 0) {
                const agent = rows[0];
                const token = this.generateToken(agent);
                return { agent, token };
            }

            return null;
        } catch (error) {
            console.error('Error fetching agent by auth:', error);
            throw error; // Propagation de l'erreur pour gestion ultérieure
        }
    }

    async getAgentByMatricule(matricule) {
        try {
            const query = `
                SELECT * 
                FROM agent
                WHERE matricule = ?
            `;
            const {rows, count} = await this.request(query, [matricule]);

            if (rows && rows.length > 0) {
                return rows[0];
            }

            return null;
        } catch (error) {
            console.error('Error fetching agent by matricule:', error);
            throw error; // Propagation de l'erreur pour gestion ultérieure
        }
    }

    async updateAgent(col, val, agentId) {
        try {
            const query = `
                UPDATE agent 
                SET ${col} = ? 
                WHERE id = ?
            `;
            const {rows, count} = await this.request(query, [val, agentId]);

            if( rows && rows.length > 0){
                const user = rows[0];
                const token = this.generateToken(user);
                return { user, token };
            }
            return null;
        } catch (error) {
            console.error(`Error updating user ${col}:`, error);
            throw error; // Propagation de l'erreur pour gestion ultérieure
        }
    }


}

module.exports = AgentModel;