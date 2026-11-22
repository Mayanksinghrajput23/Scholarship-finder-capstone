const router = require('express').Router();
const ctrl = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth');

router.use(protect); // every user (student or admin) sees only their own notifications
router.get('/', ctrl.list);
router.patch('/read-all', ctrl.readAll);
router.delete('/', ctrl.clearAll);

module.exports = router;
