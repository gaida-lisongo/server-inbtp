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
const { table } = require('console');
const { text } = require('stream/consumers');

// Créer l'instance de PdfPrinter avec les polices
const printer = new PdfPrinter(fonts);

// Fonction pour générer le PDF avec pdfmake
async function generatePdf(docDefinition) {
  return new Promise((resolve, reject) => {
    try {
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const chunks = [];

      pdfDoc.on('data', chunk => {
        chunks.push(chunk);
      });

      pdfDoc.on('error', error => {
        reject(error);
      });

      pdfDoc.on('end', () => {
        const result = Buffer.concat(chunks);
        resolve(result);
      });

      pdfDoc.end();
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      console.error('Stack trace:', error.stack);
      reject(error);
    }
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
        const contentPages = await mergedPdf.copyPages(existingPdf, existingPdf.getPageIndices());

        mergedPdf.addPage(coverPage);
        contentPages.forEach(page => mergedPdf.addPage(page));

        const mergedPdfBytes = await mergedPdf.save();

        return mergedPdfBytes;
    } catch (error) {
        console.error('Error generating cover PDF:', error);
        throw new Error('Erreur lors de la génération de la page de couverture : ' + error.message);
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
    const payload = {
        anneeId: annee,
        matricule,
        promotionId,
        type
    }   

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
        
        const infoNotes = await App.getNotesEtudiant(payload);

        if (!infoNotes || !infoNotes.data) {
            throw new Error('Aucune donnée trouvée pour cet étudiant');
        }

        const { status, message, data } = infoNotes;
        
        if (!data.etudiant || !data.promotion || !data.annee) {
            throw new Error('Données incomplètes pour générer le bulletin');
        }

        const { commande, annee, etudiant, matieres, promotion } = data;
        const ecues =  matieres.map(matiere => {
            const cotes = matiere.notes.map(note => {
                let manque = false;
                let total = null;
                let totalP = null;
                let cmi = null;

                if(note.cote) {
                    const cote = note.cote;

                    cmi = (cote.tp ? parseFloat(cote.tp) : 0.0 ) + ( cote.td ? parseFloat(cote.td) : 0.0);
                    
                    const examen = cote?.examen ? parseFloat(cote.examen) : null;
                    const rattrapage = cote?.rattrapage ? parseFloat(cote.rattrapage) : null;

                    manque = examen || rattrapage ? false : true;

                    if (!manque) {
                        total = parseFloat(cmi + cote.examen) > parseFloat(cote.rattrapage ? cote.rattrapage : '0') ? parseFloat(cmi) + parseFloat(cote.examen) : parseFloat(cote.rattrapage ? cote.rattrapage : '0');
                        totalP = parseFloat(note.credit) * total;

                    }
                    return {
                        cours: note.titre,
                        cmi,
                        examen : cote.examen,
                        rattrapage: cote.rattrapage,
                        total,
                        credit: note.credit,
                        totalP
                    }
                } else {
                    return {
                        cours: note.titre,
                        cmi,
                        examen :null,
                        rattrapage: null,
                        total,
                        credit: note.credit,
                        totalP
                    }
                }

            });

            const unite = {
                code: matiere.code,
                designation: matiere.designation,
                notes: cotes
            }
            return unite
        })
          let tableRows = [];

        ecues.forEach(unite => {
            let totalUe = 0;
            let creditUe = 0;
            let totalPUe = 0;

            // Ajouter d'abord les lignes de notes individuelles
            unite.notes.forEach(ec => {
                totalPUe += ec.totalP || 0;
                creditUe += ec.credit || 0;
                
                tableRows.push([
                    { text: ec.cours || '', alignment: 'left' },
                    { text: ec.cmi || '-', alignment: 'center' },
                    { text: ec.examen || '-', alignment: 'center' },
                    { text: ec.rattrapage || '-', alignment: 'center' },
                    { text: ec.credit || '0', alignment: 'center' },
                    { text: ec.total || '-', alignment: 'center' },
                    { text: ec.totalP || '-', alignment: 'center' }
                ]);
            });

            // Calculer la moyenne de l'UE
            totalUe = creditUe ? (totalPUe / creditUe).toFixed(2) : '0.00';

            // Ajouter la ligne de résumé de l'UE
            tableRows.push([
                { text: `${unite.designation} (${unite.code})`, colSpan: 4, style: 'tableHeader', alignment: 'left' },
                '', '', '',
                { text: creditUe.toString(), style: 'tableHeader', alignment: 'center' },
                { text: totalUe.toString(), style: 'tableHeader', alignment: 'center' },
                { text: totalPUe.toFixed(2), style: 'tableHeader', alignment: 'center' }
            ]);
        })

        const rowsTab = rows;

        console.log("Rows : ", ...[...rowsTab.map(row => row)])
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
                                { text:  `JURY ${promotion.section}`, style: { fontSize: 12, bold: true, alignment: 'center' } },
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
                            width: '40%',
                            stack: [
                                ""
                            ]
                        },
                        {
                            width: '*',
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
                },                {
                    table: {
                        headerRows: 1,
                        widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
                        body: [
                            [
                                {text: 'Elément Constitutif', style: 'tableHeader', alignment: 'left'}, 
                                {text: 'CMI', style: 'tableHeader', alignment: 'center'}, 
                                {text: 'EXM', style: 'tableHeader', alignment: 'center'}, 
                                {text: 'RTP', style: 'tableHeader', alignment: 'center'}, 
                                {text: 'CRD', style: 'tableHeader', alignment: 'center'}, 
                                {text: '/20', style: 'tableHeader', alignment: 'center'}, 
                                {text: 'Total', style: 'tableHeader', alignment: 'center'}
                            ],
                            ...tableRows
                        ],
                        layout: {
                            hLineWidth: function(i, node) {
                                return 0.5;
                            },
                            vLineWidth: function(i, node) {
                                return 0.5;
                            },
                            hLineColor: function(i, node) {
                                return '#aaa';
                            },
                            vLineColor: function(i, node) {
                                return '#aaa';
                            },
                            paddingLeft: function(i, node) { return 4; },
                            paddingRight: function(i, node) { return 4; },
                            paddingTop: function(i, node) { return 2; },
                            paddingBottom: function(i, node) { return 2; }
                        }
                    }
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
                    margin: [0, 5, 0, 1]
                },            
                title: {
                    fontSize: 12,
                    bold: true,
                    margin: [0, 10, 0, 1],
                    color: '#000000'
                },
                tableHeader: {
                    bold: true,
                    fillColor: '#eeeeee',
                    color: '#0000',
                    alignment: 'center'
                }
            }
        };
     
        console.log('Début de la génération du bulletin...');
        const pdfBulletin = await generatePdf(docDefinition);
        
        if (!pdfBulletin || pdfBulletin.length === 0) {
            throw new Error('Le PDF généré est vide');
        }
        
        console.log('PDF bulletin généré avec succès, taille:', pdfBulletin.length);
        
        const nomComplet = `${etudiant.nom} ${etudiant.post_nom} ${etudiant.prenom ? etudiant.prenom : ''}`;
        console.log('Ajout de la page de couverture pour:', nomComplet);
        
        const bulletin = await addCoverToPdf(pdfBulletin, nomComplet);
        
        if (!bulletin || bulletin.length === 0) {
            throw new Error('Le PDF final est vide après ajout de la couverture');
        }
        
        console.log('PDF final généré avec succès, taille:', bulletin.length);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=${matricule}.pdf`);
        res.setHeader('Content-Length', bulletin.length);
        
        try {
            res.send(Buffer.from(bulletin));
            console.log('PDF envoyé avec succès');
        } catch (sendError) {
            console.error('Erreur lors de l\'envoi du PDF:', sendError);
            throw sendError;
        }
    } catch (error) {
        console.log('Error info : ', error);
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