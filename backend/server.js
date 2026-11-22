require('dotenv').config();
const http = require('http');
const connectDB = require('./src/config/db');
const app = require('./src/app');
const { init: initSocket } = require('./src/sockets/socket');
const registerListeners = require('./src/events/listeners');
const { startReminderJob } = require('./src/jobs/reminders');

const REQUIRED_ENV = ['MONGO_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

async function start() {
  const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`Missing environment variables: ${missing.join(', ')}. Copy .env.example to .env first.`);
    process.exit(1);
  }
  await connectDB();

  const server = http.createServer(app);
  initSocket(server);
  registerListeners();
  startReminderJob();

  const port = process.env.PORT || 5000;
  server.listen(port, () => console.log(`ScholarMatch API running on http://localhost:${port}`));
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
