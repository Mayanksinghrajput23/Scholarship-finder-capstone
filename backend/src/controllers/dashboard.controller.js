const mongoose = require('mongoose');
const Scholarship = require('../models/Scholarship');
const Application = require('../models/Application');
const Profile = require('../models/Profile');
const { asyncHandler, ok } = require('../utils/helpers');
const { openFilter, eligibilityQuery, evaluate } = require('../utils/eligibility');

// GET /api/dashboard/student  -> everything the student dashboard needs in one call
exports.student = asyncHandler(async (req, res) => {
  const profile = await Profile.findOne({ user: req.user.id }).lean();
  const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const closingFilter = { ...openFilter(), lastDate: { $gte: new Date(), $lte: in7Days } };

  const [available, closingCount, closing, statusCounts] = await Promise.all([
    Scholarship.countDocuments(openFilter()),
    Scholarship.countDocuments(closingFilter),
    Scholarship.find(closingFilter).sort({ lastDate: 1 }).limit(5).lean(),
    Application.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user.id) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  const progress = {};
  statusCounts.forEach((s) => { progress[s._id] = s.count; });

  let eligibleCount = 0;
  let potentialAmount = 0;
  let eligible = [];
  let almostEligible = [];
  if (profile) {
    const query = eligibilityQuery(profile);
    let sum;
    [eligibleCount, eligible, sum] = await Promise.all([
      Scholarship.countDocuments(query),
      Scholarship.find(query).sort({ lastDate: 1 }).limit(5).lean(),
      Scholarship.aggregate([{ $match: query }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    ]);
    potentialAmount = sum.length ? sum[0].total : 0;
    eligible.forEach((s) => { s.eligibility = evaluate(profile, s); });
    closing.forEach((s) => { s.eligibility = evaluate(profile, s); });

    // "Almost eligible": exactly one rule is not met -> tells the student what to look at.
    const open = await Scholarship.find(openFilter()).lean();
    almostEligible = open
      .map((s) => ({ ...s, eligibility: evaluate(profile, s) }))
      .filter((s) => s.eligibility.failed.length === 1)
      .slice(0, 5);
  }

  ok(res, {
    hasProfile: Boolean(profile),
    stats: {
      available,
      eligible: eligibleCount,
      closingSoon: closingCount,
      bookmarked: progress.bookmarked || 0,
      potentialAmount,
    },
    progress,
    eligible,
    closing,
    almostEligible,
  });
});
