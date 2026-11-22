const Scholarship = require('../models/Scholarship');
const Application = require('../models/Application');
const events = require('../events/emitter');

const DAY = 24 * 60 * 60 * 1000;
const REMIND_WITHIN_DAYS = 3;

// Finds bookmarked (not yet applied) scholarships closing within 3 days and reminds each student once.
async function runReminders() {
  const now = new Date();
  const soon = await Scholarship.find({ isActive: true, lastDate: { $gte: now, $lte: new Date(now.getTime() + REMIND_WITHIN_DAYS * DAY) } })
    .select('title lastDate').lean();
  if (!soon.length) return 0;

  const byId = new Map(soon.map((s) => [String(s._id), s]));
  const apps = await Application.find({ scholarship: { $in: soon.map((s) => s._id) }, status: 'bookmarked', reminderSent: false });

  for (const app of apps) {
    const s = byId.get(String(app.scholarship));
    events.emit('deadline:reminder', {
      userId: app.user.toString(),
      scholarshipTitle: s.title,
      daysLeft: Math.ceil((s.lastDate.getTime() - now.getTime()) / DAY),
    });
    app.reminderSent = true;
    await app.save();
  }
  return apps.length;
}

// Runs shortly after start-up and then every hour.
function startReminderJob() {
  const safeRun = () => runReminders()
    .then((n) => n && console.log(`[reminders] ${n} deadline reminder(s) sent`))
    .catch((err) => console.error('[reminders] failed:', err.message));
  setTimeout(safeRun, 5000).unref();
  setInterval(safeRun, 60 * 60 * 1000).unref();
}

module.exports = { runReminders, startReminderJob };
