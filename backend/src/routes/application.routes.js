const router = require('express').Router();
const ctrl = require('../controllers/application.controller');
const { protect, authorize } = require('../middleware/auth');
const validateId = require('../middleware/validateId');

router.param('id', validateId);
router.use(protect);

// Student
router.post('/', authorize('student'), ctrl.create);
router.get('/mine', authorize('student'), ctrl.mine);
router.patch('/:id/checklist', authorize('student'), ctrl.toggleChecklist);
router.patch('/:id', authorize('student'), ctrl.updateMine);
router.delete('/:id', authorize('student'), ctrl.removeMine);

// Admin
router.get('/export', authorize('admin'), ctrl.exportCsv);
router.get('/', authorize('admin'), ctrl.listAll);
router.patch('/:id/status', authorize('admin'), ctrl.setStatus);

module.exports = router;
