const path = require('path');
const fs = require('fs');

const imagesIsta = {
    logo: path.resolve(__dirname, 'logo-ista.png'),
    logoIsta: path.resolve(__dirname, 'ista-logo.png'),
}

const imagesIstaBase64 = {
    logo: fs.readFileSync(imagesIsta.logo).toString('base64'),
    logoIsta: fs.readFileSync(imagesIsta.logoIsta).toString('base64'),
}

module.exports = {
    imagesIsta,
    imagesIstaBase64
}