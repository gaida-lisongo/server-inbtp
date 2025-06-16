require('dotenv').config();
const { UserModel } = require('../models');

class FlexPay {
    constructor() {
        this.token = process.env.FLEX_TOKEN;
        console.log('FlexPay Token:', this.token);

        this.endpoints = {
            payment: process.env.FLEX_HOST,
            check: process.env.FLEX_CHECK            
        };
        this.headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
        };
        this.merchant = process.env.FLEX_MERCHANT;
        this.taux = process.env.TAUX;
    }

    convertUSDtoCDF(amount) {
        if (typeof amount !== 'number' || isNaN(amount)) {
            throw new Error('Le montant doit être un nombre valide');
        }
        return Math.round(amount * this.taux);
    }

    async createPayment(data) {
        try {
            const { phone, amount, currency, reference, id_recharge } = data;
            if (!phone || !amount || !currency || !reference) {
                throw new Error('Tous les champs (phone, amount, currency, reference) sont requis');
            }

            const request = await fetch(this.endpoints.payment, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    type: '1',
                    phone,
                    amount: amount,
                    currency,
                    reference,
                    merchant: 'ELMESAC',
                    callbackUrl: `https://server-ista-gm-sncd.onrender.com/api/etudiant/flexpay`
                })
            });
            if (!request.ok) {
                throw new Error(`Erreur lors de la création du paiement: ${request.statusText}`);
            }
            const response = await request.json();
            console.log('Response from FlexPay:', response);

            if(response.code != 0){
                throw new Error(`Erreur FlexPay: ${response.message}`);
            }
            
            const { rows, count } = await UserModel.updateRecharge('orderNumber', response.orderNumber, id_recharge);


            console.log('Recharge updated successfully:', rows);
            if (!rows || rows.length === 0) {
                throw new Error('Échec de la mise à jour de la recharge');
            }

            const changeRecharge = await UserModel.updateRecharge('statut', 'PENDING', id_recharge);
            console.log('Recharge status updated to PENDING:', changeRecharge);

            if (!changeRecharge.rows || changeRecharge.rows.length === 0) {
                throw new Error('Échec de la mise à jour du statut de la recharge');
            }
            
            return {
                success: true,
                message: 'Paiement créé avec succès',
                data: response
            };

        } catch (error) {
            console.error('Erreur dans createPayment:', error);
            throw error;
        }
    }

    async checkPayment(data) {
        try {
            const { orderNumber, id_recharge, id_etudiant, solde } = data;
            if (!orderNumber || !id_recharge || !id_etudiant || solde === undefined) {
                throw new Error('Tous les champs (orderNumber, id_recharge, id_etudiant, solde) sont requis');
            }

            const request = await fetch(`${this.endpoints.check}/${orderNumber}`,
                {
                    method: 'GET',
                    headers: this.headers
                }
            );

            if (!request.ok) {
                throw new Error(`Erreur lors de la vérification du paiement: ${request.statusText}`);
            }

            const response = await request.json();
            console.log('Response from FlexPay Check:', response);

            const { transaction } = response;
            if (!transaction || transaction.status != 0) {
                return {
                    success: false,
                    message: 'Le paiement n\'a pas été trouvé ou n\'est pas valide',
                    data: { ...response }
                }
            }

            let newSolde = 0.0;

            if (transaction.currency !== 'CDF') {
                newSolde = (solde ? floatval(solde) : 0) + this.convertUSDtoCDF((floatval(transaction.amount)));
                // Mettre à jour le solde de l'utilisateur dans la base de données
            } else {
                newSolde = (solde ? floatval(solde) : 0) + floatval(transaction.amount);
            }

            const { rows } = await UserModel.updateRecharge('statut', 'OK', id_recharge);
            console.log('Recharge status updated to OK:', rows);

            if (!rows || rows.length === 0) {
                throw new Error('Échec de la mise à jour du statut de la recharge');
            }

            const updateUser = await UserModel.updateUser('solde', newSolde, id_etudiant);
            console.log('User balance updated successfully:', updateUser);

            if (!updateUser || !updateUser.rows || updateUser.rows.length === 0) {
                throw new Error('Échec de la mise à jour du solde de l\'utilisateur');
            }

            return {
                success: true,
                message: 'Paiement vérifié avec succès',
                data: {
                    transaction,
                    newSolde,
                    statut: 'OK',
                }
            };
            
        } catch (error) {
            console.error('Erreur dans checkPayment:', error);
            throw error;            
        }
    }

}

module.exports = new FlexPay();