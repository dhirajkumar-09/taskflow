const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const protect = require('../middleware/authMiddleware');
const { breakdownTask, boardAssist } = require('../controllers/aiController');

// AI: break a single task into a step-by-step checklist
router.post(
  '/breakdown',
  protect,
  [body('title').trim().notEmpty().withMessage('Task title is required')],
  breakdownTask
);

// AI: analyze a whole board and suggest priority order + workload rebalancing
router.get('/board-assist/:boardId', protect, boardAssist);

module.exports = router;