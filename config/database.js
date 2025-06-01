const mysql = require('mysql2');
require('dotenv').config();

/**
 * Classe Database utilisant le pattern Singleton pour gérer les connexions à la base de données
 * Utilise un pool de connexions avec 15 connexions actives et 5 en file d'attente
 */
class Database {
    constructor() {
        if (Database.instance) {
            return Database.instance;
        }

        this.pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'inbtp_db',
            waitForConnections: true,
            connectionLimit: 15, // Nombre maximum de connexions actives
            queueLimit: 5 // Nombre maximum de connexions en file d'attente
        });

        // Promisify pour utiliser async/await
        this.pool = this.pool.promise();

        // Vérifier la connexion
        this.testConnection();

        Database.instance = this;
    }

    /**
     * Obtenir l'instance unique de la base de données
     * @returns {Database} L'instance unique de la base de données
     */
    static getInstance() {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }

    /**
     * Tester la connexion à la base de données
     * @private
     */
    async testConnection() {
        try {
            const connection = await this.pool.getConnection();
            console.log('Connexion à la base de données établie avec succès');
            connection.release();
        } catch (error) {
            console.error('Erreur de connexion à la base de données:', error.message);
            throw error;
        }
    }

    /**
     * Exécuter une requête SQL
     * @param {string} sql - La requête SQL à exécuter
     * @param {Array} params - Les paramètres de la requête
     * @returns {Promise} Le résultat de la requête
     */
    async query(sql, params) {
        try {
            const [results] = await this.pool.execute(sql, params);
            return results;
        } catch (error) {
            console.error('Erreur lors de l\'exécution de la requête:', error.message);
            throw error;
        }
    }
}

// Exporter l'instance unique de la base de données
module.exports = Database.getInstance();
