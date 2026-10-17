const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['task_assigned', 'deadline_warning', 'new_comment', 'task_updated'],
    required: true
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null
  },
  board: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board',
    default: null
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  read: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
