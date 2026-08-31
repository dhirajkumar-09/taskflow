const mongoose = require('mongoose');

// Represents a pending "join this board" request sent by a board owner
// to another user. The invited user must accept it before they become
// a member — they are never added to a board directly.
const invitationSchema = new mongoose.Schema({
  board: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board',
    required: true
  },
  invitedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('Invitation', invitationSchema);