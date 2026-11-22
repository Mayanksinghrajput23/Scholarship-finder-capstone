const router = require('express').Router();
const ctrl = require('../controllers/profile.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('student'));
router.get('/', ctrl.getMine);
router.put('/', ctrl.upsertMine);

module.exports = router;
