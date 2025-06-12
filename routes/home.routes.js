const express = require('express');
const router = express.Router();
const { App } = require('../controllers');
const AppModel = require('../models/AppModel');
const appModel = new AppModel();
const fs = require('fs');
const path = require('path');
const PdfPrinter = require('pdfmake');
const { PDFDocument } = require('pdf-lib');
const fonts = require('../config/fonts');
const { imagesIstaBase64 } = require('../config/images');
const { pdfsCover, pdfsCoverBase64 } = require('../config/template_pdf');
const saveImage = require('../utils/saveImage');
const multer = require('multer');
const pdfApi = require('../utils/cloudPdf');
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

router.get('/welcome', async (req, res) => {
    const uploadPdfForm = `
    <form action="/api/home/upload-pdf" method="post" enctype="multipart/form-data">
        <input type="file" name="pdfFile" accept="application/pdf" />
        <button type="submit">Upload PDF</button>
    </form>
    <script>
        document.querySelector('form').addEventListener('submit', function(event) {
            event.preventDefault();
            const formData = new FormData(this);
            fetch('/api/home/upload-pdf', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('PDF uploaded successfully!');
                } else {
                    alert('Error uploading PDF: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while uploading the PDF.');
            });
        });
        document.querySelector('form').style.display = 'block';
    </script>
    `;
    res.send('Welcome to the Home Page<br>' + uploadPdfForm);

});

