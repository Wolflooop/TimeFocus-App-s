const router = require('express').Router();
const { getNotifications, createNotification, markAsRead } = require('../controllers/notificationController');
const auth = require('../middlewares/auth');

router.use(auth);
router.get('/', getNotifications);
router.post('/', createNotification);
router.put('/:id/read', markAsRead);

module.exports = router;