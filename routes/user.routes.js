const express = require('express');
const router = express.Router();
const { UserModel } = require('../models');
const crypto = require('crypto');
const userModel = new UserModel();
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Assurez-vous que dotenv est configuré pour charger les variables d'environnement

async function hashPassword(password) {
    // crypte le mot de passe avec SHA-256
    return crypto.createHash('sha256').update(password).digest('hex');
}

async function generatePassword() {
    // génère un mot de passe aléatoire de 8 caractères
    return crypto.randomBytes(4).toString('hex');
}

async function verifyToken(token) {
    // vérifie le token JWT
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded;
    } catch (error) {
        console.error('Token verification failed:', error);
        throw new Error('Invalid token');
    }
}

async function generateToken(user) {
    // génère un token JWT
    return jwt.sign({ id: user.id, matricule: user.matricule }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

router.post('/login', async (req, res) => {
    try {
        const { matricule, mdp } = req.body;

        if (!matricule || !mdp) {
            return res.status(400).json({ error: 'Matricule and password are required' });
        }

        const hashedPassword = await hashPassword(mdp);
        const user = await userModel.getUserByAuth({ matricule, mdp: hashedPassword });

        if (user.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = await generateToken(user[0]);
        res.json({ token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/reset-password', async (req, res) => {
    try {
        const { matricule } = req.body;
        if (!matricule) {
            return res.status(400).json({ error: 'Matricule is required' });
        }

        const isValidMatricule = await userModel.getUserByMatricule(matricule);
        const { row, count } = isValidMatricule;
        if (count === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        console.log('User found:', row[0]);
        
        const etudiant = row[0];
        if (!etudiant) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const newPassword = await generatePassword();
        const hashedPassword = await hashPassword(newPassword);
        const result = await userModel.updatePassword({ etudiantId: etudiant.id, mdp: hashedPassword });

        if (!result) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Ici, vous pouvez envoyer le nouveau mot de passe par email ou autre moyen
        res.json({ message: 'Password reset successfully', newPassword });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});