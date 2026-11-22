const router = require('express').Router();
const ctrl = require('../controllers/scholarship.controller');
const { protect, authorize } = require('../middleware/auth');
const validateId = require('../middleware/validateId');

router.param('id', validateId);
router.use(protect);

// Fixed paths first, otherwise ":id" would swallow them.
router.get('/eligible', authorize('student'), ctrl.eligible);
router.get('/closing-soon', ctrl.closingSoon);

router.get('/', ctrl.list);
router.get('/:id', ctrl.getOne);

// Admin only (RBAC)
router.post('/bulk', authorize('admin'), ctrl.bulkImport);
router.post('/', authorize('admin'), ctrl.create);
router.patch('/:id', authorize('admin'), ctrl.update);
router.delete('/:id', authorize('admin'), ctrl.remove);

module.exports = router;
