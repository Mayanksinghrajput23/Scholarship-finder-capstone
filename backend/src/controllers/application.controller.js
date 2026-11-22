const Application = require('../models/Application');
const Scholarship = require('../models/Scholarship');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const events = require('../events/emitter');
const { asyncHandler, ok, fail, csvCell } = require('../utils/helpers');
const { APPLICATION_STATUSES, STUDENT_STATUSES } = require('../config/constants');

const POPULATE = 'title provider type amount lastDate applyLink isActive';

// POST /api/applications  { scholarshipId, status?: 'bookmarked' | 'applied' }
exports.create = asyncHandler(async (req, res) => {
  const { scholarshipId, status = 'bookmarked', notes } = req.body || {};
  const errors = [];
  if (!scholarshipId) errors.push({ field: 'scholarshipId', message: 'scholarshipId is required' });
  if (!STUDENT_STATUSES.includes(status)) errors.push({ field: 'status', message: 'Status must be bookmarked or applied' });
  fail(errors);

  const scholarship = await Scholarship.findById(scholarshipId);
  if (!scholarship || !scholarship.isActive) throw new ApiError(404, 'Scholarship not found');
  if (scholarship.lastDate < new Date()) throw new ApiError(400, 'This scholarship has closed');
  if (await Application.findOne({ user: req.user.id, scholarship: scholarship._id })) {
    throw new ApiError(409, 'You already have this scholarship in your list');
  }

  const app = await Application.create({
    user: req.user.id, scholarship: scholarship._id, status, notes, history: [{ status }],
  });
  if (status === 'applied') await announceApplied(req.user.id, scholarship.title);
  ok(res, app, 201);
});

// GET /api/applications/mine?status=
exports.mine = asyncHandler(async (req, res) => {
  const filter = { user: req.user.id };
  if (req.query.status) filter.status = String(req.query.status);
  const items = await Application.find(filter).populate('scholarship', POPULATE).sort({ updatedAt: -1 }).lean();
  ok(res, items, 200, { total: items.length });
});

// PATCH /api/applications/:id  (student: only own application, only bookmarked <-> applied, notes)
exports.updateMine = asyncHandler(async (req, res) => {
  const app = await Application.findOne({ _id: req.params.id, user: req.user.id }).populate('scholarship', 'title lastDate');
  if (!app) throw new ApiError(404, 'Application not found'); // 404 (not 403) so ids of others are not revealed
  const { status, notes } = req.body || {};

  if (status !== undefined) {
    if (!STUDENT_STATUSES.includes(status)) throw new ApiError(400, 'Students can only set bookmarked or applied');
    if (!STUDENT_STATUSES.includes(app.status)) throw new ApiError(409, 'This application is already being processed and can no longer be changed');
    if (status === 'applied' && app.scholarship.lastDate < new Date()) throw new ApiError(400, 'This scholarship has closed');
    if (status !== app.status) {
      app.status = status;
      app.history.push({ status });
      if (status === 'applied') await announceApplied(req.user.id, app.scholarship.title);
    }
  }
  if (notes !== undefined) app.notes = notes;
  await app.save();
  ok(res, app);
});

exports.removeMine = asyncHandler(async (req, res) => {
  const app = await Application.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!app) throw new ApiError(404, 'Application not found');
  ok(res, { message: 'Removed' });
});

// ---------------- admin ----------------

// GET /api/applications?status=&page=&limit=
exports.listAll = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
  const filter = { status: { $ne: 'bookmarked' } }; // bookmarks are private to students
  if (req.query.status) filter.status = String(req.query.status);

  const [items, total] = await Promise.all([
    Application.find(filter).populate('user', 'name email').populate('scholarship', 'title provider')
      .sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Application.countDocuments(filter),
  ]);
  ok(res, items, 200, { page, limit, total, pages: Math.ceil(total / limit) });
});

// PATCH /api/applications/:id/status  { status }
exports.setStatus = asyncHandler(async (req, res) => {
  const { status } = req.body || {};
  if (!APPLICATION_STATUSES.includes(status)) fail([{ field: 'status', message: `Status must be one of: ${APPLICATION_STATUSES.join(', ')}` }]);

  const app = await Application.findById(req.params.id).populate('scholarship', 'title');
  if (!app) throw new ApiError(404, 'Application not found');
  if (app.status === 'bookmarked') throw new ApiError(409, 'The student has only bookmarked this scholarship and has not applied yet');

  app.status = status;
  app.history.push({ status });
  await app.save();

  events.emit('application:statusChanged', {
    userId: app.user.toString(),
    scholarshipId: app.scholarship._id,
    scholarshipTitle: app.scholarship.title,
    status,
  });
  ok(res, app);
});

async function announceApplied(userId, scholarshipTitle) {
  const user = await User.findById(userId).select('name');
  events.emit('application:applied', { studentName: user ? user.name : 'A student', scholarshipTitle });
}

// PATCH /api/applications/:id/checklist  { index, done }   (student, own application)
exports.toggleChecklist = asyncHandler(async (req, res) => {
  const { index, done } = req.body || {};
  const errors = [];
  if (!Number.isInteger(index)) errors.push({ field: 'index', message: 'index must be a whole number' });
  if (typeof done !== 'boolean') errors.push({ field: 'done', message: 'done must be true or false' });
  fail(errors);

  const app = await Application.findOne({ _id: req.params.id, user: req.user.id });
  if (!app) throw new ApiError(404, 'Application not found');
  if (index < 0 || index >= app.checklist.length) throw new ApiError(400, 'Invalid checklist item');
  app.checklist[index].done = done;
  await app.save();
  ok(res, app);
});

// GET /api/applications/export?status=   (admin) -> CSV download
exports.exportCsv = asyncHandler(async (req, res) => {
  const filter = { status: { $ne: 'bookmarked' } };
  if (req.query.status) filter.status = String(req.query.status);
  const apps = await Application.find(filter).populate('user', 'name email').populate('scholarship', 'title provider amount lastDate')
    .sort({ updatedAt: -1 }).limit(5000).lean();

  const header = ['Student', 'Email', 'Scholarship', 'Provider', 'Amount', 'Last date', 'Status', 'Applied on', 'Last updated'];
  const iso = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');
  const rows = apps.map((a) => [
    a.user && a.user.name, a.user && a.user.email, a.scholarship && a.scholarship.title, a.scholarship && a.scholarship.provider,
    a.scholarship && a.scholarship.amount, a.scholarship && iso(a.scholarship.lastDate), a.status, iso(a.createdAt), iso(a.updatedAt),
  ]);
  const csv = [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="scholarmatch-applications.csv"');
  res.send(`\ufeff${csv}`); // BOM so Excel reads UTF-8 correctly
});
