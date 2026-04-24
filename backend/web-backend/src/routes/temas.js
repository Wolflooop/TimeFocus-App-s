const router = require('express').Router();
const { listar, obtener, crear, actualizar, eliminar } = require('../controllers/temasController');
const authMiddleware = require('../middlewares/auth');
 
router.use(authMiddleware);
 
router.get('/',       listar);
router.get('/:id',    obtener);
router.post('/',      crear);
router.put('/:id',    actualizar);
router.delete('/:id', eliminar);
 
module.exports = router;