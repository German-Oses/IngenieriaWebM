const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const auth = require('../middleware/authmiddleware');

// Rutas protegidas
router.get('/feed', auth, postController.getFeed);
router.get('/usuario/:userId', auth, postController.getPostsByUser);
router.post('/', auth, postController.createPost);
router.put('/:id', auth, postController.updatePost);
router.delete('/:id', auth, postController.deletePost);
router.post('/:id/reaccionar', auth, postController.reaccionarPost);
router.post('/:id/comentar', auth, postController.comentarPost);
router.get('/:id/comentarios', auth, postController.getComentarios);
router.post('/:id/compartir', auth, postController.compartirPost);

module.exports = router;

