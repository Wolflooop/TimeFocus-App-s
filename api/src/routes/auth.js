const router = require('express').Router();
const auth = require('../controllers/authController');
const apiKeyAuth = require('../middlewares/apiKeyAuth');

// Registro y login (públicos)
router.post('/register', auth.register);
router.post('/login',    auth.login);

// Gestión de API Keys (requieren autenticación)
router.post('/keys',        apiKeyAuth, auth.createKey);
router.delete('/keys/:id',  apiKeyAuth, auth.revokeKey);

module.exports = router;
