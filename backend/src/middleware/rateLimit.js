const ApiError = require('../utils/ApiError');

// Minimal in-memory limiter (per IP) to slow down password guessing.
module.exports = ({ windowMs = 15 * 60 * 1000, max = 100 } = {}) => {
  const hits = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
  }, windowMs).unref();

  return (req, res, next) => {
    const now = Date.now();
    const entry = hits.get(req.ip);
    if (!entry || entry.reset < now) {
      hits.set(req.ip, { count: 1, reset: now + windowMs });
      return next();
    }
    entry.count += 1;
    if (entry.count > max) return next(new ApiError(429, 'Too many attempts. Please try again later.'));
    next();
  };
};
