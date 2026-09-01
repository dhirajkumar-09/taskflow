const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const boardRoutes = require('./routes/boardRoutes');
const taskRoutes = require('./routes/taskRoutes');
const aiRoutes = require('./routes/aiRoutes');
const invitationRoutes = require('./routes/invitationRoutes');
const protect = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

// Make io accessible inside our route controllers via req.app.get('io')
app.set('io', io);

app.use(cors());
// Raised limit so task attachments (sent as base64 JSON) can go through;
// files themselves are still capped per-file in the task controller.
app.use(express.json({ limit: '15mb' }));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/invitations', invitationRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'TaskFlow server is running' });
});

app.get('/api/protected', protect, (req, res) => {
  res.json({ message: 'You accessed a protected route!', userId: req.userId });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

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