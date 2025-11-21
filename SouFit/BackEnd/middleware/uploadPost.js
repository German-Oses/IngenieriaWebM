const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Crear directorio de uploads para posts si no existe
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const postsDir = path.join(uploadsDir, 'posts');
if (!fs.existsSync(postsDir)) {
  fs.mkdirSync(postsDir, { recursive: true });
}

// Configuración de almacenamiento para posts
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, postsDir);
  },
  filename: function (req, file, cb) {
    // Generar nombre único: timestamp + nombre original
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `post-${uniqueSuffix}${ext}`);
  }
});

// Validación de tipos MIME permitidos para posts
const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

// Filtro de archivos
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de imagen no permitido. Use JPEG, PNG, GIF o WebP'), false);
    }
  } else {
    cb(new Error('Solo se permiten archivos de imagen'), false);
  }
};

// Configuración de multer para posts
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo
    files: 1 // Solo un archivo a la vez
  }
});

// Middleware para validar tamaño de archivo
upload.validateFileSize = (req, res, next) => {
  if (req.file) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (req.file.size > maxSize) {
      return res.status(400).json({ error: 'La imagen no puede ser mayor a 10MB' });
    }
  }
  next();
};

module.exports = upload;

