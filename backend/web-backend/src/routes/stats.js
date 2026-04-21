const router = require('express').Router();
const { resumen, calificaciones, tareasVencidas } = require('../controllers/statsController');
const { verificarToken } = require('../middlewares/auth');

router.use(verificarToken);
router.get('/resumen',         resumen);
router.get('/calificaciones',  calificaciones);
router.get('/tareas-vencidas', tareasVencidas);

module.exports = router;
