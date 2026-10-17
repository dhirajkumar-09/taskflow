const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const boardRoutes = require('./routes/boardRoutes');
const taskRoutes = require('./routes/taskRoutes');
const aiRoutes = require('./routes/aiRoutes');
const invitationRoutes = require('./routes/invitationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const protect = require('./middleware/authMiddleware');


const app = express();

app.use(cors());
// Normalize multiple consecutive slashes in request URL (e.g. //api/boards -> /api/boards)
app.use((req, res, next) => {
  if (req.url && req.url.includes('//')) {
    req.url = req.url.replace(/\/+/g, '/');
  }
  next();
});
// Raised limit so task attachments (sent as base64 JSON) can go through;
// files themselves are still capped per-file in the task controller.
app.use(express.json({ limit: '15mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'TaskFlow server is running' });
});

app.get('/api/protected', protect, (req, res) => {
  res.json({ message: 'You accessed a protected route!', userId: req.userId });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

module.exports = app;
