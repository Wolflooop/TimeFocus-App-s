const router = require('express').Router();
const stats = require('../controllers/statsController');
const apiKeyAuth = require('../middlewares/apiKeyAuth');

router.use(apiKeyAuth);

// Stats
router.get('/summary', stats.getSummary);
router.get('/daily',   stats.getDaily);
router.get('/weekly',  stats.getWeekly);

// Sessions
router.get('/sessions',  stats.getSessions);
router.post('/sessions', stats.createSession);

module.exports = router;
