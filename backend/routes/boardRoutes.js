const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const {
  createBoard,
  getBoards,
  getBoardById,
  updateBoard,
  deleteBoard,
  removeMember,
  toggleFavorite,
  getStats,
  getBoardAnalytics,
  getBoardTemplates
} = require('../controllers/boardController');

router.post('/', protect, createBoard);
router.get('/', protect, getBoards);
router.get('/stats/summary', protect, getStats);       // must come before /:id
router.get('/templates', protect, getBoardTemplates);   // must come before /:id
router.get('/:id', protect, getBoardById);
router.get('/:id/analytics', protect, getBoardAnalytics);
router.put('/:id', protect, updateBoard);
router.delete('/:id', protect, deleteBoard);
router.put('/:id/favorite', protect, toggleFavorite);
router.delete('/:id/members/:userId', protect, removeMember);

module.exports = router;