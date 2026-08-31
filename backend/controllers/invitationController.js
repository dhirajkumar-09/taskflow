const Invitation = require('../models/Invitation');
const Board = require('../models/Board');
const User = require('../models/User');

const populateBoard = (query) =>
  query
    .populate('owner', 'name email')
    .populate('members', 'name email');

// POST /api/invitations   body: { boardId, email }
// Only the board owner can send an invite. This does NOT add the person
// to the board — it just creates a pending request they have to accept.
const sendInvite = async (req, res) => {
  try {
    const { boardId, email } = req.body;
    if (!boardId || !email) {
      return res.status(400).json({ message: 'Board and email are required' });
    }

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }
    if (board.owner.toString() !== req.userId) {
      return res.status(403).json({ message: 'Only the board owner can invite members' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ message: 'No TaskFlow user found with that email' });
    }
    if (user._id.toString() === board.owner.toString()) {
      return res.status(400).json({ message: "You're already the owner of this board" });
    }
    if (board.members.some((m) => m.toString() === user._id.toString())) {
      return res.status(400).json({ message: 'This person is already on the board' });
    }

    const existing = await Invitation.findOne({
      board: boardId,
      invitedUser: user._id,
      status: 'pending'
    });
    if (existing) {
      return res.status(400).json({ message: 'This person already has a pending invite for this board' });
    }

    const invitation = await Invitation.create({
      board: boardId,
      invitedUser: user._id,
      invitedBy: req.userId
    });

    await invitation.populate([
      { path: 'board', select: 'name' },
      { path: 'invitedBy', select: 'name email' }
    ]);

    // Push it live to the invited user if they're online right now
    const io = req.app.get('io');
    io.to(`user:${user._id.toString()}`).emit('invitationReceived', invitation);

    res.status(201).json({ message: 'Invitation sent', invitation });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/invitations — pending invites waiting for the logged-in user
const getMyInvitations = async (req, res) => {
  try {
    const invitations = await Invitation.find({ invitedUser: req.userId, status: 'pending' })
      .populate('board', 'name')
      .populate('invitedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(invitations);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /api/invitations/:id/respond   body: { action: 'accept' | 'decline' }
// Only the invited user can respond to their own invitation.
const respondInvitation = async (req, res) => {
  try {
    const { action } = req.body;
    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({ message: 'action must be "accept" or "decline"' });
    }

    const invitation = await Invitation.findById(req.params.id);
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }
    if (invitation.invitedUser.toString() !== req.userId) {
      return res.status(403).json({ message: 'This invitation is not addressed to you' });
    }
    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: 'This invitation has already been handled' });
    }

    if (action === 'decline') {
      await invitation.deleteOne();
      return res.status(200).json({ message: 'Invitation declined' });
    }

    // action === 'accept'
    const board = await Board.findById(invitation.board);
    if (!board) {
      await invitation.deleteOne();
      return res.status(404).json({ message: 'This board no longer exists' });
    }

    if (!board.members.some((m) => m.toString() === req.userId)) {
      board.members.push(req.userId);
      await board.save();
    }

    const populatedBoard = await populateBoard(Board.findById(board._id));

    const io = req.app.get('io');
    io.to(board._id.toString()).emit('memberAdded', populatedBoard);

    await invitation.deleteOne();

    res.status(200).json({ message: 'Invitation accepted', board: populatedBoard });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { sendInvite, getMyInvitations, respondInvitation };