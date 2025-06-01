const Controller = require('./Controller');
const { AppModel } = require('../models');

class AppController extends Controller {
    constructor() {
        super();
        this.model = AppModel;
    }

    async programmes(){
        try {
            const programmes = await this.model.getProgrammes();
            return this.result(
                'Programmes retrieved successfully', 
                programmes
            );
        } catch (error) {
            console.error('Error retrieving programmes:', error);
            return this.result('Failed to retrieve programmes', null, 500);
        }
    }

    async programme(id) {
        try {
            const programme = await this.model.getProgrammeById(id);
            if (!programme) {
                return this.result('Programme not found', null, 404);
            }
            return this.result(
                'Programme retrieved successfully', 
                programme
            );
        } catch (error) {
            console.error('Error retrieving programme:', error);
            return this.result('Failed to retrieve programme', null, 500);
        }
    }

    async annees() {
        try {
            const annees = await this.model.getAnnees();
            return this.result(
                'Annees retrieved successfully', 
                annees
            );
        } catch (error) {
            console.error('Error retrieving annees:', error);
            return this.result('Failed to retrieve annees', null, 500);
        }
    }

    async annee(id) {
        try {
            const annee = await this.model.getAnneeById(id);
            if (!annee) {
                return this.result('Annee not found', null, 404);
            }
            return this.result(
                'Annee retrieved successfully', 
                annee
            );
        } catch (error) {
            console.error('Error retrieving annee:', error);
            return this.result('Failed to retrieve annee', null, 500);
        }
    }

    async currentAnnee() {
        try {
            const annee = await this.model.getCurrentAnnee();
            if (!annee) {
                return this.result('Current annee not found', null, 404);
            }
            return this.result(
                'Current annee retrieved successfully', 
                annee
            );
        } catch (error) {
            console.error('Error retrieving current annee:', error);
            return this.result('Failed to retrieve current annee', null, 500);
        }
    }

}

module.exports = AppController;