const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Crear directorio de avatares si no existe
const uploadsDir = path.join(__dirname, '../uploads');
const avataresDir = path.join(uploadsDir, 'avatares');
if (!fs.existsSync(avataresDir)) {
  fs.mkdirSync(avataresDir, { recursive: true });
}

// Configuración de almacenamiento para avatares
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, avataresDir);
  },
  filename: function (req, file, cb) {
    // Generar nombre único: userId-timestamp.ext
    const userId = req.user?.id || 'unknown';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${userId}-${uniqueSuffix}${ext}`);
  }
});

// Validación de tipos MIME permitidos para avatares (solo imágenes)
const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

// Filtro de archivos para avatares
const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Solo se permiten archivos de imagen'), false);
  }
  
  if (!allowedImageTypes.includes(file.mimetype)) {
    return cb(new Error('Tipo de imagen no permitido. Use JPEG, PNG, GIF o WebP'), false);
  }
  
  cb(null, true);
};

// Configuración de multer para avatares
const uploadAvatar = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo para avatares
    files: 1
  }
});

module.exports = uploadAvatar;

