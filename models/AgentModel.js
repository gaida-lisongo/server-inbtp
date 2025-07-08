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
                WHERE matricule = ? AND mdp = ?
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

    async getLogsAgent(idAgent) {
        try {
            const query = `
                SELECT * 
                FROM logs_titulaire
                WHERE id_agent = ?
                ORDER BY date_login DESC
            `;  
            const {rows, count} = await this.request(query, [idAgent]);

            if (rows && rows.length > 0) {
                return rows;
            }

            return [];
        } catch (error) {
            console.error('Error fetching agent logs:', error);
            throw error; // Propagation de l'erreur pour gestion ultérieure
        }
    }

    async checkUserSession(userId, session) {
        try {
            const query = `
                SELECT affectation.*, poste.designation 
                FROM affectation
                INNER JOIN poste ON affectation.id_poste = poste.id
                WHERE affectation.id_agent = ? AND poste.designation = ?
            `;
            const {rows, count} = await this.request(query, [userId, session]);

            if (rows && rows.length > 0) {
                return rows[0];
            }

            return null;
        } catch (error) {
            console.error('Error checking user session:', error);
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
            const response = await this.request(query, [val, agentId]);

            if(response){
                return response.rows;
            }
            return null;
        } catch (error) {
            console.error(`Error updating user ${col}:`, error);
            throw error; // Propagation de l'erreur pour gestion ultérieure
        }
    }

    async getRetraitsByAgent(id_agent) {
        const sql = `SELECT * FROM retrait_user WHERE id_agent = ?`;
        const result = await this.request(sql, [id_agent]);
        return result || [];
    }

    async createRetrait(retraitData) {
        const sql = `INSERT INTO retrait_user (id_agent, montant, telephone, observation, date_creation) VALUES (?, ?, ?, ?, NOW())`;
        const result = await this.request(sql, [retraitData.id_agent, retraitData.montant, retraitData.telephone, retraitData.observation]);
        return result || [];
    }

    async createLog(idAgent, ipAdresse){
        //logs_titulaire`(`id`, `id_agent`, `id_section`, `date_login`, `ip_adresse`)
        const sql = `INSERT INTO logs_titulaire (id_agent, date_login, ip_adresse) VALUES (?, NOW(), ?)`;
        const result = await this.request(sql, [idAgent, ipAdresse]);
        return result || [];
    }

    async updateRetrait(col, value, id) {
        const sql = `UPDATE retrait_user SET ${col} = ? WHERE id = ?`;
        const result = await this.request(sql, [value, id]);
        return result || [];
    }

    async deleteRetrait(id) {
        const sql = `DELETE FROM retrait_user WHERE id = ?`;
        const result = await this.request(sql, [id]);
        return result || [];
    }
}

module.exports = AgentModel;