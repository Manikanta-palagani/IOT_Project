require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const { initSocket } = require('./config/socket');
const { seedDefaultAdmin } = require('./utils/seedAdmin');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  const connected = await connectDB();

  if (connected) {
    await seedDefaultAdmin();
  }

  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5173'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  initSocket(io);

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
