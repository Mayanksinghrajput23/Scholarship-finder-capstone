// The "unique twist": match a student's profile against each scholarship's rules.
// Empty array / null on a scholarship means that rule is not restricted.

const openFilter = () => ({ isActive: true, lastDate: { $gte: new Date() } });

/** MongoDB query: open scholarships whose every rule is satisfied by the profile. */
function eligibilityQuery(profile) {
  return {
    ...openFilter(),
    $and: [
      { $or: [{ categories: { $size: 0 } }, { categories: profile.category }] },
      { $or: [{ maxIncome: null }, { maxIncome: { $gte: profile.income } }] },
      { $or: [{ courses: { $size: 0 } }, { courses: profile.course }] },
      { $or: [{ states: { $size: 0 } }, { states: profile.state }] },
      { minMarks: { $lte: profile.marks } },
    ],
  };
}

const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

/** Rule-by-rule explanation, used for "why eligible" / "what is missing". */
function evaluate(profile, s) {
  const list = (rule, arr, value) => ({
    rule,
    pass: !arr || arr.length === 0 || arr.includes(value),
    required: !arr || arr.length === 0 ? 'Any' : arr.join(', '),
    actual: value,
  });
  const checks = [
    list('Category', s.categories, profile.category),
    {
      rule: 'Family income',
      pass: s.maxIncome == null || profile.income <= s.maxIncome,
      required: s.maxIncome == null ? 'No limit' : `up to ${inr(s.maxIncome)}`,
      actual: inr(profile.income),
    },
    list('Course', s.courses, profile.course),
    list('State', s.states, profile.state),
    {
      rule: 'Minimum marks',
      pass: profile.marks >= (s.minMarks || 0),
      required: s.minMarks ? `${s.minMarks}%` : 'None',
      actual: `${profile.marks}%`,
    },
  ];
  const failed = checks.filter((c) => !c.pass).map((c) => c.rule);
  return { eligible: failed.length === 0, failed, checks };
}

module.exports = { openFilter, eligibilityQuery, evaluate };
