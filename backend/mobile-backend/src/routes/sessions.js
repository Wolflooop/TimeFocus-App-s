const router = require('express').Router();
const { getSessions, createSession, getStats } = require('../controllers/sessionController');
const auth = require('../middlewares/auth');

router.use(auth);
router.get('/', getSessions);
router.post('/', createSession);
router.get('/stats', getStats);

module.exports = router;