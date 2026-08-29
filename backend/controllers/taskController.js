const Task = require('../models/Task');
const Board = require('../models/Board');
const { validationResult } = require('express-validator');

// Returns: null if board doesn't exist, false if the user has no access,
// or the board document if the user is the owner or a member.
const verifyBoardAccess = async (boardId, userId) => {
  const board = await Board.findById(boardId);
  if (!board) return null;
  const hasAccess = board.owner.toString() === userId ||
    board.members.some((m) => m.toString() === userId);
  if (!hasAccess) return false;
  return board;
};

const populateTask = (query) => query.populate('assignee', 'name email');

// Create a new task
const createTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, status, priority, boardId, assignee } = req.body;

    const board = await verifyBoardAccess(boardId, req.userId);
    if (board === null) {
      return res.status(404).json({ message: 'Board not found' });
    }
    if (board === false) {
      return res.status(403).json({ message: 'Not authorized to add tasks to this board' });
    }

    if (assignee && !board.members.some((m) => m.toString() === assignee) && board.owner.toString() !== assignee) {
      return res.status(400).json({ message: 'Assignee must be a member of this board' });
    }

    const newTask = new Task({
      title,
      description,
      status: status || 'todo',
      priority: priority || 'medium',
      assignee: assignee || null,
      board: boardId
    });

    await newTask.save();
    const populated = await populateTask(Task.findById(newTask._id));

    // Notify everyone in this board's room that a new task was created
    const io = req.app.get('io');
    io.to(boardId).emit('taskCreated', populated);

    res.status(201).json({ message: 'Task created successfully', task: populated });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all tasks for a specific board
const getTasks = async (req, res) => {
  try {
    const { boardId } = req.params;

    const board = await verifyBoardAccess(boardId, req.userId);
    if (board === null) {
      return res.status(404).json({ message: 'Board not found' });
    }
    if (board === false) {
      return res.status(403).json({ message: 'Not authorized to view tasks of this board' });
    }

    const tasks = await populateTask(Task.find({ board: boardId }).sort({ createdAt: 1 }));
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

    const board = await verifyBoardAccess(task.board, req.userId);
    if (board === false || board === null) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    const { title, description, status, priority, assignee } = req.body;

    if (assignee !== undefined && assignee !== null &&
      !board.members.some((m) => m.toString() === assignee) && board.owner.toString() !== assignee) {
      return res.status(400).json({ message: 'Assignee must be a member of this board' });
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (assignee !== undefined) task.assignee = assignee || null;

    await task.save();
    const populated = await populateTask(Task.findById(task._id));

    // Notify everyone in this board's room that a task was updated
    const io = req.app.get('io');
    io.to(task.board.toString()).emit('taskUpdated', populated);

    res.status(200).json({ message: 'Task updated successfully', task: populated });

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

    const board = await verifyBoardAccess(task.board, req.userId);
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
