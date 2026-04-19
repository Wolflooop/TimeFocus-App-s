const router = require('express').Router();
const { registro, login, perfil } = require('../controllers/authController');
const { verificarToken } = require('../middlewares/auth');

router.post('/registro', registro);
router.post('/login',    login);
router.get('/perfil',    verificarToken, perfil);

module.exports = router;
