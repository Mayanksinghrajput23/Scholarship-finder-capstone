const Scholarship = require('../models/Scholarship');
const Application = require('../models/Application');
const Profile = require('../models/Profile');
const ApiError = require('../utils/ApiError');
const events = require('../events/emitter');
const { asyncHandler, ok, pick, fail, toDeadline } = require('../utils/helpers');
const { openFilter, eligibilityQuery, evaluate } = require('../utils/eligibility');

const WRITABLE = [
  'title', 'provider', 'type', 'description', 'amount', 'categories', 'maxIncome',
  'courses', 'states', 'minMarks', 'prerequisites', 'applyLink', 'lastDate', 'isActive',
];

// For students with a profile, attach a rule-by-rule eligibility explanation.
async function attachEligibility(req, items) {
  if (req.user.role !== 'student') return;
  const profile = await Profile.findOne({ user: req.user.id }).lean();
  if (profile) items.forEach((s) => { s.eligibility = evaluate(profile, s); });
}

function cleanBody(body) {
  const data = pick(body, WRITABLE);
  // list fields may arrive as "A|B|C" (CSV import) - turn them into arrays
  ['categories', 'courses', 'states', 'prerequisites'].forEach((k) => {
    if (typeof data[k] === 'string') data[k] = data[k].split('|').map((x) => x.trim()).filter(Boolean);
  });
  if (typeof data.type === 'string') data.type = data.type.trim().toLowerCase();
  if (data.amount === '') delete data.amount;
  if (data.lastDate === '') delete data.lastDate;
  if (data.maxIncome === '' || data.maxIncome === undefined) delete data.maxIncome;
  if (data.lastDate !== undefined) data.lastDate = toDeadline(data.lastDate);
  if (data.maxIncome !== undefined && data.maxIncome !== null) data.maxIncome = Number(data.maxIncome);
  if (data.amount !== undefined) data.amount = Number(data.amount);
  if (data.minMarks !== undefined) data.minMarks = Number(data.minMarks) || 0;
  return data;
}

// GET /api/scholarships  (search, filters, sort, pagination)
exports.list = asyncHandler(async (req, res) => {
  const { q, category, course, state, type, income, status = 'open', sort = 'deadline' } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 9, 1), 50);
  const isAdmin = req.user.role === 'admin';
  const now = new Date();

  const and = [];
  if (!isAdmin) and.push({ isActive: true });
  if (status === 'open') and.push({ lastDate: { $gte: now } });
  else if (status === 'expired') and.push({ lastDate: { $lt: now } });
  if (q) and.push({ $text: { $search: String(q).slice(0, 100) } });
  // "open to category X" = no category restriction OR X listed
  [['categories', category], ['courses', course], ['states', state]].forEach(([field, value]) => {
    if (value) and.push({ $or: [{ [field]: { $size: 0 } }, { [field]: String(value) }] });
  });
  if (type) and.push({ type: String(type) });
  if (income !== undefined && income !== '' && Number.isFinite(Number(income))) {
    and.push({ $or: [{ maxIncome: null }, { maxIncome: { $gte: Number(income) } }] });
  }

  const filter = and.length ? { $and: and } : {};
  const sorts = { deadline: { lastDate: 1 }, latest: { createdAt: -1 }, amount: { amount: -1 } };

  const [items, total] = await Promise.all([
    Scholarship.find(filter).sort(sorts[sort] || sorts.deadline).skip((page - 1) * limit).limit(limit).lean(),
    Scholarship.countDocuments(filter),
  ]);
  await attachEligibility(req, items);
  ok(res, items, 200, { page, limit, total, pages: Math.ceil(total / limit) });
});

// GET /api/scholarships/eligible  -> THE TWIST: profile matched against every scholarship's rules
exports.eligible = asyncHandler(async (req, res) => {
  const profile = await Profile.findOne({ user: req.user.id }).lean();
  if (!profile) throw new ApiError(404, 'Complete your profile to see eligible scholarships');
  const items = await Scholarship.find(eligibilityQuery(profile)).sort({ lastDate: 1 }).lean();
  items.forEach((s) => { s.eligibility = evaluate(profile, s); });
  ok(res, items, 200, { total: items.length });
});

// GET /api/scholarships/closing-soon?days=7
exports.closingSoon = asyncHandler(async (req, res) => {
  const days = Math.min(Math.max(parseInt(req.query.days, 10) || 7, 1), 60);
  const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  const items = await Scholarship.find({ ...openFilter(), lastDate: { $gte: new Date(), $lte: until } })
    .sort({ lastDate: 1 }).lean();
  await attachEligibility(req, items);
  ok(res, items, 200, { total: items.length, days });
});

exports.getOne = asyncHandler(async (req, res) => {
  const s = await Scholarship.findById(req.params.id).lean();
  if (!s || (req.user.role !== 'admin' && !s.isActive)) throw new ApiError(404, 'Scholarship not found');
  const items = [s];
  await attachEligibility(req, items);
  ok(res, s);
});

exports.create = asyncHandler(async (req, res) => {
  const data = cleanBody(req.body || {});
  if (data.lastDate && !Number.isNaN(data.lastDate.getTime()) && data.lastDate < new Date()) {
    fail([{ field: 'lastDate', message: 'Last date must be in the future' }]);
  }
  const scholarship = await Scholarship.create({ ...data, createdBy: req.user.id });
  events.emit('scholarship:created', scholarship.toObject()); // -> notifies eligible students
  ok(res, scholarship, 201);
});

exports.update = asyncHandler(async (req, res) => {
  const scholarship = await Scholarship.findById(req.params.id);
  if (!scholarship) throw new ApiError(404, 'Scholarship not found');
  scholarship.set(cleanBody(req.body || {}));
  await scholarship.save(); // runs schema validators
  ok(res, scholarship);
});

exports.remove = asyncHandler(async (req, res) => {
  const scholarship = await Scholarship.findByIdAndDelete(req.params.id);
  if (!scholarship) throw new ApiError(404, 'Scholarship not found');
  await Application.deleteMany({ scholarship: scholarship._id }); // no orphaned applications
  ok(res, { message: 'Scholarship deleted' });
});

// POST /api/scholarships/bulk  { items: [ {...scholarship}, ... ] }   (admin, max 200 rows)
// Every row is validated on its own: valid rows are saved, invalid ones are reported with their row number.
exports.bulkImport = asyncHandler(async (req, res) => {
  const items = req.body && req.body.items;
  if (!Array.isArray(items) || items.length === 0) fail([{ field: 'items', message: 'items must be a non-empty array' }]);
  if (items.length > 200) throw new ApiError(400, 'A maximum of 200 rows can be imported at once');

  const docs = [];
  const failed = [];
  for (let i = 0; i < items.length; i += 1) {
    try {
      const data = cleanBody(items[i]);
      if (data.lastDate && !Number.isNaN(data.lastDate.getTime()) && data.lastDate < new Date()) {
        throw new ApiError(400, 'Last date must be in the future');
      }
      const doc = new Scholarship({ ...data, createdBy: req.user.id });
      await doc.validate();
      docs.push(doc);
    } catch (err) {
      failed.push({
        row: i + 1,
        title: items[i] && items[i].title,
        errors: err.errors && !Array.isArray(err.errors) ? Object.values(err.errors).map((e) => e.message) : [err.message],
      });
    }
  }
  if (docs.length) await Scholarship.insertMany(docs, { ordered: false });
  if (docs.length <= 10) docs.forEach((d) => events.emit('scholarship:created', d.toObject())); // avoid a notification flood on big imports
  ok(res, { created: docs.length, failed }, 201);
});
