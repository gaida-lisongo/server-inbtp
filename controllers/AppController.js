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
}

module.exports = AppController;