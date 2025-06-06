const mysql = require('mysql2');
require('dotenv').config();

/**
 * Classe Database utilisant le pattern Singleton pour gérer les connexions à la base de données
 */
class Database {
    constructor() {
        if (Database.instance) {
            return Database.instance;
        }

        // Vérification des variables d'environnement requises
        const requiredVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
        const missingVars = requiredVars.filter(varName => !process.env[varName]);
        
        if (missingVars.length > 0) {
            console.error('Variables d\'environnement manquantes:', missingVars.join(', '));
            console.error('Valeurs actuelles:', {
                DB_HOST: process.env.DB_HOST,
                DB_USER: process.env.DB_USER,
                DB_NAME: process.env.DB_NAME,
                DB_PORT: process.env.DB_PORT
            });
            throw new Error(`Variables d'environnement manquantes : ${missingVars.join(', ')}`);
        }

        // Configuration de la base de données
        const dbConfig = {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: parseInt(process.env.DB_PORT || '3306'),
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            enableKeepAlive: true,
            keepAliveInitialDelay: 10000,
            connectTimeout: 60000,
            acquireTimeout: 60000,
            timeout: 120000,
            ssl: process.env.NODE_ENV === 'production' ? {
                rejectUnauthorized: false
            } : false,
            multipleStatements: true,
            timezone: 'Z'
        };

        // Log de la configuration (sans le mot de passe)
        console.log('Configuration de la base de données:', {
            ...dbConfig,
            password: '********'
        });

        this.pool = mysql.createPool(dbConfig);

        // Promisify pour utiliser async/await
        this.pool = this.pool.promise();

        // Vérifier la connexion avec retry
        this.initConnection();

        Database.instance = this;
    }

    static getInstance() {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }

    async initConnection(retries = 5) {
        for (let i = 0; i < retries; i++) {
            try {
                const connection = await this.pool.getConnection();
                console.log('Connexion à la base de données établie avec succès');
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

    isRetryableError(error) {
        const retryableErrors = ['ETIMEDOUT', 'ECONNRESET', 'PROTOCOL_CONNECTION_LOST'];
        return retryableErrors.includes(error.code);
    }
}

module.exports = Database.getInstance();
