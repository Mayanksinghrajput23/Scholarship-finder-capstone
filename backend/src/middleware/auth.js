const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { asyncHandler } = require('../utils/helpers');

// Protected route: requires a valid access token for an active user.
const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) throw new ApiError(401, 'Authentication required');

  let payload;
  try {
    payload = jwt.verify(header.split(' ')[1], process.env.JWT_ACCESS_SECRET);
  } catch (e) {
    throw new ApiError(401, e.name === 'TokenExpiredError' ? 'Access token expired' : 'Invalid token');
  }

  const user = await User.findById(payload.id).select('role isActive');
  if (!user || !user.isActive) throw new ApiError(401, 'Account not found or deactivated');
  req.user = { id: user._id.toString(), role: user.role };
  next();
});

// RBAC: authorize('admin') etc. Must run after protect.
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new ApiError(403, 'You do not have permission to perform this action'));
  }
  next();
};

module.exports = { protect, authorize };
