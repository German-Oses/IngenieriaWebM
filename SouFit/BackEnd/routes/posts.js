const express = require('express');
const router = express.Router();
const multer = require('multer');
const postController = require('../controllers/postController');
const auth = require('../middleware/authmiddleware');
const uploadPost = require('../middleware/uploadPost');

// Middleware para manejar errores de multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'El archivo es demasiado grande. Máximo 10MB' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

// Rutas protegidas
router.get('/feed', auth, postController.getFeed);
router.get('/usuario/:userId', auth, postController.getPostsByUser);
router.post('/', auth, uploadPost.single('imagen'), uploadPost.validateFileSize, handleMulterError, postController.createPost);
router.put('/:id', auth, postController.updatePost);
router.delete('/:id', auth, postController.deletePost);
router.post('/:id/reaccionar', auth, postController.reaccionarPost);
router.post('/:id/comentar', auth, postController.comentarPost);
router.get('/:id/comentarios', auth, postController.getComentarios);
router.post('/:id/compartir', auth, postController.compartirPost);

module.exports = router;

