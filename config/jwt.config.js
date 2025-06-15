const config = {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: '1h',
    algorithm: 'HS256'
};

module.exports = config;