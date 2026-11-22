const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('./middleware/rateLimit');
const logger = require('./middleware/logger');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();

if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1); // correct client IP behind a proxy
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } })); // security headers
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '10kb' }));
app.use(logger);
// General limiter for the whole API (login routes also have a stricter one)
app.use('/api', rateLimit({ max: Number(process.env.API_RATE_LIMIT_MAX) || 1000 }));

app.get('/api/health', (req, res) => res.json({ success: true, message: 'ScholarMatch API is running' }));

app.use('/api/meta', require('./routes/meta.routes'));
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/profile', require('./routes/profile.routes'));
app.use('/api/scholarships', require('./routes/scholarship.routes'));
app.use('/api/applications', require('./routes/application.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/reports', require('./routes/report.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
