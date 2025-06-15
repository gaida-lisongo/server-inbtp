const express = require('express');
const router = express.Router();
const { UserModel } = require('../models');
const crypto = require('crypto');
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
        const user = await UserModel.getUserByAuth({ matricule, mdp: hashedPassword });

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

        const isValidMatricule = await UserModel.getUserByMatricule(matricule);
        const { rows, count } = isValidMatricule;
        if (rows.length === 0) {
            console.error('User not found for matricule:', matricule);
            return res.status(404).json({ error: 'User not found' });
        }

        
        const etudiant = rows[0];
        
        const newPassword = await generatePassword();
        const hashedPassword = await hashPassword(newPassword);
        const result = await UserModel.updatePassword({ etudiantId: etudiant.id, mdp: hashedPassword });
        console.log('Password update result:', result);
        
        // if (!result) {
        //     return res.status(404).json({ error: 'User not found' });
        // }

        // Ici, vous pouvez envoyer le nouveau mot de passe par email ou autre moyen
        res.json({ message: 'Password reset successfully', success: true, data:{
            etudiant: etudiant,
            newPassword: newPassword
        } });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Dans les routes qui suivent nous devons au préalable verifier que l'utilisateur est authentifié
 * et que le token JWT est valide.
 * Pour cela, nous allons créer un middleware qui va vérifier le token JWT, grâce à la fonction verifyToken.
 */

async function authenticate(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1]; // Récupère le token depuis l'en-tête Authorization

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = await verifyToken(token);
        req.user = decoded; // Ajoute l'utilisateur décodé à la requête
        next(); // Passe au middleware suivant ou à la route
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

router.use(authenticate); // Applique le middleware d'authentification à toutes les routes suivantes
router.get('/profile', async (req, res) => {
    try {
        const user = await UserModel.getUserByMatricule(req.user.matricule);
        if (user.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user[0]);
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;