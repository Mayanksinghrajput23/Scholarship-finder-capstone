const Scholarship = require('../models/Scholarship');
const Application = require('../models/Application');
const User = require('../models/User');
const { asyncHandler, ok } = require('../utils/helpers');
const { openFilter } = require('../utils/eligibility');

const { runReminders } = require('../jobs/reminders');

const DAY = 24 * 60 * 60 * 1000;

// GET /api/reports/overview
exports.overview = asyncHandler(async (req, res) => {
  const in7Days = new Date(Date.now() + 7 * DAY);
  const [students, activeStudents, openScholarships, totalScholarships, closingSoon, amountAgg, byStatus] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'student', isActive: true }),
    Scholarship.countDocuments(openFilter()),
    Scholarship.countDocuments(),
    Scholarship.countDocuments({ ...openFilter(), lastDate: { $gte: new Date(), $lte: in7Days } }),
    Scholarship.aggregate([{ $match: openFilter() }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    // Aggregation #1: applications grouped by status
    Application.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);
  ok(res, {
    students, activeStudents, openScholarships, totalScholarships, closingSoon,
    totalOpenAmount: amountAgg.length ? amountAgg[0].total : 0,
    applicationsByStatus: byStatus,
  });
});

// GET /api/reports/trend?range=daily|weekly|monthly|yearly
// Aggregation: $match by date -> $group by time bucket -> gaps filled in JS so the chart has no holes.
exports.trend = asyncHandler(async (req, res) => {
  const range = ['daily', 'weekly', 'monthly', 'yearly'].includes(req.query.range) ? req.query.range : 'monthly';
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const short = (d, opts) => d.toLocaleDateString('en-IN', { ...opts, timeZone: 'UTC' });
  const buckets = [];
  let format = '%Y-%m-%d';
  let dateExpr = '$createdAt';

  if (range === 'daily') {
    for (let i = 13; i >= 0; i -= 1) {
      const d = new Date(today.getTime() - i * DAY);
      buckets.push({ key: d.toISOString().slice(0, 10), label: short(d, { day: 'numeric', month: 'short' }) });
    }
  } else if (range === 'weekly') {
    const monday = new Date(today.getTime() - ((today.getUTCDay() + 6) % 7) * DAY);
    for (let i = 7; i >= 0; i -= 1) {
      const d = new Date(monday.getTime() - i * 7 * DAY);
      buckets.push({ key: d.toISOString().slice(0, 10), label: short(d, { day: 'numeric', month: 'short' }) });
    }
    // move every date back to the Monday of its week, then bucket by that day
    dateExpr = { $subtract: ['$createdAt', { $multiply: [{ $subtract: [{ $isoDayOfWeek: '$createdAt' }, 1] }, DAY] }] };
  } else if (range === 'monthly') {
    format = '%Y-%m';
    for (let i = 11; i >= 0; i -= 1) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      buckets.push({ key: d.toISOString().slice(0, 7), label: short(d, { month: 'short' }) });
    }
  } else {
    format = '%Y';
    for (let i = 4; i >= 0; i -= 1) {
      const y = now.getUTCFullYear() - i;
      buckets.push({ key: String(y), label: String(y) });
    }
  }

  // first bucket start, so older rows are excluded
  const first = buckets[0].key;
  const since = new Date(range === 'yearly' ? `${first}-01-01T00:00:00Z` : range === 'monthly' ? `${first}-01T00:00:00Z` : `${first}T00:00:00Z`);
  const group = (match) => [
    { $match: { createdAt: { $gte: since }, ...match } },
    { $group: { _id: { $dateToString: { format, date: dateExpr } }, count: { $sum: 1 } } },
  ];

  const [apps, studs] = await Promise.all([
    Application.aggregate(group({ status: { $ne: 'bookmarked' } })),
    User.aggregate(group({ role: 'student' })),
  ]);
  const toMap = (rows) => new Map(rows.map((r) => [r._id, r.count]));
  const appMap = toMap(apps);
  const studMap = toMap(studs);

  ok(res, {
    range,
    labels: buckets.map((b) => b.label),
    applications: buckets.map((b) => appMap.get(b.key) || 0),
    registrations: buckets.map((b) => studMap.get(b.key) || 0),
  });
});

