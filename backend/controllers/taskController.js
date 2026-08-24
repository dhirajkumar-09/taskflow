const Task = require('../models/Task');
const Board = require('../models/Board');

// Helper function: check if the board belongs to the logged-in user
const verifyBoardOwnership = async (boardId, userId) => {
  const board = await Board.findById(boardId);
  if (!board) return null;
  if (board.owner.toString() !== userId) return false;
  return board;
};

// Create a new task
const createTask = async (req, res) => {
  try {
    const { title, description, status, boardId } = req.body;

    if (!title || !boardId) {
      return res.status(400).json({ message: 'Title and boardId are required' });
    }

    const board = await verifyBoardOwnership(boardId, req.userId);
    if (board === null) {
      return res.status(404).json({ message: 'Board not found' });
    }
    if (board === false) {
      return res.status(403).json({ message: 'Not authorized to add tasks to this board' });
    }

    const newTask = new Task({
      title,
      description,
      status: status || 'todo',
      board: boardId
    });

    await newTask.save();

    res.status(201).json({ message: 'Task created successfully', task: newTask });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all tasks for a specific board
const getTasks = async (req, res) => {
  try {
    const { boardId } = req.params;

    const board = await verifyBoardOwnership(boardId, req.userId);
    if (board === null) {
      return res.status(404).json({ message: 'Board not found' });
    }
    if (board === false) {
      return res.status(403).json({ message: 'Not authorized to view tasks of this board' });
    }

    const tasks = await Task.find({ board: boardId }).sort({ createdAt: 1 });
    res.status(200).json(tasks);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a task (including status change for drag-and-drop)
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const board = await verifyBoardOwnership(task.board, req.userId);
    if (board === false || board === null) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    const { title, description, status } = req.body;

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;

    await task.save();

    res.status(200).json({ message: 'Task updated successfully', task });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a task
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const board = await verifyBoardOwnership(task.board, req.userId);
    if (board === false || board === null) {
      return res.status(403).json({ message: 'Not authorized to delete this task' });
    }

    await task.deleteOne();

    res.status(200).json({ message: 'Task deleted successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { createTask, getTasks, updateTask, deleteTask };