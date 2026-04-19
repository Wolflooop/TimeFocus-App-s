const router = require('express').Router();
const { listar, crear } = require('../controllers/sesionesController');
const { verificarToken } = require('../middlewares/auth');

router.use(verificarToken);
router.get('/',  listar);
router.post('/', crear);

module.exports = router;
