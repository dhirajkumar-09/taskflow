const Board = require('../models/Board');

// Create a new board
const createBoard = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Board name is required' });
    }

    const newBoard = new Board({
      name,
      owner: req.userId
    });

    await newBoard.save();

    res.status(201).json({ message: 'Board created successfully', board: newBoard });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all boards for the logged-in user
const getBoards = async (req, res) => {
  try {
    const boards = await Board.find({ owner: req.userId }).sort({ createdAt: -1 });
    res.status(200).json(boards);

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

    const io = req.app.get('io');
    io.to(board._id.toString()).emit('boardUpdated', board);

    res.status(200).json({ message: 'Board updated successfully', board });

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

module.exports = { createBoard, getBoards, updateBoard, deleteBoard };