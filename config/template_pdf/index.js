const path = require('path');
const fs = require('fs');

const pdfsCover = {
    carnetIsta: path.resolve(
        __dirname, 'page_garde_carnet.pdf'
    )
}

const pdfsCoverBase64 = {
    carnetIsta: fs.readFileSync(pdfsCover.carnetIsta).toString('base64')
}

module.exports = {
    pdfsCover,
    pdfsCoverBase64
}
