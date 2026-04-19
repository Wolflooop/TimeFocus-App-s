const router = require('express').Router();
const { login, register, me } = require('../controllers/authController');
const authMiddleware = require('../middlewares/auth');

router.post('/login', login);
router.post('/register', register);
router.get('/me', authMiddleware, me);

module.exports = router;