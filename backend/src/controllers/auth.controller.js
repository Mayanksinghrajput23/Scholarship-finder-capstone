const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { asyncHandler, ok, fail, passwordErrors } = require('../utils/helpers');
const { signAccessToken, signRefreshToken, hashToken } = require('../utils/tokens');

const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });

// Issues a fresh access + refresh pair and stores the refresh hash (rotation).
async function issueTokens(user) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  await User.updateOne({ _id: user._id }, { refreshTokenHash: hashToken(refreshToken) });
  return { accessToken, refreshToken };
}

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body || {};
  const errors = [];
  if (typeof name !== 'string' || name.trim().length < 2) errors.push({ field: 'name', message: 'Name must be at least 2 characters' });
  if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) errors.push({ field: 'email', message: 'Please provide a valid email' });
  errors.push(...passwordErrors(password));
  fail(errors);

  if (await User.findOne({ email: email.toLowerCase() })) throw new ApiError(409, 'An account with this email already exists');

  // role is never taken from the request: public sign-ups are always students.
  const user = await User.create({ name, email, password, role: 'student' });
  const tokens = await issueTokens(user);
  ok(res, { user: publicUser(user), ...tokens }, 201);
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  const errors = [];
  if (typeof email !== 'string' || !email) errors.push({ field: 'email', message: 'Email is required' });
  if (typeof password !== 'string' || !password) errors.push({ field: 'password', message: 'Password is required' });
  fail(errors);

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  // Same message for unknown email and wrong password: do not reveal which accounts exist.
  if (!user || !(await user.comparePassword(password))) throw new ApiError(401, 'Invalid email or password');
  if (!user.isActive) throw new ApiError(403, 'This account has been deactivated');

  const tokens = await issueTokens(user);
  ok(res, { user: publicUser(user), ...tokens });
});

exports.refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body || {};
  if (typeof refreshToken !== 'string' || !refreshToken) throw new ApiError(400, 'refreshToken is required');

  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (e) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const user = await User.findById(payload.id).select('+refreshTokenHash');
  if (!user || !user.isActive) throw new ApiError(401, 'Invalid refresh token');
  if (user.refreshTokenHash !== hashToken(refreshToken)) {
    // Token was already rotated or revoked: treat as reuse and kill the session.
    await User.updateOne({ _id: user._id }, { refreshTokenHash: null });
    throw new ApiError(401, 'Refresh token has been revoked. Please log in again.');
  }

  const tokens = await issueTokens(user);
  ok(res, tokens);
});

exports.logout = asyncHandler(async (req, res) => {
  await User.updateOne({ _id: req.user.id }, { refreshTokenHash: null });
  ok(res, { message: 'Logged out' });
});

exports.me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  ok(res, publicUser(user));
});

// POST /api/auth/change-password  { currentPassword, newPassword }  (logged-in user)
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  const errors = [];
  if (typeof currentPassword !== 'string' || !currentPassword) errors.push({ field: 'currentPassword', message: 'Current password is required' });
  errors.push(...passwordErrors(newPassword, 'newPassword'));
  if (typeof newPassword === 'string' && newPassword === currentPassword) errors.push({ field: 'newPassword', message: 'New password must be different from the current one' });
  fail(errors);

  const user = await User.findById(req.user.id).select('+password');
  if (!(await user.comparePassword(currentPassword))) throw new ApiError(400, 'Current password is incorrect', [{ field: 'currentPassword', message: 'Current password is incorrect' }]);

  user.password = newPassword; // hashed by the pre-save hook
  await user.save();
  const tokens = await issueTokens(user); // old refresh token stops working
  ok(res, { message: 'Password changed', ...tokens });
});

// POST /api/auth/forgot-password  { email }
// No email service is configured in this project, so the reset link is printed in the server
// console and, outside production, also returned as `devResetLink` so the flow can be demoed.
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body || {};
  if (typeof email !== 'string' || !email) fail([{ field: 'email', message: 'Email is required' }]);

  const payload = { message: 'If an account exists for this email, a password reset link has been generated.' };
  const user = await User.findOne({ email: email.toLowerCase(), isActive: true });
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    await User.updateOne({ _id: user._id }, { resetTokenHash: hashToken(token), resetTokenExpires: new Date(Date.now() + 15 * 60 * 1000) });
    const link = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
    console.log(`[password reset] ${user.email}: ${link}`);
    if (process.env.NODE_ENV !== 'production') payload.devResetLink = link;
  }
  ok(res, payload); // same answer whether or not the email exists
});

// POST /api/auth/reset-password  { token, password }
exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body || {};
  const errors = [];
  if (typeof token !== 'string' || !token) errors.push({ field: 'token', message: 'Reset token is required' });
  errors.push(...passwordErrors(password));
  fail(errors);

  const user = await User.findOne({ resetTokenHash: hashToken(token), resetTokenExpires: { $gt: new Date() } });
  if (!user) throw new ApiError(400, 'This reset link is invalid or has expired');

  user.password = password;
  user.resetTokenHash = null;
  user.resetTokenExpires = null;
  user.refreshTokenHash = null; // log out everywhere
  await user.save();
  ok(res, { message: 'Password updated. You can log in now.' });
});
