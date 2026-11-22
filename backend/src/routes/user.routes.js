const router = require('express').Router();
const ctrl = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth');
const validateId = require('../middleware/validateId');

router.param('id', validateId);
router.use(protect, authorize('admin'));
router.get('/', ctrl.list);
router.patch('/:id/active', ctrl.setActive);

module.exports = router;
