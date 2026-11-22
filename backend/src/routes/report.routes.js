const router = require('express').Router();
const ctrl = require('../controllers/report.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));
router.get('/overview', ctrl.overview);
router.get('/trend', ctrl.trend);
router.get('/recent-activity', ctrl.recentActivity);
router.post('/run-reminders', ctrl.runRemindersNow);
router.get('/applications-by-scholarship', ctrl.applicationsByScholarship);
router.get('/scholarships-by-category', ctrl.scholarshipsByCategory);

module.exports = router;
