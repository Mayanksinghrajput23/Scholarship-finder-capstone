const mongoose = require('mongoose');

// Stored notifications: they survive page reloads and reach students who were offline.
const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['scholarship', 'status', 'reminder', 'admin'], required: true },
    message: { type: String, required: true, maxlength: 300 },
    link: { type: String, default: '' }, // frontend route to open when clicked
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });
// TTL index: notifications are removed automatically after 60 days.
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 24 * 60 * 60 });

module.exports = mongoose.model('Notification', notificationSchema);
