const mongoose = require('mongoose');
const { CATEGORIES, COURSES, STATES } = require('../config/constants');

// One profile per student (1:1 with User). Student fills it once; eligibility is computed from it.
const profileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    category: { type: String, enum: { values: CATEGORIES, message: 'Invalid category' }, required: [true, 'Category is required'] },
    income: { type: Number, required: [true, 'Family income is required'], min: [0, 'Income cannot be negative'] },
    course: { type: String, enum: { values: COURSES, message: 'Invalid course' }, required: [true, 'Course is required'] },
    state: { type: String, enum: { values: STATES, message: 'Invalid state' }, required: [true, 'State is required'] },
    marks: {
      type: Number,
      required: [true, 'Marks are required'],
      min: [0, 'Marks must be between 0 and 100'],
      max: [100, 'Marks must be between 0 and 100'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Profile', profileSchema);
