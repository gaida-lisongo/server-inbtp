/**
 * Export all font configurations.
 * @module config/fonts
 */

const path = require('path');
const fonts = {
    Roboto: {
        normal: path.join(__dirname, 'Roboto-Regular.ttf'),
        bold: path.join(__dirname, 'Roboto-Bold.ttf'),
        italics: path.join(__dirname, 'Roboto-Italic.ttf'),
        bolditalics: path.join(__dirname, 'Roboto-BoldItalic.ttf')
    }
};

module.exports = fonts;