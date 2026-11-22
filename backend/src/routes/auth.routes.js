const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const rateLimit = require('../middleware/rateLimit');

const limiter = rateLimit({ max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 100 });

router.post('/register', limiter, ctrl.register);
router.post('/login', limiter, ctrl.login);
router.post('/refresh', limiter, ctrl.refresh);
router.post('/logout', protect, ctrl.logout);
router.post('/change-password', protect, ctrl.changePassword);
router.post('/forgot-password', limiter, ctrl.forgotPassword);
router.post('/reset-password', limiter, ctrl.resetPassword);
router.get('/me', protect, ctrl.me);

module.exports = router;
