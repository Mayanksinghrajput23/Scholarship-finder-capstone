const Notification = require('../models/Notification');
const User = require('../models/User');
const { getIO } = require('../sockets/socket');

// Saves notifications in MongoDB, then pushes them live through Socket.IO to each user's room.
async function notifyMany(userIds, { type, message, link = '' }) {
  if (!userIds.length) return [];
  const docs = await Notification.insertMany(userIds.map((user) => ({ user, type, message, link })));
  const io = getIO();
  if (io) docs.forEach((d) => io.to(`user:${d.user}`).emit('notification', d.toObject()));
  return docs;
}

const notify = (userId, payload) => notifyMany([userId], payload);

async function notifyAdmins(payload) {
  const admins = await User.find({ role: 'admin', isActive: true }).select('_id').lean();
  return notifyMany(admins.map((a) => a._id), payload);
}

module.exports = { notify, notifyMany, notifyAdmins };
