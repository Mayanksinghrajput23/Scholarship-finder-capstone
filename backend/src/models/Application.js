const mongoose = require('mongoose');
const { APPLICATION_STATUSES } = require('../config/constants');

// Relationship: User (many) <-> Scholarship (many) through Application.
const applicationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    scholarship: { type: mongoose.Schema.Types.ObjectId, ref: 'Scholarship', required: true },
    status: { type: String, enum: { values: APPLICATION_STATUSES, message: 'Invalid status' }, default: 'bookmarked' },
    notes: { type: String, trim: true, maxlength: [500, 'Notes must be at most 500 characters'], default: '' },
    history: {
      type: [{ status: String, at: { type: Date, default: Date.now }, _id: false }],
      default: [],
    },
    // Documents checklist, copied from the scholarship's prerequisites when the entry is created.
    checklist: {
      type: [{ label: { type: String, maxlength: 200 }, done: { type: Boolean, default: false }, _id: false }],
      default: [],
    },
    // Set once the "closing soon" reminder has been sent, so it is sent only once.
    reminderSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// A student can have only one application/bookmark per scholarship.
applicationSchema.index({ user: 1, scholarship: 1 }, { unique: true });
applicationSchema.index({ status: 1 });
applicationSchema.index({ scholarship: 1, status: 1, reminderSent: 1 });

applicationSchema.pre('save', async function copyChecklist(next) {
  if (this.isNew && this.checklist.length === 0) {
    const s = await mongoose.model('Scholarship').findById(this.scholarship).select('prerequisites').lean();
    if (s && s.prerequisites) this.checklist = s.prerequisites.map((label) => ({ label, done: false }));
  }
  next();
});

module.exports = mongoose.model('Application', applicationSchema);
