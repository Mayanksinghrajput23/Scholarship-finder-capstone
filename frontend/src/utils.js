export const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export const daysLeft = (d) => Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);

export const STATUS_LABEL = {
  bookmarked: 'Bookmarked',
  applied: 'Applied',
  institute_verification: 'Institute verification',
  l2_verification: 'L2 verification',
  sanctioned: 'Sanctioned',
  paid: 'Payment released',
  rejected: 'Rejected',
};

export const STATUS_FLOW = ['applied', 'institute_verification', 'l2_verification', 'sanctioned', 'paid'];

// Which profile fields are filled -> percentage + list of what is missing.
export function profileCompleteness(profile) {
  const fields = [
    ['category', 'Category'],
    ['income', 'Family income'],
    ['course', 'Course'],
    ['state', 'State'],
    ['marks', 'Marks'],
  ];
  const missing = fields.filter(([k]) => !profile || profile[k] === undefined || profile[k] === null || profile[k] === '').map(([, l]) => l);
  return { percent: Math.round(((fields.length - missing.length) / fields.length) * 100), missing };
}

// Map the API's [{field, message}] array to { field: message }.
export const fieldErrors = (err) => {
  const out = {};
  (err.errors || []).forEach((e) => {
    if (e.field && !out[e.field]) out[e.field] = e.message;
  });
  return out;
};
