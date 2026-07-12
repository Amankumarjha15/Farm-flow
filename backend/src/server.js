require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

// Attach io to app so controllers/services can emit events, e.g. req.app.get('io').to(userId).emit(...)
app.set('io', io);

io.on('connection', (socket) => {
  // Client emits 'join' with their userId right after connecting so we can
  // target notifications at a specific user room, e.g. io.to(userId).emit(...)
  socket.on('join', (userId) => {
    if (userId) socket.join(userId);
  });

  socket.on('disconnect', () => {
    // no-op placeholder for future presence tracking
  });
});

const start = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`[Farm Flow API] Listening on port ${PORT} (${process.env.NODE_ENV})`);
  });
};

start();

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});
