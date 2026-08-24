const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const protect = require('../middleware/authMiddleware');
const { createTask, getTasks, updateTask, deleteTask } = require('../controllers/taskController');

router.post(
  '/',
  protect,
  [
    body('title').trim().notEmpty().withMessage('Task title is required'),
    body('boardId').notEmpty().withMessage('Board ID is required'),
    body('status').optional().isIn(['todo', 'in-progress', 'done']).withMessage('Invalid status value')
  ],
  createTask
);

router.get('/:boardId', protect, getTasks);

router.put(
  '/:id',
  protect,
  [
    body('status').optional().isIn(['todo', 'in-progress', 'done']).withMessage('Invalid status value')
  ],
  updateTask
);

router.delete('/:id', protect, deleteTask);

module.exports = router;