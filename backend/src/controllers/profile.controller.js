const Profile = require('../models/Profile');
const ApiError = require('../utils/ApiError');
const { asyncHandler, ok, pick } = require('../utils/helpers');

const FIELDS = ['category', 'income', 'course', 'state', 'marks'];

exports.getMine = asyncHandler(async (req, res) => {
  const profile = await Profile.findOne({ user: req.user.id });
  if (!profile) throw new ApiError(404, 'Profile not created yet');
  ok(res, profile);
});

// Create or update in one call (PUT is idempotent). Mongoose validates every field.
exports.upsertMine = asyncHandler(async (req, res) => {
  const data = pick(req.body, FIELDS);
  if (data.income !== undefined) data.income = Number(data.income);
  if (data.marks !== undefined) data.marks = Number(data.marks);

  await new Profile({ user: req.user.id, ...data }).validate(); // throws ValidationError -> 400

  const profile = await Profile.findOneAndUpdate(
    { user: req.user.id },
    { $set: data, $setOnInsert: { user: req.user.id } },
    { new: true, upsert: true, runValidators: true }
  );
  ok(res, profile);
});
