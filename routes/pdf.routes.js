const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const PdfPrinter = require('pdfmake');
const { PDFDocument } = require('pdf-lib'); // Import pdf-lib if needed for additional PDF functionalities
const fonts = require('../config/fonts'); // Assuming fonts are in config/fonts directory
const { imagesIstaBase64 } = require('../config/images'); // Assuming images are in config/images directory
const { pdfsCover, pdfsCoverBase64 } = require('../config/template_pdf'); // Assuming template PDFs are in config/template_pdf directory

const printer = new PdfPrinter(fonts);

const generatePdfListe = async () => {
    const docDefinition = {
        defaultStyle: {
            font: 'Roboto'
        },
        content: [
            { text: 'Fiche de Programme', style: 'header' },
            {
                columns: [
                    {
                        width: '60%',
                        stack: [
                            {
                                ul: [
                                    'Programme: _____________',
                                    'Mention: _____________',
                                    'Chef de Section: _____________',
                                    'Année Académique: _____________',
                                    'Nombre d\'Etudiants: _____________'
                                ],
                                style: 'subheader'
                            },
                            {
                                text: 'Liste des Cours:',
                                style: 'subheader',
                                margin: [0, 10, 0, 5]
                            },
                            {
                                ol: [
                                    'Cours 1: _____________',
                                    'Cours 2: _____________',
                                    'Cours 3: _____________',
                                    'Cours 4: _____________'
                                ]
                            }
                        ]

                    },
                    {
                        width: '40%',
                        stack: [
                            { text: 'Informations Générales', style: 'subheader' },
                            { text: 'Date: _____________', margin: [0, 5, 0, 0] },
                            { text: 'Responsable: _____________', margin: [0, 5, 0, 0] }
                        ]
                    }
                ]
            },
            {
                text: 'Notes Importantes:', 
                style: 'subheader', 
                margin: [0, 10, 0, 5] 
            },
            {
                text: '____________________________________________________________________________________',
                margin: [0, 5, 0, 5]    
            },            {
                text: 'Bonne chance pour votre programme !',
                alignment: 'center',
                margin: [0, 20, 0, 0]
            }
        ],
        background: (currentPage, pageSize) => {
            return {
                image: `data:image/png;base64,${imagesIstaBase64.logo}`,
                width: 800,
                opacity: 0.1,
                absolutePosition: {
                    x: (pageSize.width - 800)/2, // Center the image horizontally
                    y: (pageSize.height - 800)/2 // Center the image vertically
                }
            }
        },
        styles: {
            header: {
                fontSize: 18,
                bold: true,
                alignment: 'center',
                margin: [0, 0, 0, 20]
            },
            subheader: {
                fontSize: 14,
                margin: [0, 10, 0, 5],
                italics: true,
            }
        }
    }

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    return pdfDoc;
}

