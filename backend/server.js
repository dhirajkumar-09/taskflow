const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = require('./app');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

// Make io accessible inside our route controllers via req.app.get('io')
app.set('io', io);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // When a user logs in / opens the app, they join a personal room so we
  // can push things like invitation notifications straight to them.
  socket.on('registerUser', (userId) => {
    if (userId) {
      socket.join(`user:${userId}`);
    }
  });

  // When a user opens a board, they join that board's "room"
  socket.on('joinBoard', (boardId) => {
    socket.join(boardId);
    console.log('Socket ' + socket.id + ' joined board room: ' + boardId);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});
