const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt.config');

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

module.exports = {
    authenticate
}