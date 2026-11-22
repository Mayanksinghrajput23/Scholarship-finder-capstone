// Single source of truth for dropdown values. The frontend reads them from GET /api/meta.
const CATEGORIES = ['General', 'OBC', 'SC', 'ST', 'EWS'];

const COURSES = [
  'School', 'Diploma', 'Engineering', 'Medical', 'Arts', 'Science',
  'Commerce', 'Law', 'Management', 'Postgraduate', 'PhD',
];

const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh',
];

const SCHOLARSHIP_TYPES = ['merit', 'welfare'];

// Stages follow the National Scholarship Portal flow.
const STATUS_FLOW = ['bookmarked', 'applied', 'institute_verification', 'l2_verification', 'sanctioned', 'paid'];
const APPLICATION_STATUSES = [...STATUS_FLOW, 'rejected'];
// A student may only move between these two; everything after is decided by the admin/officer.
const STUDENT_STATUSES = ['bookmarked', 'applied'];

module.exports = {
  CATEGORIES, COURSES, STATES, SCHOLARSHIP_TYPES,
  STATUS_FLOW, APPLICATION_STATUSES, STUDENT_STATUSES,
};
