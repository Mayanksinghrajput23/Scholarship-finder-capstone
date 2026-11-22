const ApiError = require('./ApiError');

// Wraps async controllers so rejected promises reach the error middleware.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Consistent success envelope: { success, data, meta? }
const ok = (res, data, status = 200, meta) =>
  res.status(status).json({ success: true, data, ...(meta && { meta }) });

const pick = (obj, keys) => {
  const out = {};
  keys.forEach((k) => {
    if (obj && obj[k] !== undefined) out[k] = obj[k];
  });
  return out;
};

const fail = (errors) => {
  if (errors.length) throw new ApiError(400, 'Validation failed', errors);
};

// 'YYYY-MM-DD' -> end of that day in IST so a deadline lasts the whole day.
const toDeadline = (value) => {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T23:59:59.999+05:30`);
  }
  return new Date(value);
};

// Shared password rule: 8+ characters with at least one letter and one number.
const passwordErrors = (password, field = 'password') => {
  if (typeof password !== 'string' || password.length < 8) return [{ field, message: 'Password must be at least 8 characters' }];
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return [{ field, message: 'Password must contain a letter and a number' }];
  return [];
};

// CSV cell: quotes values with commas/quotes/newlines and neutralises spreadsheet formulas (=, +, -, @).
const csvCell = (value) => {
  let s = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

module.exports = { asyncHandler, ok, pick, fail, toDeadline, passwordErrors, csvCell };
