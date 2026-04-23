// src/routes/account.js
const router = require('express').Router();
const auth   = require('../middlewares/auth');
const ctrl   = require('../controllers/accountController');

router.use(auth);
router.delete('/sessions',  ctrl.clearHistory);   // DELETE /api/account/sessions
router.delete('/me',        ctrl.deleteAccount);  // DELETE /api/account/me

module.exports = router;
