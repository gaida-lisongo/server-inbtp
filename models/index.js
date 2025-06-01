const Model = require('./Model');

const model = new Model();

// Exportez tous vos modèles de manière organisée
module.exports = {
    // Classe de base
    Model: model,
    // Fonction pour initialiser tous les modèles si nécessaire
    init: async () => {
        try {
            // Ajoutez ici la logique d'initialisation si nécessaire
            console.log('Models initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing models:', error);
            throw error;
        }
    }
};