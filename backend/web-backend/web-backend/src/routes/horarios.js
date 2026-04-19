const router = require('express').Router();
const { listar, crear, eliminar } = require('../controllers/horariosController');
const { verificarToken } = require('../middlewares/auth');

router.use(verificarToken);
router.get('/',       listar);
router.post('/',      crear);
router.delete('/:id', eliminar);

module.exports = router;
