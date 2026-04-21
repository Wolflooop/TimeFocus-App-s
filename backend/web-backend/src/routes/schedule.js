const router = require('express').Router();
const { getSchedule, createSchedule, deleteSchedule } = require('../controllers/scheduleController');
const auth = require('../middlewares/auth');

router.use(auth);
router.get('/', getSchedule);
router.post('/', createSchedule);
router.delete('/:id', deleteSchedule);

module.exports = router;