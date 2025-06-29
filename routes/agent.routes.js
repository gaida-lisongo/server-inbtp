const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { authenticate } = require('../middleware/authJwt');
const { AgentModel } = require('../models');
const mailService = require('../utils/sendMail');
require('dotenv').config();

let otps = [];

function generateOTP(userId) {
    //Exemple de génération d'un OTP aléatoire 236879
    const lengthOTP = 6;
    let otp = [];
    for (let i = 0; i < lengthOTP; i++) {
        otp.push(Math.floor(Math.random() * 10));
    }
    otp = otp.join('');
    console.log(`Generated OTP for user ${userId}: ${otp}`);
    otps.push({ id: userId, otp });
    return otp;
}

async function hashPassword(password) {
    // crypte le mot de passe avec SHA-256
    return crypto.createHash('sha256').update(password).digest('hex');
}

async function generatePassword() {
    // génère un mot de passe aléatoire de 8 caractères
    return crypto.randomBytes(4).toString('hex');
}


async function convertBufferToBase64(buffer) {
    // Convertit un buffer en base64
    return buffer.toString('base64');
}

router.post('/login', async (req, res) => {
    const { matricule, mdp } = req.body;

    if (!matricule || !mdp) {
        return res.status(400).json({ error: 'Matricule and password are required' });
    }

    try {
        const hashedPassword = await hashPassword(mdp);
        const result = await AgentModel.getAgentByAuth({ matricule, mdp: hashedPassword });

        if (result) {
            const { agent, token } = result;
            return res.status(200).json({ success: true, message: 'Agent authenticated successfully', data: { agent, token } });
        } else {
            return res.status(401).json({ success: false, message: 'Invalid matricule or password' });
        }
    } catch (error) {
        console.error('Error during login:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.get('/checkAccount', async (req, res) => {
    const { matricule } = req.query;

    if (!matricule) {
        return res.status(400).json({ error: 'Matricule is required' });
    }

    try {
        const agent = await AgentModel.getAgentByMatricule(matricule);
        

        if (agent) {
            // Génération d'un OTP pour l'agent
            const otp = generateOTP(agent.id);

            // Envoi de l'OTP par email
            await mailService.sendMailOTP(agent, otp);

            return res.status(200).json({
                success: true,
                message: 'Agent found, OTP sent to email',
            })
        } else {
            return res.status(404).json({ success: false, message: 'Agent not found' });
        }
    } catch (error) {
        console.error('Error checking account:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.post('/verifyOTP', async (req, res) => {
    const { matricule, otp } = req.body;
    console.log("Current user : ", { matricule, otp })

    if (!matricule || !otp) {
        return res.status(400).json({ error: 'Matricule and OTP are required' });
    }

    try {
        const agent = await AgentModel.getAgentByMatricule(matricule);

        if (!agent) {
            return res.status(404).json({ success: false, message: 'Agent not found' });
        }

        const storedOtp = otps.find(o => o.id === agent.id && o.otp === otp);

        if (storedOtp) {
            // OTP is valid, remove it from the list
            otps = otps.filter(o => o.id !== agent.id);
            return res.status(200).json({ success: true, message: 'OTP verified successfully' });
        } else {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }
    } catch (error) {
        console.error('Error verifying OTP:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.put('/resetPassword', async (req, res) => {
    const { matricule, col, val } = req.body;

    if (!matricule || !col || !val) {
        return res.status(400).json({ error: 'Matricule, column, and value are required' });
    }

    try {
        const agent = await AgentModel.getAgentByMatricule(matricule);

        if (!agent) {
            return res.status(404).json({ success: false, message: 'Agent not found' });
        }
        const mdp = await hashPassword(val);
        console.log('Updating agent:', agent, 'with column:', col, 'and value:', val);
        const result = await AgentModel.updateAgent(col, mdp, agent.id);
        console.log('Update result:', result);
        if (result) {
            const token = AgentModel.generateToken(agent);

            console.log('Password reset successfully for agent:', agent);
            console.log('Generated token:', token);
            return res.status(200).json({ success: true, message: 'Password reset successfully', data: { agent, token } });
        } else {
            return res.status(500).json({ success: false, message: 'Account updated successfully' });
        }
    } catch (error) {
        console.error('Error updating account:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.use(authenticate); // Applique le middleware d'authentification à toutes les routes suivantes

router.get('/checkAutorization', async (req, res) => {
    try {
        const { session } = req.query;
        const  { user } = req;
        if (!session || !user) {
            return res.status(400).json({ success: false, message: 'Session and user are required' });
        }
        console.log('Checking authorization for session:', session, 'and user:', user);
        // Vérifiez si l'utilisateur a accès à la session
        const hasAccess = await AgentModel.checkUserSession(user.id, session);
        if (!hasAccess) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        return res.status(200).json({ success: true, message: 'Access granted' });

    } catch (error) {
        console.error('Error checking authorization:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
        
    }
});
module.exports = router;