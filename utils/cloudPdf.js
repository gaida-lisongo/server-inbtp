const axios = require('axios');

class PdfApi {
  
  constructor(apiKey, cloudName, signingSecret) {
    this.apiKey = apiKey;
    this.cloudName = cloudName;
    this.signingSecret = signingSecret;
    this.endpoint = 'auth';
    this.uploadUrl = '';
    this.documentId = '';
    this.headers = {
      'Content-Type': 'application/json',
      'X-Authorization': `${this.apiKey}`,
    };
    
    this.setBaseUrl(this.endpoint);

    fetch(this.baseUrl, {
        method: 'GET',
        headers: this.headers,
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Authentication successful:', data);
        })
        .catch(error => {
            console.error('Error during authentication:', error);
        });
  }

  setBaseUrl(endpoint) {
    this.baseUrl = `https://api.cloudpdf.io/v2/${endpoint}`;
  }

  getBaseUrl() {
    return this.baseUrl;
  }

  setUploadUrl(uploadUrl) {
    this.uploadUrl = uploadUrl;
  }

  getUploadUrl() {
    return this.uploadUrl;
  }

  setDocumentId(documentId) {
    this.documentId = documentId;
  }

  getDocumentId() {
    return this.documentId;
  }

  async createDocument(name) {
    try {
        this.endpoint = 'documents';
        this.setBaseUrl(this.endpoint);
        
        const response = await fetch(`${this.baseUrl}`, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify({ 
            name,            
            defaultPermissions: {
              search: false,
              selection: false,
              public: true,
              download: "NotAllowed",
              info: ["email"]
            }
          })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData = await response.json();
        const uploadUrl = jsonData.file?.uploadUrl;
        const documentId = jsonData.id;
        const fileId = jsonData.file?.id;

        this.setUploadUrl(uploadUrl);
        this.setDocumentId(documentId);  

        return {
            documentId,
            uploadUrl,
            fileId,
        };
    } catch (error) {
        console.error('Error creating document:', error);
        throw error;
        
    }
  }
  async uploadDocument(buffer, url_document, documentId, fileId) {
    try {
      if (!url_document) {
        throw new Error('URL de téléchargement non définie');
      }

      console.log('Début de l’upload...');

      // Étape 1 — envoyer le fichier
      const response = await axios.put(url_document, buffer, {
        headers: {
          'Content-Type': 'application/pdf',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Progression de l'upload: ${percentCompleted}%`);
        },
      });

      console.log('Fichier uploadé, réponse:', response.status);

      if (response.status !== 200) {
        throw new Error(`Erreur lors de l’upload du fichier: ${response.status}`);
      }

      // Étape 2 — notifier CloudPDF que l’upload est terminé
      const completeResponse = await this.uploadComplete(documentId, fileId);
      console.log('Upload complet:', completeResponse);

      if (!completeResponse || !completeResponse.status) {
        throw new Error('Erreur lors de la finalisation de l’upload');
      }

      return completeResponse;

    } catch (error) {
      console.error('Erreur lors de l’upload du document:', error);
      throw error;
    }
  }


  async uploadComplete(documentId, fileId) {
    try {
      console.log('Completing upload for documentId:', documentId, 'fileId:', fileId);
        if (!documentId || !fileId) {
            throw new Error('ID du document ou du fichier non défini');
        }
        

        const request = await fetch(`https://api.cloudpdf.io/v2/documents/${documentId}/files/${fileId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-Authorization': this.apiKey,
            },
            body: JSON.stringify({
              "uploadCompleted": true,
            }),
        });
        console.log('Request to complete upload:', request);
        if (!request.status == 200) {
            console.error('HTTP error:', request.status, await request.text());
            throw new Error(`HTTP error! status: ${request.status}`);
        }

        const response = await request.json();
        console.log('Upload completed successfully:', response);

        return response;

    } catch (error) {
        console.error('Error completing upload:', error);
        throw error;
    }
  }

  async findADocument(documentId) {
    try {
        if (!documentId) {
            throw new Error('ID du document non défini');
        }

        const response = await fetch(`https://api.cloudpdf.io/v2/documents/${documentId}`, {
            method: 'GET',
            headers: this.headers,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const documentData = await response.json();
        return documentData;

    } catch (error) {
        console.error('Error finding document:', error);
        throw error;
    }
  }

}
const pdfApi = new PdfApi('dxce2OSyaopuIhb_dIW~9J7O4K0zfzM0', 'OBIAVbrTd', 'WFej-32d3SU7Ebl9nFt4NyoTbpmbgOT8jCzZalgFFrk');
module.exports = pdfApi;