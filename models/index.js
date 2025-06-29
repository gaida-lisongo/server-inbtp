const Model = require('./Model');
const AppModel = require('./AppModel');
const UserModel = require('./UserModel');
const AgentModel = require('./AgentModel');
const BibliothequeModel = require('./BibliothequeModel');
const SectionModel = require('./SectionModel');

const model = new Model();
const appModel = new AppModel();
const userModel = new UserModel();
const agentModel = new AgentModel();
const sectionModel = new SectionModel();
const bibliothequeModel = new BibliothequeModel();

// Exportez tous vos modèles de manière organisée
module.exports = {
    // Classe de base
    Model: model,
    AppModel: appModel,
    UserModel: userModel,
    AgentModel: agentModel, 
    BibliothequeModel: bibliothequeModel,
    SectionModel: sectionModel,
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