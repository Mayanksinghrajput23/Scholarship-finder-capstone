const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

// Rooms: `user:<id>` (private notifications) and `admins` (all admins).
function init(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173' },
  });

  // Only authenticated users may open a socket: JWT is sent in the handshake.
  io.use((socket, next) => {
    try {
      const payload = jwt.verify(socket.handshake.auth && socket.handshake.auth.token, process.env.JWT_ACCESS_SECRET);
      socket.user = { id: String(payload.id), role: payload.role };
      next();
    } catch (err) {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.user.id}`);
    if (socket.user.role === 'admin') socket.join('admins');
    socket.emit('connected', { message: 'Real-time notifications are active' });
  });

  return io;
}

const getIO = () => io;

module.exports = { init, getIO };
