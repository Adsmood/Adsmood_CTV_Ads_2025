const express = require('express');
const multer = require('multer');
const B2 = require('backblaze-b2');
const router = express.Router();

// Configuración de multer para almacenamiento en memoria
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
    files: 1
  }
});

// Configuración de B2
const b2 = new B2({
  applicationKeyId: process.env.B2_APPLICATION_KEY_ID,
  applicationKey: process.env.B2_APPLICATION_KEY
});

// Autorización inicial de B2
(async () => {
  try {
    await b2.authorize();
    console.log('Backblaze B2 autorizado exitosamente');
  } catch (err) {
    console.error('Error autorizando B2:', err);
  }
})();

// Middleware para validar tipos de archivo
const validateFileType = (req, res, next) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
  if (!req.file || !allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({ 
      error: 'Tipo de archivo no permitido. Solo se permiten JPG, PNG, GIF y MP4.' 
    });
  }
  next();
};

// Ruta para subir archivos
router.post('/upload', upload.single('asset'), validateFileType, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo' });
    }

    const fileBuffer = req.file.buffer;
    const fileName = `${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const bucketId = process.env.B2_BUCKET_ID;

    // Obtener URL de upload y token
    const uploadUrlResponse = await b2.getUploadUrl({ bucketId });
    const { uploadUrl, authorizationToken } = uploadUrlResponse.data;

    // Subir archivo a B2
    const uploadResponse = await b2.uploadFile({
      uploadUrl,
      uploadAuthToken: authorizationToken,
      fileName,
      data: fileBuffer,
      contentType: req.file.mimetype,
      onUploadProgress: (event) => {
        console.log(`Progress: ${Math.round((event.loaded * 100) / event.total)}%`);
      }
    });

    // Construir URL pública
    const publicUrl = `${process.env.B2_PUBLIC_URL}${fileName}`;

    res.json({ 
      url: publicUrl,
      fileName: fileName,
      size: req.file.size,
      type: req.file.mimetype
    });

  } catch (error) {
    console.error('Error subiendo archivo a B2:', error);
    
    // Si el error es de autorización, intentar reautorizar
    if (error.status === 401) {
      try {
        await b2.authorize();
        return res.status(500).json({ 
          error: 'Error temporal de autorización. Por favor, intente nuevamente.' 
        });
      } catch (authError) {
        console.error('Error de reautorización:', authError);
      }
    }

    res.status(500).json({ 
      error: 'Error al subir el archivo',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router; 