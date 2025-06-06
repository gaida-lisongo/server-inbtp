const express = require('express');
const router = express.Router();
const { App } = require('../controllers')
const fs = require('fs');
const path = require('path');
const PdfPrinter = require('pdfmake');
const { PDFDocument } = require('pdf-lib');
const fonts = require('../config/fonts');
const { imagesIstaBase64 } = require('../config/images');
const { pdfsCover, pdfsCoverBase64 } = require('../config/template_pdf');


// Fonction pour générer le PDF avec pdfmake
async function generatePdf(docDefinition) {
  return new Promise((resolve, reject) => {
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const chunks = [];

    pdfDoc.on('data', chunk => chunks.push(chunk));
    pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
    pdfDoc.end();
  });
}

async function addCoverToPdf(pdfBuffer, coverName=""){
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

        //Merge this PDF with the Pdf generate by pdfmake (pdfBuffer)
        const existingPdf = await PDFDocument.load(pdfBuffer);
        const mergedPdf = await PDFDocument.create();
        const [coverPage] = await mergedPdf.copyPages(coverPdf, [0]);
        const [existingPage] = await mergedPdf.copyPages(existingPdf, [0]);
        mergedPdf.addPage(coverPage);
        mergedPdf.addPage(existingPage);

        const mergedPdfBytes = await mergedPdf.save();

        return mergedPdfBytes;
    } catch (error) {
        console.error('Error generating cover PDF:', error);
        res.status(500).send('Error generating cover PDF');
    }


}

router.get('/welcome', (req, res) => {
    res.send('Welcome to the Home Page');
});

router.get('/', async (req, res) => {
    try {
        const data = await App.programmes();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching programmes', error });
    }
})

router.get('/section/:id', async (req, res) => {
    const sectionId = req.params.id;
    try {
        const data = await App.programme(sectionId);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching section', error });
    }

})

router.get('/annees', async (req, res) => {
    try {
        const data = await App.annees();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching annees', error });
    }
})

router.get('/annee/:id', async (req, res) => {
    const anneeId = req.params.id;
    try {
        const data = await App.annee(anneeId);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching annee', error });
    }
})

router.get('/current-annee', async (req, res) => {
    try {
        const data = await App.currentAnnee();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching current annee', error });
    }
})  

router.get('/promotions', async (req, res) => {
    try {
        const data = await App.promotions();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching promotions', error });
    }
})

router.get('/promotions-section/:id', async (req, res) => {
    const sectionId = req.params.id;
    try {
        const data = await App.promotionsBySection(sectionId);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching promotions by section', error });
    }
})

router.get('/promotion/:id', async (req, res) => {
    const promotionId = req.params.id;
    try {
        const data = await App.promotion(promotionId);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching promotion', error });
    }
})

router.post('/checkResultat', async (req, res) => {
    const { annee, matricule, promotionId, type } = req.body;
    
    const title = type => {
        switch (type) {
            case 'S1':

                return 'Bulletin du Premier Semestre';                
                break;
            
            case 'S2':
                return 'Bulletin du Second Semestre';
                break;
        
            default:
                return "Bulletin Annuel"
                break;
        }
    }

    try {
        const payload = {
            anneeId: annee,
            matricule,
            promotionId,
            type
        }
        const infoNotes = await App.getNotesEtudiant(payload);

        const { status, message, data } = infoNotes;
        const { commande, annee : currentAnnee, etudiant, matieres, promotion } = data;
        
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
                                    text: `N/Ref: ${commande.id_etudiant}/${commande.id_promotion}/${commande.id}/${new Date().getTime()}`, 
                                    style: 'title',
                                    alignment: 'right'
                                },
                            ],
                            margin: [0, 0, 0, 0]
                        }
                    ]
                },
                {
                    columns: [
                        {
                            width: '50%',
                        },
                        {
                            width: '50%',
                            stack: [
                                { 
                                    text: `${etudiant.nom} ${etudiant.post_nom} ${etudiant.prenom ? etudiant.prenom : ''}`, 
                                    style: 'title',
                                    alignment: 'right'
                                },
                                { 
                                    text: [
                                        { text: 'Année Académique: ', bold: true },
                                        `${annee.debut} - ${annee.fin}`
                                    ],
                                    style: 'subheader',
                                    alignment: 'right'
                                },
                                { 
                                    text: [
                                        { text: 'Section: ', bold: true },
                                        `${promotion.section}`
                                    ],
                                    style: 'subheader',
                                    alignment: 'right'
                                },
                                { 
                                    text: [
                                        { text: 'Niveau: ', bold: true },
                                        `${promotion.niveau}`
                                    ],
                                    style: 'subheader',
                                    alignment: 'right'
                                },
                                { 
                                    text: [
                                        { text: 'Système: ', bold: true },
                                        `${promotion.systeme}`
                                    ],
                                    style: 'subheader',
                                    alignment: 'right'
                                }

                            ]
                        }
                    ]
                },
                {
                    text: `${title(type)}`,
                    style: 'title',
                    alignment: 'center',
                }
            ],
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

        console.log("Document description : ", ...docDefinition.content);


        const pdfBulletin = await generatePdf(docDefinition);
        console.log('Pdf Generate :', pdfBulletin);
        const bulletin = await addCoverToPdf(pdfBulletin, `${etudiant.nom} ${etudiant.post_nom} ${etudiant.prenom ? etudiant.prenom : ''}`);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=${matricule}.pdf`);
        res.send(Buffer.from(bulletin));
    } catch (error) {
        res.status(500).json({ message: 'Error checking result', error });
    }

})


router.post('/message-section', async (req, res) => {
    const { nom, email, objet, contenu, sectionId } = req.body;
    try {
        const data = await App.addMessageSection({ nom, email, objet, contenu, sectionId });
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Error adding message to section', error });
    }
})

module.exports = router;