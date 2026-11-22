const events = require('./emitter');
const Profile = require('../models/Profile');
const { notify, notifyMany, notifyAdmins } = require('../utils/notify');
const { evaluate } = require('../utils/eligibility');

const STATUS_LABELS = {
  bookmarked: 'Bookmarked',
  applied: 'Applied',
  institute_verification: 'Institute verification',
  l2_verification: 'L2 verification',
  sanctioned: 'Sanctioned',
  paid: 'Payment released',
  rejected: 'Rejected',
};

// Each listener saves a notification (so it is never lost) and pushes it live over Socket.IO.
module.exports = function registerListeners() {
  events.on('scholarship:created', async (scholarship) => {
    try {
      const profiles = await Profile.find().lean();
      const ids = profiles.filter((p) => evaluate(p, scholarship).eligible).map((p) => p.user);
      await notifyMany(ids, {
        type: 'scholarship',
        message: `New scholarship you are eligible for: ${scholarship.title}`,
        link: '/scholarships?eligible=1',
      });
      console.log(`[event] scholarship:created "${scholarship.title}" -> ${ids.length} eligible student(s) notified`);
    } catch (err) {
      console.error('[event] scholarship:created failed:', err.message);
    }
  });

  events.on('application:statusChanged', async ({ userId, scholarshipTitle, status }) => {
    try {
      await notify(userId, { type: 'status', message: `${scholarshipTitle}: ${STATUS_LABELS[status] || status}`, link: '/applications' });
    } catch (err) {
      console.error('[event] application:statusChanged failed:', err.message);
    }
  });

  events.on('application:applied', async ({ studentName, scholarshipTitle }) => {
    try {
      await notifyAdmins({ type: 'admin', message: `${studentName} applied for ${scholarshipTitle}`, link: '/admin/applications' });
    } catch (err) {
      console.error('[event] application:applied failed:', err.message);
    }
  });

  events.on('deadline:reminder', async ({ userId, scholarshipTitle, daysLeft }) => {
    try {
      const when = daysLeft <= 0 ? 'today' : daysLeft === 1 ? 'tomorrow' : `in ${daysLeft} days`;
      await notify(userId, { type: 'reminder', message: `Reminder: "${scholarshipTitle}" closes ${when}. You have only bookmarked it.`, link: '/bookmarks' });
    } catch (err) {
      console.error('[event] deadline:reminder failed:', err.message);
    }
  });
};
