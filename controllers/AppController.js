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
}

module.exports = AppController;