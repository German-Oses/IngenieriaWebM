const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Crear directorio de uploads si no existe
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let subfolder = 'mensajes';
    
    // Determinar subcarpeta según el tipo de archivo
    if (file.mimetype.startsWith('image/')) {
      subfolder = 'mensajes/imagenes';
    } else if (file.mimetype.startsWith('audio/')) {
      subfolder = 'mensajes/audios';
    }
    
    const folderPath = path.join(uploadsDir, subfolder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    
    cb(null, folderPath);
  },
  filename: function (req, file, cb) {
    // Generar nombre único: timestamp + nombre original
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// Validación mejorada de tipos MIME permitidos
const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const allowedAudioTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm'];

// Filtro de archivos mejorado con validación de extensión
const fileFilter = (req, file, cb) => {
  // Validar por tipo MIME
  const isValidMime = file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/');
  
  if (!isValidMime) {
    return cb(new Error('Solo se permiten archivos de imagen o audio'), false);
  }
  
  // Validación adicional por tipo específico
  if (file.mimetype.startsWith('image/') && !allowedImageTypes.includes(file.mimetype)) {
    return cb(new Error('Tipo de imagen no permitido. Use JPEG, PNG, GIF o WebP'), false);
  }
  
  if (file.mimetype.startsWith('audio/') && !allowedAudioTypes.includes(file.mimetype)) {
    return cb(new Error('Tipo de audio no permitido. Use MP3, WAV, OGG o WebM'), false);
  }
  
  cb(null, true);
};

// Validación adicional de tamaño por tipo
const validateFileSize = (file) => {
  const maxImageSize = 5 * 1024 * 1024; // 5MB para imágenes
  const maxAudioSize = 10 * 1024 * 1024; // 10MB para audio
  
  if (file.mimetype.startsWith('image/') && file.size > maxImageSize) {
    throw new Error('La imagen no puede ser mayor a 5MB');
  }
  
  if (file.mimetype.startsWith('audio/') && file.size > maxAudioSize) {
    throw new Error('El audio no puede ser mayor a 10MB');
  }
  
  return true;
};

// Configuración de multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo
    files: 1, // Solo un archivo a la vez
    fieldSize: 10 * 1024 * 1024 // 10MB para campos
  }
});

// Middleware adicional para validar tamaño
upload.validateFileSize = (req, res, next) => {
  if (req.file) {
    try {
      validateFileSize(req.file);
      next();
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  } else {
    next();
  }
};

module.exports = upload;

