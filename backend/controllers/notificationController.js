const Notification = require('../models/Notification');

// Get all notifications for the logged-in user (latest 50)
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('task', 'title')
      .populate('board', 'name');
    res.status(200).json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Mark all notifications as read
const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.userId, read: false }, { read: true });
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Mark a single notification as read
const markOneRead = async (req, res) => {
  try {
    const n = await Notification.findOne({ _id: req.params.id, recipient: req.userId });
    if (!n) return res.status(404).json({ message: 'Notification not found' });
    n.read = true;
    await n.save();
    res.status(200).json({ message: 'Marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Helper: create + push a notification (called from other controllers)
const pushNotification = async (io, { recipient, type, task, board, message }) => {
  try {
    const n = await Notification.create({ recipient, type, task, board, message });
    // Push to the user's personal socket room
    if (io) {
      io.to(`user:${recipient.toString()}`).emit('notification', {
        _id: n._id,
        type: n.type,
        message: n.message,
        task: task || null,
        board: board || null,
        read: false,
        createdAt: n.createdAt
      });
    }
  } catch (err) {
    console.error('pushNotification error:', err.message);
  }
};

module.exports = { getNotifications, markAllRead, markOneRead, pushNotification };