router.post('/upload-pdf', multer().single('pdfFile'), async (req, res) => {
    if (!req.file || req.file.mimetype !== 'application/pdf') {
        return res.status(400).json({ success: false, message: 'Please upload a valid PDF file.' });
    }

    /**
     * Other data from form are: edit-objectif, edit-place-ec, edit-penalite-ec, edit-mode-ec, edit-horaire
     * getting these data from req.body in payload const
     */

    let payload = {
        id: req.body['edit-id'],
        objectif: req.body['edit-objectif'],
        place: req.body['edit-place-ec'],
        penalites: req.body['edit-penalite-ec'],
        mode_ens: req.body['edit-mode-ec'],
        horaire: req.body['edit-horaire']
    };

    console.log('Payload:', payload);

    try {
        const fileInfo = await pdfApi.createDocument('test_01');
        console.log('Checking PDF API info : ', fileInfo);

        if (!fileInfo || !fileInfo.uploadUrl || !fileInfo.documentId || !fileInfo.fileId) {
            return res.status(500).json({ success: false, message: 'Failed to create document in CloudPDF.' });
        }

        payload.documentId = fileInfo.documentId;

        const updateResponse = await appModel.updateCharge(payload);

        console.log('Update response:', updateResponse);
        if (!updateResponse || !updateResponse.count) {
            return res.status(500).json({ success: false, message: 'Failed to update charge in database.' });
        }

        const pdfBuffer = req.file.buffer;

        // Upload the PDF to CloudPDF
        const response = await pdfApi.uploadDocument(pdfBuffer, fileInfo.uploadUrl, fileInfo.documentId, fileInfo.fileId);

        res.status(200).json({
            success: true,
            message: 'PDF uploaded successfully',
            data: response
        });
    } catch (error) {
        console.error('Error uploading PDF:', error);
        res.status(500).json({ success: false, message: 'Error uploading PDF', error });
    }
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

router.get('/niveaux', async (req, res) => {
    try {
        const niveaux = await App.niveaux();
        res.status(200).json(niveaux);   
        
    } catch (error) {
        res.status(500).json({ message: 'Error fetching niveaux', error });
        
    }
})

router.get('/metrics', async (req, res) => {
    try {
        const mentions = await appModel.getAllMentions();
        const filieres = await appModel.getProgrammes();
        const etudiants = await appModel.getEtudiants();
        const agents = await appModel.getAgents();

        const { count : countSections } = mentions;
        const { count: countFilieres} = filieres;
        const { count: countEtudiants } = etudiants;
        const { count: countAgents } = agents;

        let metriques = {
            sections: countSections,
            filieres: countFilieres,
            etudiants: countEtudiants,
            agents: countAgents,
        }


        res.status(201).json({
            success: true,
            message: 'Metriques récupérées avec succès',
            data: metriques
        });
    } catch (error) {
        console.error('Error fetching metrics:', error);
        res.status(500).json({ message: 'Error fetching metrics', error });
        return;
        
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
});

router.get('/calendrier', async (req, res) => {
    try {
        const reqCalender = await appModel.getActivites();
        const { rows, count } = reqCalender;
        if (count === 0) {
            return res.status(404).json({ message: 'Aucune activité trouvée' });
        }

        res.status(200).json({
            success: true,
            message: 'Activités récupérées avec succès',
            data: rows
        });
    } catch (error) {
        console.error('Error fetching calendar:', error);
        res.status(500).json({ message: 'Error fetching calendar', error });
    } 
});

router.get('/communiques', async (req, res) => {
    try {
        const communiques = await appModel.getCommuniques();
        const { rows, count } = communiques;
        if (count === 0) {
            return res.status(404).json({ message: 'Aucun communiqué trouvé' });
        }
        res.status(200).json({
            success: true,
            message: 'Communiqués récupérés avec succès',
            data: rows
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching communiques', error });
    }
});

router.get('/communique/:id', async (req, res) => {
    const communiqueId = req.params.id;
    try {
        const data = await appModel.getCommuniqueById(communiqueId);
        if (!data || data.count === 0) {
            return res.status(404).json({ message: 'Communiqué non trouvé' });
        }
        res.status(200).json({
            success: true,
            message: 'Communiqué récupéré avec succès',
            data: data.rows[0]
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching communique', error });
    }
});

router.get('/matiere/:id', async (req, res) => {
    const matiereId = req.params.id;

    try {
        const {rows : anneeData, count } = await appModel.getCurrentAnnee();
        if (count === 0) {
            return res.status(404).json({ message: 'Aucune année trouvée' });
        }

        const annee = anneeData[0];

        const { rows: matiereData, count: matiereCount } = await appModel.getMatiereById(matiereId);

        if (matiereCount === 0) {
            return res.status(404).json({ message: 'Matière non trouvée' });
        }

        const matiere = matiereData[0];

        const { rows: chargeData, count: chargeCount } = await appModel.getChargeByMatiere({matiereId: matiere.id, anneeId: annee.id});

        if (chargeCount === 0) {
            return res.status(404).json({ message: 'Aucune charge trouvée pour cette matière' });
        }

        const charge = chargeData[0];

        const { rows: ecueData, count : ecueCount } = await appModel.getMatieresByUE(matiere.id_unite);

        if (ecueCount === 0) {
            return res.status(404).json({ message: 'Aucune ECUE trouvée pour cette matière' });
        }

        const { rows: leconsData, count: leconsCount } = await appModel.getLeconsByCharge(charge.id);
        const { rows: travauxData, count: travauxCount} = await appModel.getTravauxByCharge(charge.id);

        const data = {
            unite: {
                annee: annee,
                promotion: `${matiere.niveau} ${matiere.orientation}(${matiere.systeme})`,
                designation: matiere.unite,
                code: matiere.code_ue,
                mention: matiere.mention,
                filiere: matiere.filiere,
                ecues: ecueData,
                objectifs: matiere.objectifs
            },
            matiere: {
                id: matiere.id,
                designation: matiere.designation,
                credit: parseInt(matiere.credit, 10),
                semestre: matiere.semestre,
                noteUrl: charge.url_document,
                objectif: charge.objectifs_ec,
                place: charge.place_ec,
                penalites: charge.penalites_trvx,
                mode_ens: charge.mode_ens,
                horaire: charge.horaire,
                anneId: charge.id_annee
            },
            seances: leconsData,
            travaux: travauxData,
            animateur: {
                photo: charge.avatar,
                nom: `${charge.nom} ${charge.post_nom} ${charge.prenom}`,
                grade: charge.grade,
                disponibilite: charge.disponibilite,
                email: charge.e_mail,
                telephone: charge.telephone,
                id: charge.id_titulaire,
            }
        }

        return res.status(200).json({
            success: true,
            message: "Descripteur trouvé avec success",
            data
        })
    } catch (error) {
        console.error('Error fetching matiere:', error);
        res.status(500).json({ success: false, message: 'Error fetching matiere', error });
    }
});

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
        let maximum = 0;
        let totalObenue = 0;
        let pourcentage = 0;
        let manqueCote = [];
        let ncv = 0;
        let ncnv = 0;
        let decision = null;

        const appreciation = (ncv, ncnv, pourcentage) => {
            let validation = (ncv + ncnv) > 0 ? ncv * 100 / (ncv + ncnv) : 0;

            if (validation >= 75) {
                if (pourcentage >= 18*100/20) {
                    return {
                        decison: 'Admis',
                        appraciation: 'Excellent',
                        capitalisation: ncnv ? "Oui" : "Non"
                    };
                } else if (pourcentage >= 16*100/20) {
                    return {
                        decison: 'Admis',
                        appraciation: 'Très Bien',
                        capitalisation: ncnv ? "Oui" : "Non"
                    };
                    
                } else if (pourcentage >= 14*100/20) {
                    return {
                        decison: 'Admis',
                        appraciation: 'Bien',
                        capitalisation: ncnv ? "Oui" : "Non"
                    };
                    
                } else if (pourcentage >= 12*100/20) {
                    return {
                        decison: 'Admis',
                        appraciation: 'Assez Bien',
                        capitalisation: ncnv ? "Oui" : "Non"
                    };
                    
                } else if (pourcentage >= 10*100/20) {
                    return {
                        decison: 'Admis',
                        appraciation: 'Passable',
                        capitalisation: ncnv ? "Oui" : "Non"
                    };
                } else {
                    return {
                        decison: 'Admis',
                        appraciation: 'Insuffisant',
                        capitalisation: ncnv ? "Oui" : "Non"
                    };
                    
                }
            } else {
                return {
                    decison: 'Double',
                    appraciation: 'Instatisfaisant',
                    capitalisation: 'Non'                    
                };
            }
        }

        ecues.forEach(unite => {
            let totalUe = 0;
            let creditUe = 0;
            let totalPUe = 0;

            // Ajouter d'abord les lignes de notes individuelles
            unite.notes.forEach(ec => {
                totalPUe += ec.totalP || 0;
                creditUe += ec.credit || 0;

                if (ec.cmi === null || ec.examen === null) {
                    manqueCote.push(true);
                }

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

            maximum += 20 * creditUe;
            totalObenue += totalPUe;

            ncv += totalUe >= 10 ? creditUe : 0;
            ncnv += totalUe < 10 ? creditUe : 0;            // Déterminer si l'UE est validée (moyenne >= 10)
            const isValidated = parseFloat(totalUe) >= 10;
            
            // Ajouter la ligne de résumé de l'UE avec le style approprié
            tableRows.push([
                { 
                    text: `${unite.designation} (${unite.code})`, 
                    colSpan: 4, 
                    fillColor: '#2B579A',
                    color: '#FFFFFF',
                    bold: true,
                    alignment: 'left' 
                },
                '', '', '',
                { 
                    text: creditUe.toString(), 
                    style: isValidated ? 'validCredit' : 'invalidCredit',
                    fillColor: '#2B579A',
                    color: '#FFFFFF',
                },
                { 
                    text: totalUe.toString(), 
                    style: isValidated ? 'validCredit' : 'invalidCredit',
                    fillColor: '#2B579A',
                    color: '#FFFFFF',
                },
                { 
                    text: totalPUe.toFixed(2), 
                    style: isValidated ? 'validCredit' : 'invalidCredit',
                    fillColor: '#2B579A',
                    color: '#FFFFFF',
                }
            ]);
        })

        // Calculer le pourcentage global
        pourcentage = maximum > 0 ? (totalObenue * 100 / maximum).toFixed(2) : '0.00';
        manqueCote = manqueCote.length > 0;
        decision = appreciation(ncv, ncnv, pourcentage);

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
                },                
                {
                    table: {
                        headerRows: 1,
                        widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
                        body: [                            [
                                {
                                    text: 'Elément Constitutif',
                                    fillColor: '#1B4F72',
                                    color: '#FFFFFF',
                                    bold: true,
                                    alignment: 'left',
                                    margin: [0, 5, 0, 5]
                                }, 
                                {
                                    text: 'CMI',
                                    fillColor: '#1B4F72',
                                    color: '#FFFFFF',
                                    bold: true,
                                    alignment: 'center',
                                    margin: [0, 5, 0, 5]
                                }, 
                                {
                                    text: 'EXM',
                                    fillColor: '#1B4F72',
                                    color: '#FFFFFF',
                                    bold: true,
                                    alignment: 'center',
                                    margin: [0, 5, 0, 5]
                                }, 
                                {
                                    text: 'RTP',
                                    fillColor: '#1B4F72',
                                    color: '#FFFFFF',
                                    bold: true,
                                    alignment: 'center',
                                    margin: [0, 5, 0, 5]
                                }, 
                                {
                                    text: 'CRD',
                                    fillColor: '#1B4F72',
                                    color: '#FFFFFF',
                                    bold: true,
                                    alignment: 'center',
                                    margin: [0, 5, 0, 5]
                                }, 
                                {
                                    text: '/20',
                                    fillColor: '#1B4F72',
                                    color: '#FFFFFF',
                                    bold: true,
                                    alignment: 'center',
                                    margin: [0, 5, 0, 5]
                                }, 
                                {
                                    text: 'Total',
                                    fillColor: '#1B4F72',
                                    color: '#FFFFFF',
                                    bold: true,
                                    alignment: 'center',
                                    margin: [0, 5, 0, 5]
                                }
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
                },
                {
                    columns: [
                        {
                            width: '50%',
                            stack: [
                                { text: "", margin: [0, 15, 0, 0] },
                                {
                                    table: {
                                        body: [
                                            [{text: "Resumé des Notes", style: 'tableHeader', alignment: 'center', colSpan: 2}, ""],
                                            ["Maximum", {text: `${maximum}`, bold: true}],
                                            ["Total Obtenu", {text: `${totalObenue.toFixed(2)}`, bold: true}],
                                            ["Pourcentage", {text: `${pourcentage}%`, bold: true}],
                                            ["NCV", {text: `${ncv}`, bold: true}],
                                            ["NCNV", {text: `${ncnv}`, bold: true}],
                                            ["Decison", {text: `${decision.decison}`, bold: true}],
                                            ["Appréciation", {text: `${decision.appraciation}`, bold: true}],
                                            ["Capitalisation", {text: `${decision.capitalisation}`, bold: true}],
                                        ],
                                        widths: ['*', 'auto'],
                                        alignment: 'left',
                                    }
                                }
                            ]
                        },
                        {
                            width: '*',
                            stack: [
                                {text: 'Fait à Mbanza-Ngungu, le ' + new Date().toLocaleDateString('fr-FR'), style: 'subheader', alignment: 'right', margin: [0, 15, 0, 0]},
                                "",
                                {
                                    qr: `https://ista-gm.net/check-result/${commande.id}`,
                                    fit: 120,
                                    alignment: 'right',
                                    margin: [0, 20, 0, 10]
                                },
                            ]

                        },
                        
                    ]
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
                    fillColor: '#2B579A',
                    color: '#FFFFFF',
                    alignment: 'center'
                },
                validCredit: {
                    color: '#27AE60',
                    bold: true,
                    alignment: 'center'
                },
                invalidCredit: {
                    color: '#E74C3C',
                    bold: true,
                    alignment: 'center'
                }
            }
        };
        const pdfBulletin = await generatePdf(docDefinition);
        
        if (!pdfBulletin || pdfBulletin.length === 0) {
            throw new Error('Le PDF généré est vide');
        }
        
        const nomComplet = `${etudiant.nom} ${etudiant.post_nom} ${etudiant.prenom ? etudiant.prenom : ''}`;
        
        const bulletin = await addCoverToPdf(pdfBulletin, nomComplet);
        
        if (!bulletin || bulletin.length === 0) {
            throw new Error('Le PDF final est vide après ajout de la couverture');
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=bulletin_${etudiant.nom}_${new Date().getTime()}.pdf`);
        res.setHeader('Content-Length', bulletin.length);
        
        try {
            res.send(Buffer.from(bulletin));
        } catch (sendError) {
            console.error('Erreur lors de l\'envoi du PDF:', sendError);
            throw sendError;
        }
    } catch (error) {
        console.log('Error info : ', error);
        res.status(500).json({ message: 'Error checking result', error });
    }

});


router.post('/message-section', async (req, res) => {
    const { nom, email, objet, contenu, sectionId } = req.body;
    try {
        const data = await App.addMessageSection({ nom, email, objet, contenu, sectionId });
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Error adding message to section', error });
    }
});

router.post('/subscrib', async (req, res) => {
    console.log('Données reçues:', req.body);
    
    try {
        const { etudiantData, identitesData, scolariteData, promotionData } = req.body;

        // Validation des données requises
        if (!etudiantData || !identitesData || !scolariteData || !promotionData) {
            throw new Error('Données incomplètes');
        }

        const { nom, postNom, preNom, numRef, email, telephone, photo } = etudiantData;

        const getSection = async (filiere) => {
            let currentSection = '';
            switch (filiere) {
                case 'prep':
                    currentSection = 'PREPARATOIRE';
                case 'meca':
                    currentSection = 'MECANIQUE';
                case 'elec':
                    currentSection = 'ELECTRICITE';
                case 'electron':
                    currentSection = 'ELECTRONIQUE';
                case 'telecom':
                    currentSection = 'TELECOMMUNICATION';
                case 'info':
                    currentSection = 'INFORMATIQUE';
                case 'const':
                    currentSection = 'CONSTRUCTION';
                case 'maint':
                    currentSection = 'MAINTENANCE';
                default:
                    currentSection = 'PETROLE ET GAZ';
            }

            const data = await appModel.getProgrammeByName(currentSection);
            
            const { rows, count } = data;
            if (count === 0) {
                throw new Error(`Section ${currentSection} non trouvée`);
            }

            return rows[0];

        }
        
        const getNiveau = async (niveau) => {
            const data = await appModel.getNiveauByName({ name: niveau });
            
            const { rows, count} = data;
            if (count === 0) {
                throw new Error(`Niveau ${niveau} non trouvé`);
            }
            
            return rows[0];
        }

        const niveau = await getNiveau(promotionData.niveau);

        // Sauvegarde de la photo si présente
        const avatar = photo ? await saveImage(photo) : null;
        
        // Validation des données critiques
        if (!nom || !postNom || !promotionData.filiere) {
            throw new Error('Champs obligatoires manquants');
        }
        

        const matricule = `${promotionData.niveau}.${(promotionData.filiere).toString().toUpperCase()}.${new Date().getFullYear()}.${Date.now().toString().slice(-4)}`;

        const section = await getSection(promotionData.filiere);

        // Récupération de l'ID de la section
        if (!section?.id) {
            throw new Error(`Section ${promotionData.section} non trouvée`);
        }

        if (!niveau?.id) {
            throw new Error(`Niveau ${promotionData.niveau} non trouvé`);
        }

        // Création de l'étudiant
        const reqEtudiant = await appModel.createEtudiant({
            nom,
            postNom,
            preNom,
            matricule,
            sexe: identitesData.sexe,
            dateNaissance: identitesData.dateNaissance,
            telephone,
            email,
            photo: avatar
        });
        const { rows, count, lastInsertedId } = reqEtudiant;
        if (!rows || rows.length === 0) {
            throw new Error('Erreur lors de la création de l\'étudiant');
        }
        console.log('Étudiant créé avec succès:', reqEtudiant);
        const id_etudiant = lastInsertedId;

        // Création des informations administratives
        await appModel.createAdminEtudiant({
            id_etudiant,
            section: scolariteData.sectionDiplome,
            option: scolariteData.optionDiplome,
            annee: scolariteData.anneeDiplome,
            pourcentage_exetat: scolariteData.pourcentageDiplome
        });

        // Création des informations d'origine
        await appModel.createOriginEtudiant({
            id_etudiant,
            nomPays: identitesData.pays,
            nomProvince: identitesData.province,
            nomVille: identitesData.lieuNaissance
        });

        // Création de l'inscription
        const reqInscription = await appModel.createInscriptionEtudiant({
            id_etudiant,
            id_section: section.id,
            id_niveau: niveau.id,
            nref: numRef
        });

        res.status(201).json({
            success: true,
            message: 'Étudiant inscrit avec succès',
            data: {
                id_etudiant,
                matricule,
                section: section.id,
                niveau: niveau.id,
                inscriptionId: reqInscription.insertId
            }
        });

    } catch (error) {
        console.error('Erreur d\'inscription:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur lors de l\'inscription',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
});

router.post('/contact', async (req, res) => {
    try {
        const { nom, email, objet, contenu } = req.body;

        // Validation des données
        if (!nom || !email || !objet || !contenu) {
            return res.status(400).json({
                success: false,
                message: 'Tous les champs sont obligatoires'
            });
        }

        // Création du message
        const message = await appModel.createMessage({
            nom,
            email,
            objet,
            contenu
        });

        res.status(201).json({
            success: true,
            message: 'Message envoyé avec succès',
            data: message
        });
    } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur lors de l\'envoi du message',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
});


module.exports = router;