const generatePdfEntete = async () => {
    const docDefinition = {
        defaultStyle: {
            font: 'Roboto'
        },
        content: [
            {
                columns: [
                    {
                        width: '40%',
                        stack: [
                            { text: 'République Démocratique du Congo', style: { fontSize: 12, bold: true, alignment: 'center' } },
                            { text: 'Ministère de l\'Enseignement Supérieur et Universitaire', style: { fontSize: 10, italics: true, alignment: 'center' } },
                            { 
                                image: `data:image/png;base64,${imagesIstaBase64.logoIsta}`,
                                width: 100,
                                height: 100,
                                alignment: 'center',
                                margin: [0, 0, 0, 0]
                            },
                            { text: 'Institut Supérieur des Techniques Appliquées', style: { fontSize: 10, italics: true, alignment: 'center' } },
                            { text: 'ISTA/GM à Mbanza-Ngungu', style: { fontSize: 10, italics: true, alignment: 'center' } },
                            { text: 'Secrétariat Général Académique', style: { fontSize: 12, bold: true, alignment: 'center' } },
                        ]

                    },                    
                    {
                        width: '*',
                        stack: [
                            { 
                                text: 'FICHE DE PROGRAMME', 
                                style: 'title',
                                alignment: 'right'
                            },
                            { 
                                text: [
                                    { text: 'Année Académique: ', bold: true },
                                    '_____________'
                                ],
                                style: 'subheader',
                                alignment: 'right'
                            },
                            { 
                                text: [
                                    { text: 'Mention: ', bold: true },
                                    '_____________'
                                ],
                                style: 'subheader',
                                alignment: 'right'
                            },
                            { 
                                text: [
                                    { text: 'Chef de Section: ', bold: true },
                                    '_____________'
                                ],
                                style: 'subheader',
                                alignment: 'right'
                            }
                        ],
                        margin: [0, 0, 0, 0]
                    }
                ]
            },
            {
                text: 'Contenu du Programme',
                style: 'title',
                alignment: 'center',
            }
        ],
        background: (currentPage, pageSize) => {
            return {
                text: 'Institut Supérieur des Techniques Appliquées',
                fontSize: 60,
                color: '#cccccc',
                opacity: 0.2,
                bold: true,
                alignment: 'center',
                margin: [0, 200]
            }
        },
        styles: {
            header: {
                fontSize: 13,
                bold: true,
                alignment: 'center',
                margin: [0, 0, 0, 10]
            },
            subheader: {
                fontSize: 12,
                italics: true,
                margin: [0, 5, 0, 5]
            },            
            title: {
                fontSize: 12,
                bold: true,
                margin: [0, 10, 0, 20],
                color: '#000000'
            }
        }
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    return pdfDoc;
}

const generateSimpleTable = async () => {
    

    const docDefinition = {
        content: [
            {
                text: 'Fusion des cellules (colSpan et rowSpan)',
                style: 'header'
            },
            {
                table: {
                    headerRows: 1,
                    body: [
                        [
                            { text: 'Catégorie', style: 'tableHeader' },
                            { text: 'Produit', style: 'tableHeader' },
                            { text: 'Couleur', style: 'tableHeader' },
                            { text: 'Prix', style: 'tableHeader' }
                        ],
                        [
                            { text: 'Fruits', rowSpan: 2 }, // fusion sur 2 lignes verticalement
                            'Pomme',
                            'Rouge',
                            '1.5 $'
                        ],
                        [ '', 'Banane', 'Jaune', '0.75 $' ], // cellule vide à cause de rowSpan
                        [
                            { text: 'Ligne fusionnée sur 3 colonnes', colSpan: 3, fillColor: '#eeeeee' },
                            '', '',
                            'Note'
                        ]
                    ]
                },
                layout: 'lightHorizontalLines'
            },
            {
                table: {
                    headerRows: 1,
                    body: [
                        [
                            { text: 'Groupe', rowSpan: 2, style: 'tableHeader' },
                            { text: 'Sous-groupe', colSpan: 2, style: 'tableHeader' }, '',
                            { text: 'Score', rowSpan: 2, style: 'tableHeader' }
                        ],
                        [ '', 'A', 'B', '' ],
                        [ '1', 'Alpha', 'Beta', '80%' ],
                        [ '2', 'Gamma', 'Delta', '92%' ]
                    ]
                },
                layout: {
                    fillColor: (rowIndex, node, columnIndex) => {
                        return rowIndex % 2 === 0 ? '#f2f2f2' : null; // Alternating row colors
                    },
                    hLineWidth: () => 1,
                    vLineWidth: () => 1,
                    hLineColor: () => '#000000',
                    vLineColor: () => '#000000',
                    paddingLeft: () => 4,
                    paddingRight: () => 4,
                    paddingTop: () => 2,
                    paddingBottom: () => 2
                }
            },
            {
                table: {
                    body: [
                        [
                            { text: 'Nom', style: 'tableHeader' },
                            { text: 'Détails', style: 'tableHeader' }
                        ],
                        [
                            'Tshibola',
                            {
                                table: {
                                    body: [
                                        [ { text: 'Cours', bold: true }, { text: 'Note', bold: true } ],
                                        [ 'Math', '17' ],
                                        [ 'Info', '15' ]
                                    ]
                                }
                            }
                        ]
                    ]
                }
            }
        ],
        styles: {
            header: {
                fontSize: 16,
                bold: true,
                margin: [0, 0, 0, 10]
            },
            tableHeader: {
                bold: true,
                fillColor: '#eeeeee',
                color: '#000000'
            }
        }
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    return pdfDoc;
}


// Fonction pour générer le PDF avec pdfmake
function generatePdf(docDefinition) {
  return new Promise((resolve, reject) => {
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const chunks = [];

    pdfDoc.on('data', chunk => chunks.push(chunk));
    pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
    pdfDoc.end();
  });
}

// Route pour afficher le PDF sans mot de passe
router.get('/view', async (req, res) => {
  const docDefinition = {
    content: [
      { text: 'Document sans mot de passe', style: 'header' },
      'Ce document est affiché sans protection.'
    ],
    styles: {
      header: {
        fontSize: 18,
        bold: true
      }
    }
  };

  try {
    const pdfBuffer = await generatePdf(docDefinition);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="document.pdf"');
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).send('Erreur lors de la génération du PDF.');
  }
});

// Route pour télécharger le PDF avec mot de passe
router.get('/download', async (req, res) => {
  const docDefinition = {
    content: [
      { text: 'Document protégé par mot de passe', style: 'header' },
      'Ce document nécessite un mot de passe pour être ouvert.'
    ],
    styles: {
      header: {
        fontSize: 18,
        bold: true
      }
    }
  };

  try {
    const pdfBuffer = await generatePdf(docDefinition);

    // Charger le PDF avec pdf-lib
    const pdfDoc = await PDFDocument.load(pdfBuffer);

    // Définir le mot de passe et les permissions
    pdfDoc.encrypt({
      userPassword: 'motdepasse123',
      ownerPassword: 'admin123',
      permissions: {
        printing: 'highResolution',
        modifying: false,
        copying: false,
        annotating: false,
        fillingForms: false,
        contentAccessibility: false,
        documentAssembly: false
      }
    });

    const encryptedPdfBytes = await pdfDoc.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="document_protege.pdf"');
    res.send(Buffer.from(encryptedPdfBytes));
  } catch (err) {
    res.status(500).send('Erreur lors de la génération du PDF protégé.');
  }
});


router.get('/', async (req, res) => {
    try {
        const pdfDoc = await generatePdfListe();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=programme.pdf');

        pdfDoc.pipe(res);
        pdfDoc.end();
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('Error generating PDF');
    }
});

router.get('/entete', async (req, res) => {
    try {
        const pdfDoc = await generatePdfEntete();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=entete_programme.pdf');

        pdfDoc.pipe(res);
        pdfDoc.end();
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('Error generating PDF');
    }
});

router.get('/table', async (req, res) => {
    try {
        const pdfDoc = await generateSimpleTable();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=simple_table.pdf');

        pdfDoc.pipe(res);
        pdfDoc.end();
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('Error generating PDF');
    }
});

router.get('/cover/:name', async (req, res) => {
    const coverName = req.params.name;
    
    /**
     * Avec pdf-lib ouvrir le PDF de couverture et placer le nom
     */

    try {
        const coverPdf = await PDFDocument.load(pdfsCoverBase64.carnetIsta);
        const page = coverPdf.getPage(0);
        const nameFormat = coverName.split(' ');
        
        // Formater avec pour chaque item un retour à la ligne
        const nameUser = nameFormat.map((item, index) => {
            return item.charAt(0).toUpperCase() + item.slice(1).toLowerCase();
        }).join('\n\n');

        // Ajouter le nom sur la couverture
        page.drawText(nameUser, {
            x: 50,
            y: 180,
            size: 35
        });

        const pdfBytes = await coverPdf.save();
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=${coverName}.pdf`);
        res.send(Buffer.from(pdfBytes));
    } catch (error) {
        console.error('Error generating cover PDF:', error);
        res.status(500).send('Error generating cover PDF');
    }
})
module.exports = router;