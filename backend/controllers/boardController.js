const Board = require('../models/Board');
const User = require('../models/User');

const populateBoard = (query) =>
  query
    .populate('owner', 'name email')
    .populate('members', 'name email');

// Create a new board
const createBoard = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Board name is required' });
    }

    const newBoard = new Board({
      name,
      owner: req.userId,
      members: [req.userId]
    });

    await newBoard.save();
    const board = await populateBoard(Board.findById(newBoard._id));

    res.status(201).json({ message: 'Board created successfully', board });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all boards the logged-in user owns or is a member of
const getBoards = async (req, res) => {
  try {
    const boards = await Board.find({
      $or: [{ owner: req.userId }, { members: req.userId }]
    })
      .populate('members', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(boards);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a single board (with members populated) — owner or member only
const getBoardById = async (req, res) => {
  try {
    const board = await populateBoard(Board.findById(req.params.id));

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const isMember = board.members.some((m) => m._id.toString() === req.userId) ||
      board.owner._id.toString() === req.userId;

    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized to view this board' });
    }

    res.status(200).json(board);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a board
const updateBoard = async (req, res) => {
  try {
    const { name } = req.body;
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    if (board.owner.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to update this board' });
    }

    board.name = name || board.name;
    await board.save();
    const populated = await populateBoard(Board.findById(board._id));

    const io = req.app.get('io');
    io.to(board._id.toString()).emit('boardUpdated', populated);

    res.status(200).json({ message: 'Board updated successfully', board: populated });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a board
const deleteBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    if (board.owner.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this board' });
    }

    const boardId = board._id.toString();

    await board.deleteOne();

    const io = req.app.get('io');
    io.to(boardId).emit('boardDeleted', { boardId });

    res.status(200).json({ message: 'Board deleted successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add a member to a board by email — owner only
const addMember = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const board = await Board.findById(req.params.id);
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
    if (board.members.some((m) => m.toString() === user._id.toString())) {
      return res.status(400).json({ message: 'This person is already on the board' });
    }

    board.members.push(user._id);
    await board.save();
    const populated = await populateBoard(Board.findById(board._id));

    const io = req.app.get('io');
    io.to(board._id.toString()).emit('memberAdded', populated);

    res.status(200).json({ message: 'Member added successfully', board: populated });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Remove a member from a board — owner only, cannot remove the owner
const removeMember = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }
    if (board.owner.toString() !== req.userId) {
      return res.status(403).json({ message: 'Only the board owner can remove members' });
    }
    if (board.owner.toString() === req.params.userId) {
      return res.status(400).json({ message: 'The board owner cannot be removed' });
    }

    board.members = board.members.filter((m) => m.toString() !== req.params.userId);
    await board.save();
    const populated = await populateBoard(Board.findById(board._id));

    const io = req.app.get('io');
    io.to(board._id.toString()).emit('memberRemoved', populated);

    res.status(200).json({ message: 'Member removed successfully', board: populated });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { createBoard, getBoards, getBoardById, updateBoard, deleteBoard, addMember, removeMember };
