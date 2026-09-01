const mongoose = require('mongoose');
const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'done'],
    default: 'todo'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  dueDate: {
    type: Date,
    default: null
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  // Free-text note the assignee leaves when reporting progress to the leader
  progressNote: {
    type: String,
    trim: true,
    default: ''
  },
  board: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board',
    required: true
  },
  // Who assigned/created this task — always the board leader
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Work-related files/photos the assignee attaches as proof of progress
  attachments: [{
    originalName: { type: String, required: true },
    storedName: { type: String, required: true },
    mimeType: { type: String, default: 'application/octet-stream' },
    size: { type: Number, default: 0 },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now }
  }],
  // Leader responses to the assignee's progress updates
  comments: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, trim: true, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  // Leader likes/reacts to progress updates (one reaction per user)
  reactions: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, default: 'like' },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });
module.exports = mongoose.model('Task', taskSchema);
