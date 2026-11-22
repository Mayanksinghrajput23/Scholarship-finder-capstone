const User = require('../models/User');
const Profile = require('../models/Profile');
const ApiError = require('../utils/ApiError');
const { asyncHandler, ok, fail } = require('../utils/helpers');

// GET /api/users?q=&page=&limit=   (admin: manage students)
exports.list = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
  const filter = { role: 'student' };
  if (req.query.q) {
    const re = new RegExp(String(req.query.q).slice(0, 50).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: re }, { email: re }];
  }
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    User.countDocuments(filter),
  ]);
  const profiles = await Profile.find({ user: { $in: users.map((u) => u._id) } }).lean();
  const byUser = new Map(profiles.map((p) => [String(p.user), p]));
  const items = users.map((u) => ({
    id: u._id, name: u.name, email: u.email, isActive: u.isActive, createdAt: u.createdAt,
    profile: byUser.get(String(u._id)) || null,
  }));
  ok(res, items, 200, { page, limit, total, pages: Math.ceil(total / limit) });
});

// PATCH /api/users/:id/active  { isActive: boolean }
exports.setActive = asyncHandler(async (req, res) => {
  const { isActive } = req.body || {};
  if (typeof isActive !== 'boolean') fail([{ field: 'isActive', message: 'isActive must be true or false' }]);
  const user = await User.findOne({ _id: req.params.id, role: 'student' });
  if (!user) throw new ApiError(404, 'Student not found');
  user.isActive = isActive;
  if (!isActive) user.refreshTokenHash = null; // force logout
  await user.save();
  ok(res, { id: user._id, isActive: user.isActive });
});