const STATUS_LABELS = {
  applied: 'applied', institute_verification: 'moved to institute verification', l2_verification: 'moved to L2 verification',
  sanctioned: 'was sanctioned', paid: 'payment released', rejected: 'was rejected',
};

// GET /api/reports/recent-activity  -> merged feed of registrations, application updates and new scholarships
exports.recentActivity = asyncHandler(async (req, res) => {
  const [users, apps, schs] = await Promise.all([
    User.find({ role: 'student' }).sort({ createdAt: -1 }).limit(5).select('name createdAt').lean(),
    Application.find({ status: { $ne: 'bookmarked' } }).sort({ updatedAt: -1 }).limit(5)
      .populate('user', 'name').populate('scholarship', 'title').lean(),
    Scholarship.find().sort({ createdAt: -1 }).limit(5).select('title createdAt').lean(),
  ]);
  const items = [
    ...users.map((u) => ({ type: 'user', message: `${u.name} registered`, at: u.createdAt })),
    ...apps.map((a) => ({
      type: 'application',
      message: `${a.user ? a.user.name : 'A student'}: ${a.scholarship ? a.scholarship.title : 'scholarship'} ${STATUS_LABELS[a.status] || a.status}`,
      at: a.updatedAt,
    })),
    ...schs.map((s) => ({ type: 'scholarship', message: `New scholarship added: ${s.title}`, at: s.createdAt })),
  ].sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 8);
  ok(res, items);
});

// GET /api/reports/applications-by-scholarship
// Aggregation #2: group -> lookup -> project (most popular scholarships, with status breakdown)
exports.applicationsByScholarship = asyncHandler(async (req, res) => {
  const data = await Application.aggregate([
    {
      $group: {
        _id: '$scholarship',
        total: { $sum: 1 },
        bookmarked: { $sum: { $cond: [{ $eq: ['$status', 'bookmarked'] }, 1, 0] } },
        applied: { $sum: { $cond: [{ $ne: ['$status', 'bookmarked'] }, 1, 0] } },
        sanctioned: { $sum: { $cond: [{ $in: ['$status', ['sanctioned', 'paid']] }, 1, 0] } },
        rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
      },
    },
    { $lookup: { from: 'scholarships', localField: '_id', foreignField: '_id', as: 'scholarship' } },
    { $unwind: '$scholarship' },
    {
      $project: {
        _id: 0, scholarshipId: '$_id', title: '$scholarship.title', provider: '$scholarship.provider',
        lastDate: '$scholarship.lastDate', total: 1, bookmarked: 1, applied: 1, sanctioned: 1, rejected: 1,
      },
    },
    { $sort: { total: -1 } },
    { $limit: 10 },
  ]);
  ok(res, data);
});

// GET /api/reports/scholarships-by-category
// Aggregation #3: $unwind the categories array, then group (empty list = "Open to all")
exports.scholarshipsByCategory = asyncHandler(async (req, res) => {
  const data = await Scholarship.aggregate([
    { $match: openFilter() },
    { $unwind: { path: '$categories', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: { $ifNull: ['$categories', 'Open to all'] },
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        avgAmount: { $avg: '$amount' },
      },
    },
    { $project: { _id: 0, category: '$_id', count: 1, totalAmount: 1, avgAmount: { $round: ['$avgAmount', 0] } } },
    { $sort: { count: -1 } },
  ]);
  ok(res, data);
});

// POST /api/reports/run-reminders  -> runs the deadline-reminder job now (handy for demos and tests)
exports.runRemindersNow = asyncHandler(async (req, res) => {
  const sent = await runReminders();
  ok(res, { sent });
});
