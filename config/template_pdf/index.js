const path = require('path');
const fs = require('fs');

const pdfsCover = {
    carnetInbtp: path.resolve(
        __dirname, 'cover-pdf.pdf'
    )
}

const pdfsCoverBase64 = {
    carnetInbtp: fs.readFileSync(pdfsCover.carnetInbtp).toString('base64')
}

module.exports = {
    pdfsCover,
    pdfsCoverBase64
}
