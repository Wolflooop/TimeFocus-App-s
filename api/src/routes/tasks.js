const router = require('express').Router();
const tasks = require('../controllers/tasksController');
const apiKeyAuth = require('../middlewares/apiKeyAuth');

router.use(apiKeyAuth);

router.get('/',      tasks.getTasks);
router.get('/:id',   tasks.getTask);
router.post('/',     tasks.createTask);
router.put('/:id',   tasks.updateTask);
router.delete('/:id', tasks.deleteTask);

module.exports = router;
