const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt.config');
const { AgentModel } = require('../models')
require('dotenv').config();

async function hashPassword(password) {
    // crypte le mot de passe avec SHA-256
    return crypto.createHash('sha256').update(password).digest('hex');
}

async function generatePassword() {
    // génère un mot de passe aléatoire de 8 caractères
    return crypto.randomBytes(4).toString('hex');
}

const verifyToken = (token) => {
    try {
        if (!token) {
            return { error: 'No token provided' };
        }
        console.log('Verifying token:', token);
        const decoded = jwt.verify(token, jwtConfig.secret);
        console.log('Token decoded successfully:', decoded);
        return decoded;
    } catch (error) {
        console.error('Token verification failed:', error);
        return { error: 'Invalid token' };
    }
};

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
            return res.status(200).json({ success: true, message: 'Agent found', data: agent });
        } else {
            return res.status(404).json({ success: false, message: 'Agent not found' });
        }
    } catch (error) {
        console.error('Error checking account:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.put('/updateAccount', async (req, res) => {
    const { matricule, col, val } = req.body;

    if (!matricule || !col || !val) {
        return res.status(400).json({ error: 'Matricule, column, and value are required' });
    }

    try {
        const agent = await AgentModel.getAgentByMatricule(matricule);

        if (!agent) {
            return res.status(404).json({ success: false, message: 'Agent not found' });
        }

        const result = await AgentModel.updateAgent(col, val, agent.id);

        if (result) {
            return res.status(200).json({ success: true, message: 'Account updated successfully' });
        } else {
            return res.status(500).json({ success: false, message: 'Failed to update account' });
        }
    } catch (error) {
        console.error('Error updating account:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;