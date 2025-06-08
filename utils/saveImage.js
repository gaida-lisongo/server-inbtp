const cloudinary = require('./cloudinary');

/**
 * Upload une image base64 sur Cloudinary
 * @param {string} base64Image - Image encodée en base64 (avec ou sans préfixe data:image/...)
 * @param {string} folder - Nom du dossier Cloudinary
 * @returns {Promise<string>} - URL sécurisée de l’image
 */
async function saveImage(base64Image, folder = 'ml_default') {
  try {
    // S’assurer que le base64 est bien formaté
    const dataUri = base64Image.startsWith('data:')
      ? base64Image
      : `data:image/jpeg;base64,${base64Image}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder
    });

    return result.secure_url;
  } catch (error) {
    console.error('Erreur Cloudinary:', error);
    throw new Error("Échec de l'upload de l'image");
  }
}

module.exports = saveImage;
