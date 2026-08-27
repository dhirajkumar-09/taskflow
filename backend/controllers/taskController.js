const Task = require('../models/Task');
const Board = require('../models/Board');
const { validationResult } = require('express-validator');

const verifyBoardOwnership = async (boardId, userId) => {
  const board = await Board.findById(boardId);
  if (!board) return null;
  if (board.owner.toString() !== userId) return false;
  return board;
};

// Create a new task
const createTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, status, boardId } = req.body;

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

    // Notify everyone in this board's room that a new task was created
    const io = req.app.get('io');
    io.to(boardId).emit('taskCreated', newTask);

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

// Update a task
const updateTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

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

    // Notify everyone in this board's room that a task was updated
    const io = req.app.get('io');
    io.to(task.board.toString()).emit('taskUpdated', task);

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

    const boardId = task.board.toString();
    const taskId = task._id.toString();

    await task.deleteOne();

    // Notify everyone in this board's room that a task was deleted
    const io = req.app.get('io');
    io.to(boardId).emit('taskDeleted', { taskId });

    res.status(200).json({ message: 'Task deleted successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { createTask, getTasks, updateTask, deleteTask };