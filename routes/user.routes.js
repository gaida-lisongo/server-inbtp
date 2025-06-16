const express = require('express');
const router = express.Router();
const { UserModel } = require('../models');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt.config');
require('dotenv').config(); // Assurez-vous que dotenv est configuré pour charger les variables d'environnement
const saveImage = require('../utils/saveImage');
const multer = require('multer');

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

async function generateToken(user) {
    console.log('Generating token for user:', user);
    // génère un token JWT
    return jwt.sign({ id: user.id, matricule: user.matricule }, process.env.JWT_SECRET || 'default_secret', { expiresIn: '1h' });
}

async function convertBufferToBase64(buffer) {
    // Convertit un buffer en base64
    return buffer.toString('base64');
}

async (userId)  => {
    try {
        const commandes = await UserModel.getCommandesByUserId(userId);
        return commandes;
    } catch (error) {
        console.error('Error fetching user commandes:', error);
        throw new Error('Failed to fetch user commandes');
    }
}

router.post('/login', async (req, res) => {
    try {
        const { matricule, mdp } = req.body;

        if (!matricule || !mdp) {
            return res.status(400).json({ error: 'Matricule and password are required' });
        }

        const hashedPassword = await hashPassword(mdp);
        const response = await UserModel.getUserByAuth({ matricule, mdp: hashedPassword });
        
        res.json({ success: true, message: "User authenticated successfully", data: response });
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
    console.log('Authenticating user...');
    console.log('Headers:', req.headers);
    const token = req.headers['authorization']?.split(' ')[1]; // Récupère le token depuis l'en-tête Authorization
    console.log('Token:', token);
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

const storage = multer.memoryStorage(); // Stockage en mémoire pour les images
const upload = multer({ storage: storage });

router.post('/photo/:id', upload.single('avatar'), async (req, res) => {
    try {
        const userId = req.params.id;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const base64Image = await convertBufferToBase64(file.buffer);
        const photoUrl = await saveImage(base64Image);
        
        console.log('Photo uploaded successfully:', photoUrl);
        const {count, rows} = await UserModel.updatePhotoUser({ etudiantId: userId, avatar: photoUrl });

        if (!rows || rows.length === 0) {
            console.error('User not found for ID:', userId);
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ success: true, message: 'La photo a été mise à jour avec succès', data: { userId, photoUrl } });

    } catch (error) {
        console.error('Error updating photo:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/update/:id'
    , async (req, res) => {
    try {
        const userId = req.params.id;
        const { info, value } = req.body;
        if (!info || !value) {
            return res.status(400).json({ error: 'Info and value are required' });
        }

        let chmaps = {
            'nom': 'nom',
            'postnom': 'post_nom',
            'prenom': 'prenom',
            'sexe': 'sexe',
            'datenaissance': 'date_naiss',
            'lieunaissance': 'lieu_naissance',
            'email': 'e_mail',
            'telephone': 'telephone',
            'adresse': 'adresse'
        };

        if (!chmaps[info]) {
            return res.status(400).json({ error: 'Invalid info field' });
        }

        const dbField = chmaps[info];
        const {rows, count} = await UserModel.updateUser(dbField, value, userId);
        
        if (!rows || rows.length === 0) {
            console.error('User not found for ID:', userId);
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ success: true, message: 'User updated successfully' });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

route.post('/password/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const { matricule, oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword || !matricule) {
            return res.status(400).json({ error: 'Old and new passwords are required' });
        }

        const hashedOldPassword = await hashPassword(oldPassword);
        const {rows, count } = await UserModel.getUserByAuth({ matricule, mdp: hashedOldPassword });

        if (!rows || rows.length === 0) {
            return res.status(401).json({ error: 'Invalid old password' });
        }

        const hashedNewPassword = await hashPassword(newPassword);
        const result = await UserModel.updateUser('mdp', hashedNewPassword, userId);
        console.log('Password update result:', result);

        if (!result.rows || result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;