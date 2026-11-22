const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');

// router.param('id', validateId) -> 400 for malformed ObjectIds instead of a CastError 500.
module.exports = (req, res, next, value) => {
  if (!mongoose.isValidObjectId(value)) return next(new ApiError(400, 'Invalid id'));
  next();
};
