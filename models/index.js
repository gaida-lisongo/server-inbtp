const Model = require('./Model');
const AppModel = require('./AppModel');

const model = new Model();
const appModel = new AppModel();

// Exportez tous vos modèles de manière organisée
module.exports = {
    // Classe de base
    Model: model,
    AppModel: appModel,
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