const mongoose = require('mongoose');
const { CATEGORIES, COURSES, STATES, SCHOLARSHIP_TYPES } = require('../config/constants');

// Empty array / null means "no restriction" for that rule.
const scholarshipSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true, minlength: [3, 'Title must be at least 3 characters'], maxlength: 150 },
    provider: { type: String, required: [true, 'Provider is required'], trim: true, maxlength: 120 },
    type: { type: String, enum: { values: SCHOLARSHIP_TYPES, message: 'Type must be merit or welfare' }, required: [true, 'Type is required'] },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    amount: { type: Number, required: [true, 'Amount is required'], min: [0, 'Amount cannot be negative'] },

    // ---- eligibility rules ----
    categories: { type: [{ type: String, enum: CATEGORIES }], default: [] },
    maxIncome: { type: Number, min: [0, 'Income limit cannot be negative'], default: null },
    courses: { type: [{ type: String, enum: COURSES }], default: [] },
    states: { type: [{ type: String, enum: STATES }], default: [] },
    minMarks: { type: Number, min: 0, max: 100, default: 0 },

    prerequisites: { type: [{ type: String, trim: true, maxlength: 200 }], default: [] },
    applyLink: { type: String, trim: true, match: [/^https?:\/\/.+/, 'Apply link must be a valid http(s) URL'], default: '' },
    lastDate: { type: Date, required: [true, 'Last date is required'] },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Index #1: "open scholarships ordered by deadline" and "closing in 7 days"
scholarshipSchema.index({ isActive: 1, lastDate: 1 });
// Index #2: keyword search
scholarshipSchema.index({ title: 'text', provider: 'text', description: 'text' });
// Index #3: category filter
scholarshipSchema.index({ categories: 1 });

module.exports = mongoose.model('Scholarship', scholarshipSchema);
