const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const protect = require('../middleware/authMiddleware');
const {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  addAttachments,
  downloadAttachment,
  deleteAttachment,
  addComment,
  toggleReaction
} = require('../controllers/taskController');

router.post(
  '/',
  protect,
  [
    body('title').trim().notEmpty().withMessage('Task title is required'),
    body('boardId').notEmpty().withMessage('Board ID is required'),
    body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority value'),
    body('dueDate').optional({ nullable: true }).isISO8601().withMessage('Invalid due date')
  ],
  createTask
);

router.get('/:boardId', protect, getTasks);

router.put(
  '/:id',
  protect,
  [
    body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority value'),
    body('dueDate').optional({ nullable: true }).isISO8601().withMessage('Invalid due date'),
    body('progress').optional().isInt({ min: 0, max: 100 }).withMessage('Progress must be between 0 and 100')
  ],
  updateTask
);

router.delete('/:id', protect, deleteTask);

// Attachments — assignee/leader upload work-related files, any board member can view
router.post('/:id/attachments', protect, addAttachments);
router.get('/:id/attachments/:attachmentId', protect, downloadAttachment);
router.delete('/:id/attachments/:attachmentId', protect, deleteAttachment);

// Leader review tools — comment on and react to a member's progress updates
router.post(
  '/:id/comments',
  protect,
  [body('text').trim().notEmpty().withMessage('Comment text is required')],
  addComment
);
router.post('/:id/react', protect, toggleReaction);

module.exports = router;