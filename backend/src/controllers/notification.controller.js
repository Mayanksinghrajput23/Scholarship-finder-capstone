const Notification = require('../models/Notification');
const { asyncHandler, ok } = require('../utils/helpers');

// GET /api/notifications  -> latest 30 for the logged-in user + unread count
exports.list = asyncHandler(async (req, res) => {
  const [items, unread] = await Promise.all([
    Notification.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(30).lean(),
    Notification.countDocuments({ user: req.user.id, read: false }),
  ]);
  ok(res, items, 200, { unread });
});

exports.readAll = asyncHandler(async (req, res) => {
  const r = await Notification.updateMany({ user: req.user.id, read: false }, { read: true });
  ok(res, { updated: r.modifiedCount });
});

exports.clearAll = asyncHandler(async (req, res) => {
  const r = await Notification.deleteMany({ user: req.user.id });
  ok(res, { deleted: r.deletedCount });
});
