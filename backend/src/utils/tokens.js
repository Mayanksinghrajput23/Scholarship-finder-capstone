const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const signAccessToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  });

const signRefreshToken = (user) =>
  jwt.sign({ id: user._id, jti: crypto.randomUUID() }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
  });

// Only a hash of the refresh token is stored, so a DB leak does not leak usable tokens.
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

module.exports = { signAccessToken, signRefreshToken, hashToken };
