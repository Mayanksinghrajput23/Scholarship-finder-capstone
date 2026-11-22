const router = require('express').Router();
const ctrl = require('../controllers/dashboard.controller');
const { protect, authorize } = require('../middleware/auth');

router.get('/student', protect, authorize('student'), ctrl.student);

module.exports = router;
