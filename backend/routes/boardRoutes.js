const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const {
  createBoard,
  getBoards,
  getBoardById,
  updateBoard,
  deleteBoard,
  addMember,
  removeMember,
  toggleFavorite,
  getStats
} = require('../controllers/boardController');

router.post('/', protect, createBoard);
router.get('/', protect, getBoards);
router.get('/stats/summary', protect, getStats); // must come before /:id
router.get('/:id', protect, getBoardById);
router.put('/:id', protect, updateBoard);
router.delete('/:id', protect, deleteBoard);
router.put('/:id/favorite', protect, toggleFavorite);
router.post('/:id/members', protect, addMember);
router.delete('/:id/members/:userId', protect, removeMember);

module.exports = router;
