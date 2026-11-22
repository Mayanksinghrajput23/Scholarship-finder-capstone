const router = require('express').Router();
const c = require('../config/constants');
const { ok } = require('../utils/helpers');

// Public: dropdown values for forms and filters.
router.get('/', (req, res) =>
  ok(res, {
    categories: c.CATEGORIES,
    courses: c.COURSES,
    states: c.STATES,
    types: c.SCHOLARSHIP_TYPES,
    statuses: c.APPLICATION_STATUSES,
    statusFlow: c.STATUS_FLOW,
  })
);

module.exports = router;
