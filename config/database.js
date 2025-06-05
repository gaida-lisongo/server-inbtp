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
        }        this.pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'inbtp_db',
            port: process.env.DB_PORT || 3306,
            waitForConnections: true,
            connectionLimit: 10, // Réduire le nombre de connexions pour Koyeb
            queueLimit: 0, // Pas de limite de file d'attente
            enableKeepAlive: true,
            keepAliveInitialDelay: 10000,
            connectTimeout: 60000, // Augmenter le timeout
            acquireTimeout: 60000,
            timeout: 120000,
            ssl: {
                // Activer SSL mais permettre les certificats auto-signés
                rejectUnauthorized: false
            },
            // Configuration spécifique pour gérer les déconnexions
            multipleStatements: true,
            timezone: 'Z'
        });

        // Promisify pour utiliser async/await
        this.pool = this.pool.promise();

        // Vérifier la connexion avec retry
        this.initConnection();

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
     * Initialise la connexion avec un système de retry
     * @private
     */
    async initConnection(retries = 5) {
        for (let i = 0; i < retries; i++) {
            try {
                const connection = await this.pool.getConnection();
                console.log('Connexion à la base de données établie avec succès');
                // Test de la connexion avec une requête simple
                await connection.query('SELECT 1');
                console.log('Test de connexion réussi');
                connection.release();
                return;
            } catch (error) {
                const retryIn = Math.min(1000 * Math.pow(2, i), 10000);
                console.error(`Tentative ${i + 1}/${retries} - Erreur de connexion:`, error.message);
                console.error('Configuration utilisée:', {
                    host: process.env.DB_HOST,
                    user: process.env.DB_USER,
                    database: process.env.DB_NAME,
                    port: process.env.DB_PORT || 3306
                });
                
                if (i === retries - 1) {
                    throw error;
                }
                console.log(`Nouvelle tentative dans ${retryIn/1000} secondes...`);
                await new Promise(resolve => setTimeout(resolve, retryIn));
            }
        }
    }

    /**
     * Exécuter une requête SQL avec retry automatique
     * @param {string} sql - La requête SQL à exécuter
     * @param {Array} params - Les paramètres de la requête
     * @returns {Promise} Le résultat de la requête
     */
    async query(sql, params, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                const [results] = await this.pool.execute(sql, params);
                return results;
            } catch (error) {
                console.error(`Tentative ${i + 1}/${retries} - Erreur de requête:`, error.message);
                if (i === retries - 1 || !this.isRetryableError(error)) {
                    throw error;
                }
                await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
            }
        }
    }

    /**
     * Vérifie si l'erreur permet une nouvelle tentative
     * @private
     */
    isRetryableError(error) {
        const retryableErrors = ['ETIMEDOUT', 'ECONNRESET', 'PROTOCOL_CONNECTION_LOST'];
        return retryableErrors.includes(error.code);
    }
}

// Exporter l'instance unique de la base de données
module.exports = Database.getInstance();
