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

    async promotions() {
        try {
            const promotions = await this.model.getPromotions();
            return this.result(
                'Promotions retrieved successfully', 
                promotions
            );
        } catch (error) {
            console.error('Error retrieving promotions:', error);
            return this.result('Failed to retrieve promotions', null, 500);
        }
    }

    async promotionsBySection(id) {
        try {
            const promotions = await this.model.getPromotionsByProgramme(id);
            if (!promotions) {
                return this.result('Promotions not found for section', null, 404);
            }
            return this.result(
                'Promotions retrieved successfully for section', 
                promotions
            );
        } catch (error) {
            console.error('Error retrieving promotions by section:', error);
            return this.result('Failed to retrieve promotions by section', null, 500);
        }
    }

    async promotion(promotionId){
        try {
            const promotion = await this.model.getPromotionsById(promotionId);
            if (!promotion) {
                return this.result('Promotion not found', null, 404);
            }
            const matieresData = await this.model.getMatieresByPromotion(promotionId);
            if (!matieresData) {
                return this.result('Matieres not found for promotion', null, 404);
            }
            let semestre1 = [];
            let semestre2 = [];

            matieresData.rows.map(matiere => {
                if (!matiere) {
                    return null; // Skip if matiere is not found
                }

                if (matiere.semestre == 'Premier') {
                    semestre1.push({
                        id: matiere.id,
                        titre: matiere.designation,
                        credit: matiere.credit,
                        unite: {
                            id: matiere.id_unite,
                            code: matiere['unite-code'],
                            designation: matiere['unite-titre']
                        }
                    });

                } else {
                    semestre2.push({
                        id: matiere.id,
                        titre: matiere.designation,
                        credit: matiere.credit,
                        unite: {
                            id: matiere.id_unite,
                            code: matiere['unite-code'],
                            designation: matiere['unite-titre']
                        }
                    });
                }
            });
            return this.result(
                'Promotion retrieved successfully',
                {
                    promotion : promotion.rows[0],
                    matieres : {
                        semestre1,
                        semestre2
                    }
                } 
            );

        } catch (error) {
            console.error('Error retrieving matieres by promotion:', error);
            return this.result('Failed to retrieve matieres by promotion', null, 500);
            
        }
    }

    async addMessageSection(data) {
        try {
            const result = await this.model.createMessageSection(data);
            if (!result) {
                return this.result('Failed to add message', null, 400);
            }
            return this.result(
                'Message added successfully', 
                result
            );
        } catch (error) {
            console.error('Error adding message:', error);
            return this.result('Failed to add message', null, 500);
        }
    }

}

module.exports = AppController;